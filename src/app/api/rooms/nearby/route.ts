import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/api-helpers";
import { haversineDistance } from "@/lib/haversine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const radius = parseFloat(searchParams.get("radius") || "5");
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

    if (isNaN(lat) || isNaN(lng)) {
      return apiError("lat and lng query parameters are required", 400);
    }

    if (radius < 0.1 || radius > 100) {
      return apiError("radius must be between 0.1 and 100 km", 400);
    }

    const latBuffer = radius / 111;
    const lngBuffer = radius / (111 * Math.cos(toRad(lat)));

    const rooms = await prisma.room.findMany({
      where: {
        status: "APPROVED",
        isAvailable: true,
        availableRooms: { gt: 0 },
        latitude: { gte: lat - latBuffer, lte: lat + latBuffer },
        longitude: { gte: lng - lngBuffer, lte: lng + lngBuffer },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { reviews: true } },
      },
    });

    const withDistance = rooms
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        ...r,
        distanceKm: parseFloat(
          haversineDistance(lat, lng, r.latitude!, r.longitude!).toFixed(2)
        ),
      }))
      .filter((r) => r.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return apiResponse({
      rooms: withDistance,
      userLocation: { lat, lng },
      radius,
      total: withDistance.length,
    });
  } catch (err) {
    console.error("Nearby rooms error:", err);
    return apiError("Internal server error", 500);
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
