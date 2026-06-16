"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, Eye, CreditCard, Search, Filter } from "lucide-react";
import RoomImage from "@/components/rooms/RoomImage";

interface OwnerPayment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: string;
  transactionRef?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    totalDays: number;
    bookingType: string;
    status: string;
    room: {
      id: string;
      title: string;
      images: string[];
      city: string;
      state: string;
    };
    student: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  VERIFICATION_PENDING: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  SUCCEEDED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting Payment",
  VERIFICATION_PENDING: "Needs Verification",
  SUCCEEDED: "Paid",
  FAILED: "Failed",
};

export default function OwnerPaymentsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [payments, setPayments] = useState<OwnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "VERIFICATION_PENDING" | "SUCCEEDED" | "PENDING" | "FAILED">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "OWNER") { router.push("/"); return; }
    fetchPayments();
  }, [token, user, router]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/payments/owner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(res.data || []);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    setActionLoading(paymentId);
    try {
      await axios.post(
        "/api/payments/approve",
        { paymentId, action: "approve" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Payment approved!");
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: "SUCCEEDED" } : p))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to approve payment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!confirm("Are you sure you want to reject this payment?")) return;
    setActionLoading(paymentId);
    try {
      await axios.post(
        "/api/payments/approve",
        { paymentId, action: "reject" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Payment rejected");
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: "FAILED" } : p))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to reject payment");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = payments.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.booking.room.title.toLowerCase().includes(q) ||
        p.booking.student.name.toLowerCase().includes(q) ||
        p.booking.student.email.toLowerCase().includes(q) ||
        (p.paymentReference && p.paymentReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const counts = {
    all: payments.length,
    VERIFICATION_PENDING: payments.filter((p) => p.status === "VERIFICATION_PENDING").length,
    PENDING: payments.filter((p) => p.status === "PENDING").length,
    SUCCEEDED: payments.filter((p) => p.status === "SUCCEEDED").length,
    FAILED: payments.filter((p) => p.status === "FAILED").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Verification</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Review and verify student payments for your properties.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/owner/bookings"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition"
            >
              Bookings
            </Link>
            <Link
              href="/dashboard/owner"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
            <p className="text-2xl font-bold text-orange-600">{counts.VERIFICATION_PENDING}</p>
            <p className="text-sm text-orange-700 dark:text-orange-300">Needs Verification</p>
          </div>
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-2xl font-bold text-yellow-600">{counts.PENDING}</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Awaiting Payment</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-2xl font-bold text-green-600">{counts.SUCCEEDED}</p>
            <p className="text-sm text-green-700 dark:text-green-300">Paid</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-2xl font-bold text-gray-600">{counts.all}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">Total</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by room, student, email, or transaction ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
          {[
            { key: "all" as const, label: "All", count: counts.all },
            { key: "VERIFICATION_PENDING" as const, label: "Needs Verification", count: counts.VERIFICATION_PENDING, urgent: true },
            { key: "PENDING" as const, label: "Awaiting Payment", count: counts.PENDING },
            { key: "SUCCEEDED" as const, label: "Paid", count: counts.SUCCEEDED },
            { key: "FAILED" as const, label: "Failed", count: counts.FAILED },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition ${
                filter === tab.key
                  ? tab.urgent
                    ? "border-orange-500 text-orange-600"
                    : "border-maroon-600 text-maroon-600 dark:text-maroon-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 animate-pulse h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No payments found</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {filter === "VERIFICATION_PENDING"
                ? "No payments need verification right now."
                : "No payments match your filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((payment) => (
              <div
                key={payment.id}
                className={`rounded-2xl border bg-white shadow-sm overflow-hidden dark:bg-gray-900 transition ${
                  payment.status === "VERIFICATION_PENDING"
                    ? "border-orange-200 dark:border-orange-800"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Room Image */}
                    <div className="shrink-0">
                      <RoomImage
                        src={payment.booking.room.images?.[0]}
                        alt={payment.booking.room.title}
                        className="w-20 h-16 rounded-xl object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {payment.booking.room.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.booking.room.city}, {payment.booking.room.state}
                          </p>
                        </div>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[payment.status] || STATUS_STYLES.PENDING}`}>
                          {STATUS_LABELS[payment.status] || payment.status}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">{payment.booking.student.name}</p>
                        <p className="text-gray-500 dark:text-gray-400">{payment.booking.student.email}</p>
                        {payment.booking.student.phone && (
                          <p className="text-gray-500 dark:text-gray-400">{payment.booking.student.phone}</p>
                        )}
                      </div>

                      {/* Booking & Payment Info */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Check-in: {format(new Date(payment.booking.checkIn), "dd MMM yyyy")}</span>
                        <span>Check-out: {format(new Date(payment.booking.checkOut), "dd MMM yyyy")}</span>
                        <span>{payment.booking.totalDays} days ({payment.booking.bookingType.toLowerCase()})</span>
                        <span>Created: {format(new Date(payment.createdAt), "dd MMM yyyy, h:mm a")}</span>
                      </div>

                      {/* Transaction Reference */}
                      {payment.paymentReference && (
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Transaction ID submitted by student</p>
                          <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">{payment.paymentReference}</p>
                        </div>
                      )}
                    </div>

                    {/* Amount + Actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{payment.amount.toLocaleString()}</p>

                      {payment.status === "VERIFICATION_PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(payment.id)}
                            disabled={actionLoading === payment.id}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {actionLoading === payment.id ? "Processing..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(payment.id)}
                            disabled={actionLoading === payment.id}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}

                      {payment.status === "PENDING" && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Student hasn&apos;t paid yet
                        </p>
                      )}

                      {payment.status === "SUCCEEDED" && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Payment verified
                        </p>
                      )}
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
