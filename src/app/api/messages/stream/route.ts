import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const bookingId = req.nextUrl.searchParams.get("bookingId");
  if (!bookingId) {
    return new Response(JSON.stringify({ error: "bookingId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { studentId: true, room: { select: { ownerId: true } } },
  });
  if (!booking) {
    return new Response(JSON.stringify({ error: "Booking not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (user!.role !== "ADMIN" && user!.id !== booking.studentId && user!.id !== booking.room.ownerId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let lastCheck = new Date();
  let isDisconnected = false;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(":\n\n"));

      const interval = setInterval(async () => {
        if (isDisconnected) {
          clearInterval(interval);
          return;
        }

        try {
          const newMessages = await prisma.message.findMany({
            where: {
              bookingId,
              createdAt: { gt: lastCheck },
            },
            orderBy: { createdAt: "asc" },
            include: {
              sender: {
                select: { id: true, name: true, avatar: true },
              },
            },
          });

          lastCheck = new Date();

          if (newMessages.length > 0) {
            const payload = JSON.stringify(newMessages);
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Poll failed" })}\n\n`));
        }
      }, 3000);

      req.signal.addEventListener("abort", () => {
        isDisconnected = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
