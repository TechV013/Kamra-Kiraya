import { prisma } from "@/lib/prisma";

export interface DateAvailability {
  date: string;
  availableCount: number;
  reservedCount: number;
  effectiveAvailable: number;
  isBlocked: boolean;
}

function getDateRange(checkIn: Date, checkOut: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(checkIn);
  current.setHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);
  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function normalizeDate(d: Date): Date {
  const normalized = new Date(d);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export async function checkAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<{ available: boolean; dates: DateAvailability[]; message?: string }> {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return { available: false, dates: [], message: "Room not found" };
  if (!room.isAvailable) return { available: false, dates: [], message: "Room is not available" };
  if (room.status !== "APPROVED") return { available: false, dates: [], message: "Room is not approved" };

  const dates = getDateRange(checkIn, checkOut);
  if (dates.length === 0) return { available: false, dates: [], message: "Invalid date range" };

  const existingAvail = await prisma.roomAvailability.findMany({
    where: { roomId, date: { gte: dates[0], lte: dates[dates.length - 1] } },
  });

  const availMap = new Map<string, RoomAvailability>();
  for (const a of existingAvail) {
    const key = normalizeDate(a.date).toISOString().split("T")[0];
    availMap.set(key, a);
  }

  const overlappingBookingFilter: Record<string, unknown> = {
    roomId,
    status: { in: ["CONFIRMED", "COMPLETED"] },
    checkIn: { lt: checkOut },
    checkOut: { gt: checkIn },
  };
  if (excludeBookingId) {
    overlappingBookingFilter.id = { not: excludeBookingId };
  }

  const overlappingBookings = await prisma.booking.findMany({
    where: overlappingBookingFilter,
    select: { id: true, checkIn: true, checkOut: true },
  });

  const occupiedDateCounts = new Map<string, number>();
  for (const booking of overlappingBookings) {
    const bookingDates = getDateRange(booking.checkIn, booking.checkOut);
    for (const d of bookingDates) {
      const key = normalizeDate(d).toISOString().split("T")[0];
      occupiedDateCounts.set(key, (occupiedDateCounts.get(key) || 0) + 1);
    }
  }

  const dateResults: DateAvailability[] = [];
  let allAvailable = true;

  for (const date of dates) {
    const key = normalizeDate(date).toISOString().split("T")[0];
    const avail = availMap.get(key);
    const totalRooms = room.totalRooms;
    const overlappingCount = occupiedDateCounts.get(key) || 0;

    let availableCount: number;
    let reservedCount: number;
    let isBlocked = false;

    if (avail) {
      availableCount = avail.availableCount;
      reservedCount = avail.reservedCount;
      isBlocked = avail.isBlocked;
    } else {
      availableCount = totalRooms;
      reservedCount = 0;
    }

    const effectiveAvailable = availableCount - Math.max(reservedCount, overlappingCount) - (isBlocked ? availableCount : 0);

    dateResults.push({
      date: key,
      availableCount,
      reservedCount: Math.max(reservedCount, overlappingCount),
      effectiveAvailable: Math.max(0, effectiveAvailable),
      isBlocked,
    });

    if (effectiveAvailable <= 0) allAvailable = false;
  }

  return {
    available: allAvailable,
    dates: dateResults,
    message: allAvailable ? undefined : "Not enough availability for one or more dates in the range",
  };
}

export async function reserveInventory(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  bookingId: string
): Promise<boolean> {
  const dates = getDateRange(checkIn, checkOut);
  if (dates.length === 0) return false;

  try {
    await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: roomId }, select: { totalRooms: true } });
      if (!room) throw new Error("Room not found");

      for (const date of dates) {
        const normalizedDate = normalizeDate(date);

        const existing = await tx.roomAvailability.findUnique({
          where: { roomId_date: { roomId, date: normalizedDate } },
        });

        if (existing) {
          if (existing.isBlocked) throw new Error(`Date ${normalizedDate.toISOString().split("T")[0]} is blocked`);
          if (existing.availableCount - existing.reservedCount <= 0) {
            throw new Error(`No availability for ${normalizedDate.toISOString().split("T")[0]}`);
          }
          await tx.roomAvailability.update({
            where: { id: existing.id },
            data: { reservedCount: { increment: 1 } },
          });
        } else {
          await tx.roomAvailability.create({
            data: {
              roomId,
              date: normalizedDate,
              availableCount: room.totalRooms,
              reservedCount: 1,
            },
          });
        }
      }
    });

    return true;
  } catch (err) {
    console.error("Reserve inventory error:", err);
    return false;
  }
}

export async function releaseInventory(
  roomId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  const dates = getDateRange(checkIn, checkOut);
  if (dates.length === 0) return false;

  try {
    await prisma.$transaction(async (tx) => {
      for (const date of dates) {
        const normalizedDate = normalizeDate(date);
        const existing = await tx.roomAvailability.findUnique({
          where: { roomId_date: { roomId, date: normalizedDate } },
        });

        if (existing && existing.reservedCount > 0) {
          const newReserved = existing.reservedCount - 1;
          if (newReserved <= 0) {
            await tx.roomAvailability.delete({ where: { id: existing.id } });
          } else {
            await tx.roomAvailability.update({
              where: { id: existing.id },
              data: { reservedCount: newReserved },
            });
          }
        }
      }
    });

    return true;
  } catch (err) {
    console.error("Release inventory error:", err);
    return false;
  }
}

export async function setRoomAvailability(
  roomId: string,
  updates: Array<{ date: string; availableCount?: number; isBlocked?: boolean }>
): Promise<void> {
  const normalizedUpdates = updates.map((u) => ({
    ...u,
    date: normalizeDate(new Date(u.date)),
  }));

  await prisma.$transaction(async (tx) => {
    for (const update of normalizedUpdates) {
      const existing = await tx.roomAvailability.findUnique({
        where: { roomId_date: { roomId, date: update.date } },
      });

      const data: Record<string, unknown> = {};
      if (update.availableCount !== undefined) data.availableCount = update.availableCount;
      if (update.isBlocked !== undefined) data.isBlocked = update.isBlocked;

      if (existing) {
        if (data.availableCount !== undefined && (data.availableCount as number) < existing.reservedCount) {
          throw new Error(
            `Cannot set availability below reserved count for ${update.date.toISOString().split("T")[0]}`
          );
        }
        await tx.roomAvailability.update({ where: { id: existing.id }, data });
      } else if (Object.keys(data).length > 0) {
        await tx.roomAvailability.create({
          data: {
            roomId,
            date: update.date,
            availableCount: (data.availableCount as number) ?? 1,
            isBlocked: (data.isBlocked as boolean) ?? false,
            reservedCount: 0,
          },
        });
      }
    }
  });
}

export async function getAvailabilityCalendar(
  roomId: string,
  year: number,
  month: number
): Promise<DateAvailability[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { totalRooms: true } });
  if (!room) return [];

  const availRecords = await prisma.roomAvailability.findMany({
    where: {
      roomId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const availMap = new Map<string, RoomAvailability>();
  for (const a of availRecords) {
    availMap.set(normalizeDate(a.date).toISOString().split("T")[0], a);
  }

  const results: DateAvailability[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = normalizeDate(current).toISOString().split("T")[0];
    const avail = availMap.get(key);

    let availableCount: number;
    let reservedCount: number;
    let isBlocked: boolean;

    if (avail) {
      availableCount = avail.availableCount;
      reservedCount = avail.reservedCount;
      isBlocked = avail.isBlocked;
    } else {
      availableCount = room.totalRooms;
      reservedCount = 0;
      isBlocked = false;
    }

    results.push({
      date: key,
      availableCount,
      reservedCount,
      effectiveAvailable: isBlocked ? 0 : Math.max(0, availableCount - reservedCount),
      isBlocked,
    });

    current.setDate(current.getDate() + 1);
  }

  return results;
}
