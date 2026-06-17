"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, Plus, Edit, Trash2, Users, BookOpen, DollarSign,
  Clock, CheckCircle, XCircle, Eye, MapPin, Star, TrendingUp, AlertCircle, CreditCard
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import type { Room, Booking } from "@/types";
import RoomImage from "@/components/rooms/RoomImage";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  INACTIVE: "bg-gray-100 text-gray-600",
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function OwnerDashboard() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rooms" | "bookings">("rooms");
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "OWNER") { router.push("/"); return; }
    fetchData();
  }, [token, user, hasHydrated]);

  const fetchData = async () => {
    try {
      const [roomsRes, bookingsRes, paymentsRes] = await Promise.all([
        axios.get("/api/rooms/my-rooms", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/bookings/owner", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/payments/owner", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setRooms(roomsRes.data.rooms || roomsRes.data || []);
      setBookings(bookingsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await axios.delete(`/api/rooms/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Room deleted");
      setRooms((r) => r.filter((room) => room.id !== id));
    } catch { toast.error("Failed to delete"); }
  };

  const handleBookingStatus = async (id: string, status: string) => {
    setUpdatingBooking(id);
    try {
      await axios.patch(`/api/bookings/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchData();
    } catch { toast.error("Failed to update booking"); }
    finally { setUpdatingBooking(null); }
  };

  const totalRevenue = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((acc, b) => acc + b.totalAmount, 0);

  const verifiedRevenue = payments
    .filter((p: any) => p.status === "SUCCEEDED")
    .reduce((acc: number, p: any) => acc + p.amount, 0);

  const pendingPayments = payments
    .filter((p: any) => p.status === "VERIFICATION_PENDING")
    .length;

  const occupancyRate = rooms.length > 0
    ? Math.round(
        rooms.reduce((acc, r) => acc + (r.totalRooms - r.availableRooms), 0) /
        Math.max(rooms.reduce((acc, r) => acc + r.totalRooms, 0), 1) * 100
      )
    : 0;

  const stats = {
    totalRooms: rooms.length,
    approvedRooms: rooms.filter((r) => r.status === "APPROVED").length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === "PENDING").length,
    totalRevenue,
    verifiedRevenue,
    pendingPayments,
    occupancyRate,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Owner Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your properties and bookings</p>
            </div>
            <Link
              href="/dashboard/owner/add-room"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-maroon-600 to-maroon-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Listings", value: stats.totalRooms, icon: Building2, bg: "bg-maroon-100 dark:bg-maroon-900/30", text: "text-maroon-600 dark:text-maroon-400" },
            { label: "Approved", value: stats.approvedRooms, icon: CheckCircle, bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" },
            { label: "Revenue (Confirmed)", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
            { label: "Verified Revenue", value: `₹${stats.verifiedRevenue.toLocaleString()}`, icon: DollarSign, bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
            { label: "Total Bookings", value: stats.totalBookings, icon: BookOpen, bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
            { label: "Pending Bookings", value: stats.pendingBookings, icon: Clock, bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400" },
            { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: Users, bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
            { label: "Payments to Verify", value: stats.pendingPayments, icon: CreditCard, bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
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

        {/* Pending bookings alert */}
        {stats.pendingBookings > 0 && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
              You have {stats.pendingBookings} pending booking{stats.pendingBookings > 1 ? "s" : ""} that need your action
            </p>
            <Link
              href="/dashboard/owner/bookings"
              className="ml-auto text-sm font-medium text-yellow-700 dark:text-yellow-300 underline hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              Review now
            </Link>
          </div>
        )}

        {/* Pending payment verification alert */}
        {stats.pendingPayments > 0 && (
          <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-2xl mb-6">
            <CreditCard className="w-5 h-5 text-orange-600 shrink-0" />
            <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
              You have {stats.pendingPayments} payment{stats.pendingPayments > 1 ? "s" : ""} awaiting verification
            </p>
            <Link
              href="/dashboard/owner/payments"
              className="ml-auto text-sm font-medium text-orange-700 dark:text-orange-300 underline hover:text-orange-800 dark:hover:text-orange-200"
            >
              Verify now
            </Link>
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <Link
            href="/dashboard/owner/payments"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2.5 text-sm font-medium text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300 transition"
          >
            <CreditCard className="w-4 h-4" />
            Payment Verification
          </Link>
          <Link
            href="/dashboard/owner/payment-settings"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300 transition"
          >
            <CreditCard className="w-4 h-4" />
            Payment Settings
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {(["rooms", "bookings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {tab === "rooms" ? `Listings (${stats.totalRooms})` : `Bookings (${stats.totalBookings})`}
            </button>
          ))}
        </div>

        {/* Rooms Tab */}
        {activeTab === "rooms" && (
          <div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-24 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900 dark:text-white">No listings yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add your first room to start receiving bookings</p>
                <Link
                  href="/dashboard/owner/add-room"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-maroon-600 text-white text-sm rounded-xl hover:bg-maroon-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Your First Room
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 p-5">
                      <div className="sm:w-28 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                        <RoomImage
                          src={room.images?.[0]}
                          alt={room.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{room.title}</h3>
                          <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[room.status]}`}>
                            {room.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{room.city}, {room.state}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>₹{room.priceMonthly.toLocaleString()}/month</span>
                          <span>₹{room.priceDaily}/day</span>
                          <span>{room.availableRooms}/{room.totalRooms} available</span>
                          {room.rating > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {room.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {room.status === "PENDING" && (
                          <p className="text-xs text-yellow-600 mt-2">⚠ Awaiting admin approval before appearing in search</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
                        <Link
                          href={`/rooms/${room.id}`}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-maroon-600 hover:border-maroon-400 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/owner/edit-room/${room.id}`}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-maroon-600 hover:border-maroon-400 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-red-600 hover:border-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900 dark:text-white">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking, i) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{(booking as any).room?.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Student: {(booking as any).student?.name} · {(booking as any).student?.email}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${BOOKING_STATUS_COLORS[booking.status]}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Check-in: {new Date(booking.checkIn).toLocaleDateString("en-IN")}</span>
                          <span>Check-out: {new Date(booking.checkOut).toLocaleDateString("en-IN")}</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">₹{booking.totalAmount.toLocaleString()}</span>
                        </div>
                        {booking.specialNote && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Note: {booking.specialNote}</p>
                        )}
                      </div>
                      {booking.status === "PENDING" && (
                        <div className="flex gap-2 items-center sm:flex-col shrink-0">
                          <button
                            onClick={() => handleBookingStatus(booking.id, "CONFIRMED")}
                            disabled={updatingBooking === booking.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleBookingStatus(booking.id, "REJECTED")}
                            disabled={updatingBooking === booking.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
