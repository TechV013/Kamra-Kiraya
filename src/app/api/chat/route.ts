import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateChatStream, getActiveProvider, getProviderLabel } from "@/lib/ai/provider";
import { getUserFromRequest } from "@/lib/jwt";

const SYSTEM_PROMPT = `You are a helpful assistant for कमरा किराया, a student room booking platform. 
You help students find rooms, answer questions about booking, payments, and the platform.
Keep responses concise (2-3 sentences). Be friendly and helpful.
Current platform features: 
- Room search & booking (daily/monthly)
- UPI QR, Razorpay, and Stripe payments
- Wishlist, reviews
- For students, owners, and admins
- Room types: Single, Double, Triple, Dormitory, Studio, Apartment

If asked about specific rooms, suggest using the search or browse feature.
If asked about booking issues, direct to contacting the room owner through the dashboard.`;

export async function POST(req: NextRequest) {
  try {
    const provider = await getActiveProvider();
    if (provider === "none") {
      return Response.json(
        { response: "AI assistant is currently offline. Please try again later or use the search to find rooms." }
      );
    }

    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return Response.json({ response: "Please provide a message." }, { status: 400 });
    }

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

    const prompt = `User message: ${message}${userInfo}\n\nRespond helpfully as a room booking assistant:`;

    const response = await generateChatStream(prompt, SYSTEM_PROMPT);
    return Response.json({
      response: response || "I couldn't process that. Please try rephrasing your question.",
      provider: getProviderLabel(),
    });
  } catch {
    return Response.json(
      { response: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
