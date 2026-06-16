"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { BookOpen, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface AdminBooking {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalDays: number;
  totalAmount: number;
  bookingType: string;
  specialNote?: string | null;
  createdAt: string;
  room: { id: string; title: string; city: string };
  student: { id: string; name: string; email: string };
  payment?: { id: string; status: string; amount: number; paymentReference?: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  VERIFICATION_PENDING: "bg-orange-100 text-orange-700",
  SUCCEEDED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    if (token && user?.role === "ADMIN") fetchBookings();
  }, [token, user, filter, page]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (filter !== "all") params.set("status", filter);
      const res = await axios.get(`/api/admin/bookings?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(res.data.bookings || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.room.title.toLowerCase().includes(q) || b.student.name.toLowerCase().includes(q) || b.student.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Booking Management</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">View and manage all bookings across the platform.</p>
          </div>
          <Link href="/dashboard/admin" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition">
            Back to Dashboard
          </Link>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by room, student, or email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
          {(["all", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((tab) => (
            <button key={tab} onClick={() => { setFilter(tab); setPage(1); }} className={`pb-3 px-3 text-sm font-medium border-b-2 transition ${filter === tab ? "border-maroon-600 text-maroon-600 dark:text-maroon-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
              {tab === "all" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div key={b.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{b.room.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{b.room.city}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[b.status] || ""}`}>{b.status}</span>
                        {b.payment && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PAYMENT_STYLES[b.payment.status] || "bg-gray-100 text-gray-600"}`}>
                            Payment: {b.payment.status === "VERIFICATION_PENDING" ? "Pending Verify" : b.payment.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Student: {b.student.name}</span>
                      <span>{b.student.email}</span>
                      <span>{format(new Date(b.checkIn), "dd MMM")} – {format(new Date(b.checkOut), "dd MMM yyyy")}</span>
                      <span>{b.totalDays} days ({b.bookingType.toLowerCase()})</span>
                      <span className="font-semibold text-gray-900 dark:text-white">₹{b.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBooking(b)} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition shrink-0">
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedBooking(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Booking Details</h3>
                  <button onClick={() => setSelectedBooking(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Room</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.room.title} ({selectedBooking.room.city})</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Student</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.student.name}</p>
                    <p className="text-xs text-gray-500">{selectedBooking.student.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs text-gray-500">Check-in</p>
                      <p className="font-medium text-gray-900 dark:text-white">{format(new Date(selectedBooking.checkIn), "dd MMM yyyy")}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs text-gray-500">Check-out</p>
                      <p className="font-medium text-gray-900 dark:text-white">{format(new Date(selectedBooking.checkOut), "dd MMM yyyy")}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.totalDays} days ({selectedBooking.bookingType})</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-bold text-maroon-600">₹{selectedBooking.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedBooking.specialNote && (
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs text-gray-500">Special Note</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.specialNote}</p>
                    </div>
                  )}
                  {selectedBooking.payment && (
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs text-gray-500">Payment</p>
                      <p className="font-medium text-gray-900 dark:text-white">₹{selectedBooking.payment.amount} — {selectedBooking.payment.status}</p>
                      {selectedBooking.payment.paymentReference && (
                        <p className="text-xs text-gray-500 mt-1">Txn ID: {selectedBooking.payment.paymentReference}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
