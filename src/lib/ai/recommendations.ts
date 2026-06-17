import { prisma } from "@/lib/prisma";
import { generateChat, getActiveProvider } from "./provider";

interface UserPreferences {
  cities: string[];
  roomTypes: string[];
  minBudget: number;
  maxBudget: number;
  preferredAmenities: string[];
}

async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bookings: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { room: true },
      },
      wishlist: { take: 10, include: { room: true } },
      reviews: { take: 10, include: { room: true } },
    },
  });

  if (!user) {
    return { cities: [], roomTypes: [], minBudget: 0, maxBudget: 100000, preferredAmenities: [] };
  }

  const allRooms = [
    ...user.bookings.map((b) => b.room),
    ...user.wishlist.map((w) => w.room),
    ...user.reviews.map((r) => r.room),
  ];

  const cities = [...new Set(allRooms.map((r) => r.city))];
  const roomTypes = [...new Set(allRooms.map((r) => r.roomType))];
  const prices = allRooms.map((r) => r.priceDaily).filter((p) => p > 0);
  const amenities = allRooms.flatMap((r) => r.amenities);
  const amenityCounts = amenities.reduce((acc, a) => { acc[a] = (acc[a] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topAmenities = Object.entries(amenityCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([a]) => a);

  return {
    cities,
    roomTypes,
    minBudget: prices.length > 0 ? Math.min(...prices) * 0.7 : 0,
    maxBudget: prices.length > 0 ? Math.max(...prices) * 1.3 : 100000,
    preferredAmenities: topAmenities,
  };
}

function ruleBasedFilter(rooms: any[], prefs: UserPreferences, limit: number) {
  let filtered = rooms;

  if (prefs.cities.length > 0) {
    const cityMatch = filtered.filter((r) => prefs.cities.includes(r.city));
    if (cityMatch.length >= limit) filtered = cityMatch;
  }

  if (prefs.roomTypes.length > 0) {
    const typeMatch = filtered.filter((r) => prefs.roomTypes.includes(r.roomType));
    if (typeMatch.length >= limit / 2) filtered = [...new Set([...typeMatch, ...filtered])];
  }

  if (prefs.preferredAmenities.length > 0) {
    filtered = filtered.map((room) => ({
      ...room,
      _score: room.amenities.filter((a: string) => prefs.preferredAmenities.includes(a)).length,
    })).sort((a: any, b: any) => b._score - a._score);
  }

  return filtered.slice(0, limit);
}

export async function getRecommendedRooms(userId?: string, limit = 6) {
  const provider = await getActiveProvider();
  const aiAvailable = provider !== "none";

  const prefs = userId ? await getUserPreferences(userId) : { cities: [], roomTypes: [], minBudget: 0, maxBudget: 100000, preferredAmenities: [] };

  const sampleRooms = await prisma.room.findMany({
    where: { status: "APPROVED", isAvailable: true },
    take: 30,
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
      totalReviews: true,
    },
  });

  const filtered = ruleBasedFilter(sampleRooms, prefs, limit * 2);

  if (aiAvailable && filtered.length > 0) {
    const roomList = filtered
      .map((r: any) => `- ${r.id}: ${r.title} (${r.city}, ₹${r.priceDaily}/day, ${r.roomType}, rating: ${r.rating}, reviews: ${r.totalReviews}, amenities: ${r.amenities.slice(0, 5).join(", ")})`)
      .join("\n");

    const prompt = `User preferences: Cities: ${prefs.cities.join(", ") || "any"}, Budget: ₹${prefs.minBudget}-₹${prefs.maxBudget}/day, Room types: ${prefs.roomTypes.join(", ") || "any"}, Preferred amenities: ${prefs.preferredAmenities.join(", ") || "none"}

Available rooms:
${roomList}

Rank the top ${limit} rooms by relevance to the user. Return ONLY a comma-separated list of room IDs in order of relevance, nothing else.`;

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
        });

        const ordered = ids.map((id) => recommended.find((r) => r.id === id)).filter(Boolean);
        if (ordered.length > 0) return ordered.slice(0, limit);
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

  const candidates = await prisma.room.findMany({
    where: {
      id: { not: roomId },
      status: "APPROVED",
      isAvailable: true,
      OR: [
        { city: room.city },
        { roomType: room.roomType },
        { priceDaily: { gte: room.priceDaily * 0.7, lte: room.priceDaily * 1.3 } },
      ],
    },
    select: {
      id: true, title: true, city: true, priceDaily: true,
      roomType: true, amenities: true, rating: true, totalReviews: true,
    },
    orderBy: { rating: "desc" },
    take: 10,
  });

  const provider = await getActiveProvider();
  if (provider !== "none" && candidates.length > 0) {
    const roomList = candidates
      .map((r) => `- ${r.id}: ${r.title} (${r.city}, ₹${r.priceDaily}/day, ${r.roomType}, rating: ${r.rating}, amenities: ${r.amenities.slice(0, 5).join(", ")})`)
      .join("\n");

    const prompt = `Original room: ${room.city}, ${room.roomType}, ₹${room.priceDaily}/day, amenities: ${room.amenities.slice(0, 5).join(", ")}

Similar candidates:
${roomList}

Rank the top ${limit} most similar rooms. Return ONLY a comma-separated list of room IDs, nothing else.`;

    const aiResponse = await generateChat(prompt, "You are a room similarity engine. Return only comma-separated room IDs.");
    if (aiResponse) {
      const ids = aiResponse.split(",").map((id) => id.trim().replace(/[^a-zA-Z0-9]/g, "")).filter(Boolean);
      if (ids.length > 0) {
        const full = await prisma.room.findMany({
          where: { id: { in: ids }, status: "APPROVED", isAvailable: true },
          include: { owner: { select: { id: true, name: true, avatar: true } } },
        });
        return ids.map((id) => full.find((r) => r.id === id)).filter(Boolean).slice(0, limit);
      }
    }
  }

  return prisma.room.findMany({
    where: {
      id: { not: roomId },
      status: "APPROVED",
      isAvailable: true,
      OR: [
        { city: room.city },
        { roomType: room.roomType },
        { priceDaily: { gte: room.priceDaily * 0.7, lte: room.priceDaily * 1.3 } },
      ],
    },
    orderBy: { rating: "desc" },
    take: limit,
    include: { owner: { select: { id: true, name: true, avatar: true } } },
  });
}
