"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

interface ReviewItem {
  id: string;
  comment: string;
  rating: number;
  createdAt: string;
  room?: { title: string };
}

export default function StudentReviewsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "STUDENT") { router.push("/"); return; }
    fetchReviews();
  }, [hasHydrated, token, user, router]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get("/api/reviews", { headers: { Authorization: `Bearer ${token}` } });
      setReviews(res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-xl dark:bg-gray-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Reviews</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">See the ratings and feedback you left for rooms.</p>
            </div>
            <button
              onClick={() => router.push("/browse")}
              className="rounded-2xl bg-maroon-600 px-5 py-3 text-sm font-semibold text-white hover:bg-maroon-500"
            >
              Browse rooms
            </button>
          </div>

          {loading ? (
            <div className="mt-10 text-center text-gray-600 dark:text-gray-300">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <p className="text-lg font-medium">No reviews yet</p>
              <p className="mt-2 text-sm">Write a review after your first booking.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-3xl border border-gray-200 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{review.room?.title || "Room review"}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-maroon-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-maroon-700 dark:bg-maroon-900 dark:text-maroon-200">
                      Rating {review.rating}
                    </span>
                  </div>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
