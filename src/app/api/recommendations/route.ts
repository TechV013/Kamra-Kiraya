import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { getRecommendedRooms, getSimilarRooms } from "@/lib/ai/recommendations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const limit = Math.min(Number(searchParams.get("limit")) || 6, 12);

  if (roomId) {
    const rooms = await getSimilarRooms(roomId, limit);
    return Response.json({ rooms });
  }

  const { user } = requireAuth(req);
  const rooms = await getRecommendedRooms(user?.userId, limit);
  return Response.json({ rooms });
}
