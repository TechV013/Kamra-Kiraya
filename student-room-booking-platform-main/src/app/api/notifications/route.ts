import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

// GET /api/notifications - user's notifications
export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user!.userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user!.userId,
        isRead: false,
      },
    });

    return apiResponse({ notifications, unreadCount });
  } catch (err) {
    console.error("Get notifications error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST /api/notifications - mark as read
export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { notificationId, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: user!.userId },
        data: { isRead: true },
      });
      return apiResponse({ message: "All notifications marked as read" });
    }

    if (!notificationId) {
      return apiError("Notification ID is required");
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== user!.userId) {
      return apiError("Notification not found", 404);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return apiResponse(updated);
  } catch (err) {
    console.error("Update notification error:", err);
    return apiError("Internal server error", 500);
  }
}
