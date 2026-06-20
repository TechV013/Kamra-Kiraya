"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { TrendingUp, DollarSign, Calendar, Building2 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  month: string;
  payout: number;
  bookings: number;
}

interface OwnerRoom {
  id: string;
  title: string;
  status: string;
  priceMonthly: number;
  city: string;
  images: string[];
  _count: { bookings: number };
}

interface AnalyticsData {
  monthlyData: MonthlyData[];
  rooms: OwnerRoom[];
  totalEarnings: number;
  totalBookings: number;
}

export default function OwnerAnalyticsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "OWNER") { router.push("/"); return; }
    fetchAnalytics();
  }, [hasHydrated, token, user, router]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("/api/owner/analytics", { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-maroon-100 text-maroon-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your earnings and performance over the last 12 months</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings (12mo)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{(data?.totalEarnings ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings (12mo)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.totalBookings ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Trend */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" /> Earnings Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Payout"]} />
                <Line type="monotone" dataKey="payout" stroke="#E8734A" strokeWidth={2} dot={{ fill: "#E8734A", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Booking Trend */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Booking Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, "Bookings"]} />
                <Bar dataKey="bookings" fill="#8B1A1A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* My Rooms */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" /> My Rooms
            </h2>
          </div>
          <div className="p-5">
            {!data?.rooms?.length ? (
              <p className="text-sm text-gray-500 text-center py-6">No rooms yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="pb-3 font-medium">Room</th>
                      <th className="pb-3 font-medium">City</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Price/mo</th>
                      <th className="pb-3 font-medium">Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rooms.map((room) => (
                      <tr key={room.id} className="border-b border-gray-50 dark:border-gray-800/50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            {room.images?.[0] && (
                              <img src={room.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{room.title}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-500">{room.city}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            room.status === "APPROVED" ? "bg-green-100 text-green-700" :
                            room.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                            room.status === "REJECTED" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{room.status}</span>
                        </td>
                        <td className="py-3 text-gray-900 dark:text-white font-medium">₹{room.priceMonthly}</td>
                        <td className="py-3 text-gray-500">{room._count.bookings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
