"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

const WISHLIST_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80";

interface WishlistItem {
  id: string;
  room: {
    id: string;
    title: string;
    city: string;
    state: string;
    priceDaily: number;
    priceMonthly: number;
    images: string[];
  };
}

export default function StudentWishlistPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "STUDENT") { router.push("/"); return; }
    fetchWishlist();
  }, [hasHydrated, token, user, router]);

  const fetchWishlist = async () => {
    try {
      const res = await axios.get("/api/wishlist", { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (roomId: string) => {
    try {
      await axios.post(
        "/api/wishlist",
        { roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems((prev) => prev.filter((item) => item.room.id !== roomId));
      toast.success("Removed from wishlist");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Unable to remove item");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Rooms</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Your saved rooms are stored here for quick access.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/browse")}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Continue browsing
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 animate-pulse h-40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-lg font-medium text-gray-900 dark:text-white">Nothing saved yet</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Tap the heart icon while browsing to save rooms.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={item.room.images?.[0] || WISHLIST_FALLBACK_IMAGE}
                    alt={item.room.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{item.room.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.room.city}, {item.room.state}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <span className="rounded-2xl bg-gray-100 px-3 py-1 dark:bg-gray-800">₹{item.room.priceMonthly.toLocaleString()}/month</span>
                    <span className="rounded-2xl bg-gray-100 px-3 py-1 dark:bg-gray-800">₹{item.room.priceDaily}/day</span>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => removeItem(item.room.id)}
                      className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/rooms/${item.room.id}`)}
                      className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition"
                    >
                      View room
                    </button>
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
