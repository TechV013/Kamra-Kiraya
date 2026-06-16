import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { roomSchema } from "@/lib/validations";

// GET /api/rooms - list rooms with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const roomType = searchParams.get("roomType");
    const bookingType = searchParams.get("bookingType") || "MONTHLY";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const sortBy = searchParams.get("sortBy") || "createdAt";

    const skip = (page - 1) * limit;

    const priceField = bookingType === "DAILY" ? "priceDaily" : "priceMonthly";

    const where: Record<string, unknown> = {
      status: "APPROVED",
      isAvailable: true,
    };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (roomType) where.roomType = roomType;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }
    if (minPrice || maxPrice) {
      where[priceField] = {
        ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
      };
    }

    const orderBy: Record<string, string> =
      sortBy === "price"
        ? { [priceField]: "asc" }
        : sortBy === "rating"
        ? { rating: "desc" }
        : { createdAt: "desc" };

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.room.count({ where }),
    ]);

    return apiResponse({
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get rooms error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST /api/rooms - create room (owner only)
export async function POST(req: NextRequest) {
  const { error, user } = requireRole(req, ["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const { data, errorResponse } = await validateBody(req, roomSchema);
    if (errorResponse) return errorResponse;

    const {
      title,
      description,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      priceDaily,
      priceMonthly,
      roomType,
      maxOccupancy,
      totalRooms,
      images,
      amenities,
      rules,
    } = data!;

    const statusValue = process.env.NODE_ENV === "development" ? "APPROVED" : "PENDING";

    const room = await prisma.room.create({
      data: {
        title,
        description,
        address,
        city,
        state,
        zipCode,
        latitude,
        longitude,
        priceDaily,
        priceMonthly,
        roomType,
        maxOccupancy,
        totalRooms,
        availableRooms: totalRooms,
        images,
        amenities,
        rules,
        ownerId: user!.userId,
        status: statusValue,
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });

    return apiResponse(room, 201);
  } catch (err) {
    console.error("Create room error:", err);
    return apiError("Internal server error", 500);
  }
}
