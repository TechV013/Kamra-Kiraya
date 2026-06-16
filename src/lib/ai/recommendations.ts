import { prisma } from "@/lib/prisma";
import { generateChat, getActiveProvider } from "./provider";

export async function getRecommendedRooms(userId?: string, limit = 6) {
  const provider = await getActiveProvider();
  const aiAvailable = provider !== "none";

  let userContext = "";
  if (userId && aiAvailable) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { room: true },
        },
        wishlist: { take: 10, include: { room: true } },
      },
    });

    if (user) {
      const wishlistCities = [...new Set(user.wishlist.map((w) => w.room.city))];
      const bookedCities = [...new Set(user.bookings.map((b) => b.room.city))];
      userContext = `User has wishlisted rooms in: ${wishlistCities.join(", ") || "none"}. Previously booked in: ${bookedCities.join(", ") || "none"}.`;
    }
  }

  const sampleRooms = await prisma.room.findMany({
    where: { status: "APPROVED", isAvailable: true },
    take: 20,
    orderBy: { rating: "desc" },
    select: {
      id: true,
      title: true,
      city: true,
      priceDaily: true,
      priceMonthly: true,
      roomType: true,
      amenities: true,
      rating: true,
    },
  });

  if (aiAvailable && sampleRooms.length > 0) {
    const roomList = sampleRooms
      .map((r) => `- ${r.title} (${r.city}, ₹${r.priceDaily}/day, ${r.roomType}, rating: ${r.rating}, amenities: ${r.amenities.slice(0, 5).join(", ")})`)
      .join("\n");

    const prompt = `Given this user context: ${userContext || "New user browsing rooms"}

Available rooms:
${roomList}

Recommend up to ${limit} room IDs from the list above that best match the user. Return ONLY a comma-separated list of room IDs, nothing else.`;

    const aiResponse = await generateChat(prompt, "You are a room recommendation engine. Return only comma-separated room IDs.");
    if (aiResponse) {
      const ids = aiResponse
        .split(",")
        .map((id) => id.trim().replace(/[^a-zA-Z0-9]/g, ""))
        .filter(Boolean);

      if (ids.length > 0) {
        const recommended = await prisma.room.findMany({
          where: { id: { in: ids }, status: "APPROVED", isAvailable: true },
          include: { owner: { select: { id: true, name: true, avatar: true } } },
          take: limit,
        });

        if (recommended.length > 0) return recommended;
      }
    }
  }

  return prisma.room.findMany({
    where: { status: "APPROVED", isAvailable: true },
    orderBy: { rating: "desc" },
    take: limit,
    include: { owner: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function getSimilarRooms(roomId: string, limit = 4) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { city: true, roomType: true, priceDaily: true, amenities: true },
  });
  if (!room) return [];

  return prisma.room.findMany({
    where: {
      id: { not: roomId },
      status: "APPROVED",
      isAvailable: true,
      OR: [
        { city: room.city },
        { roomType: room.roomType },
        {
          priceDaily: { gte: room.priceDaily * 0.7, lte: room.priceDaily * 1.3 },
        },
      ],
    },
    orderBy: { rating: "desc" },
    take: limit,
    include: { owner: { select: { id: true, name: true, avatar: true } } },
  });
}
