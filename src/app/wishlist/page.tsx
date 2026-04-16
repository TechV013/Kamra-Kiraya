"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { Heart, Search } from "lucide-react";

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

const WISHLIST_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80";

export default function WishlistPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchWishlist();
  }, [router, token]);

  const fetchWishlist = async () => {
    try {
      const res = await axios.get("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      toast.error(err?.response?.data?.error || "Unable to remove");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wishlist</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{user ? "Your saved rooms in one place." : "Sign in to view your saved rooms."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/browse" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">
              <Search className="w-4 h-4" /> Browse rooms
            </Link>
            <Link href={user ? "/profile-settings" : "/login"} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">
              <Heart className="w-4 h-4 text-rose-500" /> Profile settings
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 animate-pulse h-40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
              <Heart className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">No saved rooms yet</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Add rooms to your wishlist while browsing so you can review them later.</p>
            <Link href="/browse" className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">
              Browse rooms
            </Link>
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.room.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.room.city}, {item.room.state}</p>
                  <div className="mt-4 flex flex-wrap gap-3 items-center text-sm text-gray-700 dark:text-gray-200">
                    <span className="rounded-2xl bg-gray-100 px-3 py-1 dark:bg-gray-800">₹{item.room.priceMonthly.toLocaleString()}/month</span>
                    <span className="rounded-2xl bg-gray-100 px-3 py-1 dark:bg-gray-800">₹{item.room.priceDaily}/day</span>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href={`/rooms/${item.room.id}`} className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition">
                      View room
                    </Link>
                    <button type="button" onClick={() => removeItem(item.room.id)} className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">
                      Remove
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
