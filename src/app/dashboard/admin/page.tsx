"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import {
  Building2, Users, BookOpen, DollarSign, Shield, Clock,
  CheckCircle2, XCircle, AlertCircle, ChevronRight, TrendingUp, Settings, ShieldCheck
} from "lucide-react";
import RoomImage from "@/components/rooms/RoomImage";

interface AdminStats {
  totalUsers: number;
  totalRooms: number;
  totalBookings: number;
  totalRevenue: number;
  pendingRooms: number;
  activeBookings: number;
  pendingVerifications: number;
}

interface RecentBooking {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  room: { title: string; city: string };
  student: { name: string; email: string };
  payment?: { status: string } | null;
}

interface PendingRoom {
  id: string;
  title: string;
  city: string;
  state: string;
  priceMonthly: number;
  priceDaily: number;
  images: string[];
  status: string;
  createdAt: string;
  owner: { id: string; name: string; email: string };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [pendingRooms, setPendingRooms] = useState<PendingRoom[]>([]);
  const [usersByRole, setUsersByRole] = useState<{ role: string; _count: { id: number } }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
    fetchStats();
  }, [hasHydrated, token, user, router]);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data.stats || null);
      setRecentBookings(res.data.recentBookings || []);
      setUsersByRole(res.data.usersByRole || []);

      const roomsRes = await axios.get("/api/admin/rooms?status=PENDING&limit=5", { headers: { Authorization: `Bearer ${token}` } });
      setPendingRooms(roomsRes.data.rooms || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRoom = async (roomId: string) => {
    try {
      await axios.patch(`/api/admin/rooms/${roomId}`, { status: "APPROVED" }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Room approved!");
      setPendingRooms((prev) => prev.filter((r) => r.id !== roomId));
      setStats((prev) => prev ? { ...prev, pendingRooms: prev.pendingRooms - 1, totalRooms: prev.totalRooms } : prev);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to approve room");
    }
  };

  const handleRejectRoom = async (roomId: string) => {
    try {
      await axios.patch(`/api/admin/rooms/${roomId}`, { status: "REJECTED" }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Room rejected");
      setPendingRooms((prev) => prev.filter((r) => r.id !== roomId));
      setStats((prev) => prev ? { ...prev, pendingRooms: prev.pendingRooms - 1 } : prev);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to reject room");
    }
  };

  const roleCounts: Record<string, number> = {};
  usersByRole.forEach((r) => { roleCounts[r.role] = r._count.id; });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage users, rooms, bookings, and revenue.</p>
          </div>
          <Link href="/dashboard/admin/profile" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition">
            Profile
          </Link>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard/admin/rooms" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-gray-900 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <Building2 className="w-5 h-5" />
              </div>
              {stats && stats.pendingRooms > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {stats.pendingRooms}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Rooms</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalRooms ?? "—"}</p>
          </Link>

          <Link href="/dashboard/admin/owners" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-gray-900 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-400">{roleCounts["OWNER"] || 0} owners</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Owners</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{roleCounts["OWNER"] || 0}</p>
          </Link>

          <Link href="/dashboard/admin/users" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-gray-900 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-400">{stats?.totalUsers ?? 0} total</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalUsers ?? "—"}</p>
          </Link>

          <Link href="/dashboard/admin/bookings" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-gray-900 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-400">{stats?.activeBookings ?? 0} active</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Bookings</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalBookings ?? "—"}</p>
          </Link>

          <Link href="/dashboard/admin/settings" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-gray-900 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <Settings className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Settings</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">Platform Config</p>
          </Link>

          <Link href="/dashboard/admin/verifications" className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-gray-900 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              {stats && stats.pendingVerifications > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {stats.pendingVerifications}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Verifications</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.pendingVerifications ?? "—"}</p>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{(stats?.totalRevenue ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.pendingRooms ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Rooms */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Room Approvals</h2>
              <Link href="/dashboard/admin/rooms" className="text-sm text-maroon-600 hover:text-maroon-500 font-medium">
                View all
              </Link>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
                </div>
              ) : pendingRooms.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No pending rooms</p>
              ) : (
                <div className="space-y-3">
                  {pendingRooms.map((room) => (
                    <div key={room.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <RoomImage src={room.images?.[0]} alt={room.title} className="w-14 h-11 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{room.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{room.city} · ₹{room.priceMonthly}/mo</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => handleApproveRoom(room.id)} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRejectRoom(room.id)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h2>
              <Link href="/dashboard/admin/bookings" className="text-sm text-maroon-600 hover:text-maroon-500 font-medium">
                View all
              </Link>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
                </div>
              ) : recentBookings.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No recent bookings</p>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.room.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{b.student.name} · ₹{b.totalAmount}</p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        b.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                        b.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                        b.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
