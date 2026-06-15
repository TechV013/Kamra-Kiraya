"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, Trash2, Eye } from "lucide-react";
import RoomImage from "@/components/rooms/RoomImage";

interface Booking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  totalDays: number;
  bookingType: string;
  specialNote?: string;
  room: {
    id: string;
    title: string;
    images: string[];
    priceDaily: number;
    priceMonthly: number;
  };
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
  payment?: {
    id: string;
    status: string;
    transactionRef?: string;
    paymentReference?: string;
    amount: number;
  } | null;
}

export default function OwnerBookingsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentActionLoading, setPaymentActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user?.role !== "OWNER") {
      router.push("/");
      return;
    }

    fetchBookings();
  }, [token, user, router]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/bookings/owner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      toast.error("Unable to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await axios.patch(
        `/api/bookings/${bookingId}`,
        { status: "CONFIRMED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Booking approved!");
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "CONFIRMED" } : b))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to approve booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await axios.patch(
        `/api/bookings/${bookingId}`,
        { status: "REJECTED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Booking rejected");
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "REJECTED" } : b))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to reject booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await axios.patch(
        `/api/bookings/${bookingId}`,
        { status: "CANCELLED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Booking cancelled");
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePaymentAction = async (paymentId: string, action: "approve" | "reject") => {
    setPaymentActionLoading(paymentId);
    try {
      await axios.post(
        "/api/payments/approve",
        { paymentId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(action === "approve" ? "Payment approved!" : "Payment rejected");
      setBookings((prev) =>
        prev.map((b) =>
          b.payment?.id === paymentId
            ? { ...b, payment: { ...b.payment!, status: action === "approve" ? "SUCCEEDED" : "FAILED" } }
            : b
        )
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Payment action failed");
    } finally {
      setPaymentActionLoading(null);
    }
  };

  const filtered = bookings.filter((booking) => {
    if (filter === "pending") return booking.status === "PENDING";
    if (filter === "approved") return booking.status === "CONFIRMED";
    if (filter === "rejected") return booking.status === "REJECTED";
    if (filter === "payment_pending") return booking.payment?.status === "VERIFICATION_PENDING";
    return true;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-700",
      CONFIRMED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      CANCELLED: "bg-gray-100 text-gray-700",
      COMPLETED: "bg-blue-100 text-blue-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-5 h-5" />;
      case "CONFIRMED":
        return <CheckCircle2 className="w-5 h-5" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Booking Requests</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Manage student booking requests for your properties.
            </p>
          </div>
          <Link
            href="/dashboard/owner"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition"
          >
            Back to dashboard
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 flex flex-wrap gap-3 border-b border-gray-200 dark:border-gray-800">
          {[
            { key: "pending", label: "Pending Approval", count: bookings.filter((b) => b.status === "PENDING").length },
            { key: "payment_pending", label: "Payment Verification", count: bookings.filter((b) => b.payment?.status === "VERIFICATION_PENDING").length },
            { key: "approved", label: "Approved", count: bookings.filter((b) => b.status === "CONFIRMED").length },
            { key: "rejected", label: "Rejected", count: bookings.filter((b) => b.status === "REJECTED").length },
            { key: "all", label: "All Bookings", count: bookings.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition ${
                filter === tab.key
                  ? "border-maroon-600 text-maroon-600 dark:text-maroon-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 animate-pulse h-32"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {filter === "pending"
                ? "No pending booking requests at this moment."
                : filter === "payment_pending"
                ? "No payments pending verification."
                : "No bookings match your filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <div
                key={booking.id}
                className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden"
              >
                <div className="grid gap-4 md:grid-cols-[120px_1fr_auto] p-6">
                  {/* Room Image */}
                  <div className="h-28 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <RoomImage
                      src={booking.room.images?.[0]}
                      alt={booking.room.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {booking.room.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-2 items-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status === "PENDING"
                              ? "Pending Approval"
                              : booking.status === "CONFIRMED"
                              ? "Approved"
                              : booking.status === "REJECTED"
                              ? "Rejected"
                              : booking.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-medium text-gray-900 dark:text-white">{booking.student.name}</p>
                      <p>{booking.student.email}</p>
                      {booking.student.phone && <p>{booking.student.phone}</p>}
                    </div>

                    {/* Booking Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Check-in</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {format(new Date(booking.checkIn), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Check-out</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {format(new Date(booking.checkOut), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {booking.totalDays} days ({booking.bookingType.toLowerCase()})
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
                        <p className="font-medium text-maroon-600 dark:text-maroon-400">
                          ₹{booking.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {booking.specialNote && (
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Special Note</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{booking.specialNote}</p>
                      </div>
                    )}

                    {/* Payment Verification Info */}
                    {booking.payment && booking.payment.status === "VERIFICATION_PENDING" && (
                      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 dark:bg-yellow-900/20 dark:border-yellow-800">
                        <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Payment Pending Verification</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          Transaction ID: <span className="font-mono">{booking.payment.paymentReference}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Amount: ₹{booking.payment.amount.toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handlePaymentAction(booking.payment!.id, "approve")}
                            disabled={paymentActionLoading === booking.payment!.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-60 transition"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Approve Payment
                          </button>
                          <button
                            onClick={() => handlePaymentAction(booking.payment!.id, "reject")}
                            disabled={paymentActionLoading === booking.payment!.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60 transition"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject Payment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 justify-start">
                    {booking.status === "PENDING" ? (
                      <>
                        <button
                          onClick={() => handleApprove(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    ) : booking.status === "CONFIRMED" ? (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel
                      </button>
                    ) : null}
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
