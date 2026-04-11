import { NextRequest } from "next/server";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma"); // ✅ lazy import

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
    const priceField =
      bookingType === "DAILY" ? "priceDaily" : "priceMonthly";

    const where: Record<string, any> = {
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

    const orderBy =
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

// POST
export async function POST(req: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma"); // ✅ lazy import

    const { error, user } = requireRole(req, ["OWNER", "ADMIN"]);
    if (error) return error;

    if (!user?.userId) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();

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
    } = body;

    if (
      !title ||
      !description ||
      !address ||
      !city ||
      !state ||
      !priceDaily ||
      !priceMonthly
    ) {
      return apiError("Required fields missing", 400);
    }

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
        priceDaily: parseFloat(priceDaily),
        priceMonthly: parseFloat(priceMonthly),
        roomType: roomType || "SINGLE",
        maxOccupancy: parseInt(maxOccupancy) || 1,
        totalRooms: parseInt(totalRooms) || 1,
        availableRooms: parseInt(totalRooms) || 1,
        images: images || [],
        amenities: amenities || [],
        rules: rules || [],
        ownerId: user.userId,
        status: "PENDING",
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
