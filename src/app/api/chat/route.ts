import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateChat, getActiveProvider, getProviderLabel } from "@/lib/ai/provider";
import { getUserFromRequest } from "@/lib/jwt";

const SYSTEM_PROMPT = `You are a helpful assistant for कमरा किराया (Kamra Kiraya), a student room booking platform in India.
You help students find rooms, answer questions about booking, payments, and the platform.
Keep responses concise (2-3 sentences max). Be friendly and use simple English.

Current platform features:
- Room search & booking (daily/monthly)
- UPI QR code payments
- Wishlist, reviews & ratings
- For students, room owners, and admins
- Room types: Single, Double, Triple, Dormitory, Studio, Apartment
- Cities: Jaipur, Delhi, Mumbai, Bangalore, etc.

When users ask about available rooms, cities, prices, or statistics, use the data provided in the context to give specific answers.
If asked about specific rooms, tell them to use the Browse page.
If asked about booking issues, tell them to check their dashboard or contact support.
Never make up URLs or links.`;

async function getPlatformData() {
  const [roomCount, cityStats, recentRooms] = await Promise.all([
    prisma.room.count({ where: { status: "APPROVED", isAvailable: true } }),
    prisma.room.groupBy({ by: ["city"], where: { status: "APPROVED", isAvailable: true }, _count: true, orderBy: { _count: { city: "desc" } } }),
    prisma.room.findMany({
      where: { status: "APPROVED", isAvailable: true },
      select: { title: true, city: true, priceDaily: true, roomType: true, rating: true },
      orderBy: { rating: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalRooms: roomCount,
    cities: cityStats.map((c) => ({ city: c.city, count: c._count })),
    topRooms: recentRooms,
  };
}

function getRuleBasedResponse(message: string, data?: Awaited<ReturnType<typeof getPlatformData>>): string | null {
  const lower = message.toLowerCase();

  if (lower.includes("how many") && (lower.includes("room") || lower.includes("available"))) {
    if (data) return `We currently have ${data.totalRooms} rooms available across ${data.cities.length} cities. Browse our catalog to find your perfect room!`;
  }

  if (lower.includes("city") || lower.includes("cities") || lower.includes("where")) {
    if (data && data.cities.length > 0) {
      const cityList = data.cities.slice(0, 5).map((c) => `${c.city} (${c.count} rooms)`).join(", ");
      return `We have rooms in: ${cityList}. Visit the Browse page to explore all cities!`;
    }
  }

  if (lower.includes("top") || lower.includes("best") || lower.includes("popular")) {
    if (data && data.topRooms.length > 0) {
      const roomList = data.topRooms.slice(0, 3).map((r) => `${r.title} in ${r.city} (₹${r.priceDaily}/day)`).join(", ");
      return `Our top-rated rooms: ${roomList}. Check the Browse page for more details!`;
    }
  }

  if (lower.includes("cheap") || lower.includes("budget") || lower.includes("affordable")) {
    if (data) return `Budget rooms start from ₹200/day. Use the price filter on the Browse page to find affordable options in your preferred city.`;
  }

  if (lower.includes("book") || lower.includes("booking")) {
    return "To book a room: 1) Go to Browse page and find a room you like, 2) Select check-in and check-out dates, 3) Click 'Book Now'. The owner will review your request. You'll need to complete payment after approval.";
  }
  if (lower.includes("pay") || lower.includes("payment") || lower.includes("upi")) {
    return "We accept UPI payments. After your booking is approved by the owner, go to Dashboard > Payments, scan the QR code, pay via any UPI app, then enter your transaction ID for verification.";
  }
  if (lower.includes("cancel")) {
    return "To cancel a booking: Go to Dashboard > My Bookings, find the booking, and click 'Cancel'. You can cancel before check-in. Refunds depend on the owner's cancellation policy.";
  }
  if (lower.includes("review") || lower.includes("rating")) {
    return "To leave a review: Go to the room's detail page, scroll down to the Reviews section, and submit your rating and feedback. Reviews help other students find good rooms!";
  }
  if (lower.includes("wishlist") || lower.includes("save") || lower.includes("favorite")) {
    return "To save a room to your wishlist: Click the heart icon on any room card. Find all your saved rooms in Dashboard > Wishlist.";
  }
  if (lower.includes("search") || lower.includes("find") || lower.includes("room")) {
    return "To find rooms: Go to the Browse page. You can filter by city, price range, room type, and amenities. Use the map view to find rooms near your location!";
  }
  if (lower.includes("owner") || lower.includes("landlord")) {
    return "Room owners can list their properties from Dashboard > Add Room. They review booking requests, approve/reject bookings, and verify payments.";
  }
  if (lower.includes("register") || lower.includes("sign up") || lower.includes("account")) {
    return "To create an account: Click 'Register' on the top menu. You can register as a Student (to book rooms) or Owner (to list rooms).";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I'm the कमरा किराया assistant. I can help you with room bookings, payments, reviews, and more. What would you like to know?";
  }
  if (lower.includes("thank")) {
    return "You're welcome! If you have any other questions, feel free to ask. Happy room hunting!";
  }
  if (lower.includes("price") || lower.includes("cost") || lower.includes("rent")) {
    if (data) return `Room prices vary by city and type. We have rooms from ₹200/day to ₹2000+/day. Use the price filter on the Browse page to find options in your budget.`;
    return "Room prices vary by city, type, and amenities. Browse rooms to see daily and monthly rates. You can filter by price range on the Browse page.";
  }
  if (lower.includes("single") || lower.includes("double") || lower.includes("dorm")) {
    return "We have various room types: Single, Double, Triple, Dormitory, Studio, and Apartment. Filter by room type on the Browse page to find what suits you best.";
  }
  return null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    if (!message || typeof message !== "string") {
      return Response.json({ response: "Please provide a message." }, { status: 400 });
    }

    const provider = await getActiveProvider();
    const data = await getPlatformData();

    const ruleBased = getRuleBasedResponse(message, data);
    if (ruleBased) {
      return Response.json({ response: ruleBased, provider: "Rule-based" });
    }

    let aiResponse: string | null = null;

    if (provider !== "none") {
      try {
        const user = getUserFromRequest(req);
        let userInfo = "";
        if (user) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { name: true, role: true },
          });
          if (dbUser) {
            userInfo = `\nCurrent user: ${dbUser.name} (${dbUser.role})`;
          }
        }

        const dataContext = `\nPlatform data: ${data.totalRooms} rooms available in ${data.cities.length} cities. Top cities: ${data.cities.slice(0, 5).map((c) => `${c.city} (${c.count})`).join(", ")}.`;

        const messages: ChatMessage[] = [
          { role: "user" as const, content: `User message: ${message}${userInfo}${dataContext}\n\nRespond helpfully as a room booking assistant:` },
        ];

        if (Array.isArray(history)) {
          for (const msg of history.slice(-6)) {
            messages.push({ role: msg.role, content: msg.content });
          }
          messages.push({ role: "user" as const, content: message });
        }

        aiResponse = await generateChat(messages.map((m) => m.content).join("\n"), SYSTEM_PROMPT);
      } catch {
        aiResponse = null;
      }
    }

    if (!aiResponse) {
      aiResponse = "I can help with room bookings, payments, reviews, and platform features. Could you rephrase your question or ask about something specific?";
    }

    return Response.json({
      response: aiResponse,
      provider: provider !== "none" ? getProviderLabel() : "Rule-based",
    });
  } catch {
    return Response.json(
      { response: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
