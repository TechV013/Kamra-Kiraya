"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import type { Room } from "@/types";
import RoomImage from "@/components/rooms/RoomImage";

export default function OwnerRoomsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "OWNER") { router.push("/"); return; }
    fetchRooms();
  }, [hasHydrated, token, user, router]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get("/api/rooms/my-rooms", { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data.rooms || res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Rooms</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Manage and review the rooms you have listed.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/owner/add-room")}
            className="rounded-2xl bg-maroon-600 px-5 py-3 text-sm font-semibold text-white hover:bg-maroon-500"
          >
            Add new room
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 animate-pulse h-32" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-lg font-medium text-gray-900 dark:text-white">No rooms listed yet</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Add a new room to start receiving bookings.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="grid gap-4 md:grid-cols-[180px_1fr] p-6">
                  <div className="h-44 overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-800">
                    <RoomImage
                      src={room.images?.[0]}
                      alt={room.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{room.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{room.city}, {room.state}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${room.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {room.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>₹{room.priceMonthly.toLocaleString()}/month</span>
                      <span>{room.totalRooms} room{room.totalRooms > 1 ? "s" : ""}</span>
                      <span>{room.availableRooms} available</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/dashboard/owner/edit-room/${room.id}`} className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition">
                        Edit listing
                      </Link>
                      <Link href={`/rooms/${room.id}`} className="rounded-2xl bg-maroon-600 px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-500 transition">
                        View listing
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
