"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { Building2, Users, BookOpen, DollarSign, CheckCircle, Shield } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalRooms: number;
  totalBookings: number;
  totalRevenue: number;
  pendingRooms: number;
  activeBookings: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
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
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Monitor users, rooms, bookings, and revenue.</p>
          </div>
          <Link href="/dashboard/admin/profile" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100 transition">
            View profile
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 animate-pulse h-40" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
            {[
              { label: "Total users", value: stats.totalUsers, icon: Users, color: "indigo" },
              { label: "Total rooms", value: stats.totalRooms, icon: Building2, color: "green" },
              { label: "Active bookings", value: stats.activeBookings, icon: BookOpen, color: "purple" },
              { label: "Pending rooms", value: stats.pendingRooms, icon: Shield, color: "yellow" },
              { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "blue" },
            ].map((card) => (
              <div key={card.label} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-200 mb-4">
                  <card.icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">Unable to load admin stats right now.</p>
          </div>
        )}

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/dashboard/admin/profile" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition">
              Manage profile
            </Link>
            <Link href="/dashboard/owner" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition">
              Review owner listings
            </Link>
            <Link href="/browse" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition">
              Browse public rooms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
