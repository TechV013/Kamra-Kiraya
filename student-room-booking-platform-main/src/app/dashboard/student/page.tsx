"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, Heart, User, Clock, CheckCircle, XCircle,
  MapPin, Calendar, ChevronRight, Building2, Star, Search, CreditCard
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import type { Booking } from "@/types";
import { format } from "date-fns";
import RoomImage from "@/components/rooms/RoomImage";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  CONFIRMED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  VERIFICATION_PENDING: "bg-yellow-100 text-yellow-700",
  SUCCEEDED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const STUDENT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200&q=80";

export default function StudentDashboard() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "STUDENT") { router.push("/"); return; }
    fetchBookings();
  }, [token, user, hasHydrated]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(id);
    try {
      await axios.patch(`/api/bookings/${id}`, { status: "CANCELLED" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to cancel");
    } finally {
      setCancelling(null);
    }
  };

  const handlePay = async (bookingId: string) => {
    setPayingBookingId(bookingId);
    try {
      await axios.post(
        "/api/payments",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Payment session created. Go to Payments to complete the payment.");
      router.push("/dashboard/student/payments");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create payment session");
    } finally {
      setPayingBookingId(null);
    }
  };

  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED").length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.name.split(" ")[0]}! 👋
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Manage your bookings and find your next room
              </p>
            </div>
            <Link
              href="/browse"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-maroon-600 to-maroon-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <Search className="w-4 h-4" />
              Browse Rooms
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Bookings", value: stats.total, icon: BookOpen, bg: "bg-maroon-100 dark:bg-maroon-900/30", text: "text-maroon-600 dark:text-maroon-400" },
            { label: "Active", value: stats.active, icon: CheckCircle, bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" },
            { label: "Pending", value: stats.pending, icon: Clock, bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400" },
            { label: "Cancelled", value: stats.cancelled, icon: XCircle, bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
            >
              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { href: "/browse", icon: Search, label: "Browse Rooms", desc: "Find your next home", color: "from-maroon-500 to-maroon-600" },
            { href: "/dashboard/student/wishlist", icon: Heart, label: "My Wishlist", desc: "Saved rooms", color: "from-rose-500 to-pink-600" },
            { href: "/dashboard/student/payments", icon: CreditCard, label: "Payments", desc: "View QR & history", color: "from-emerald-500 to-teal-600" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center`}>
                  <link.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{link.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{link.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
              </div>
            </Link>
          ))}
        </div>

        {/* Bookings */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Bookings</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-24 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="font-medium text-gray-900 dark:text-white">No bookings yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse rooms and make your first booking</p>
              <Link
                href="/browse"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-maroon-600 text-white text-sm rounded-xl hover:bg-maroon-700 transition-colors"
              >
                <Search className="w-4 h-4" /> Browse Rooms
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row gap-4 p-5">
                    {/* Room image */}
                    <div className="sm:w-28 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                      <RoomImage
                        src={booking.room?.images?.[0]}
                        alt={booking.room?.title || "Room"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <Link
                            href={`/rooms/${booking.roomId}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-maroon-600 transition-colors text-sm"
                          >
                            {booking.room?.title}
                          </Link>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {booking.room?.city}, {booking.room?.state}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[booking.status]}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(booking.checkIn), "dd MMM")} – {format(new Date(booking.checkOut), "dd MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {booking.totalDays} days · {booking.bookingType}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ₹{booking.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-end shrink-0">
                      <Link
                        href={`/rooms/${booking.roomId}`}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        View Room
                      </Link>
                      {booking.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {cancelling === booking.id ? "..." : "Cancel"}
                        </button>
                      )}
                      {booking.status === "CONFIRMED" && (!booking.payment || booking.payment.status !== "SUCCEEDED") && (
                        <button
                          onClick={() => handlePay(booking.id)}
                          disabled={payingBookingId === booking.id}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {payingBookingId === booking.id ? "Processing..." : "Pay Now"}
                        </button>
                      )}
                      {booking.payment && booking.payment.status === "VERIFICATION_PENDING" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          Payment Under Review
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
