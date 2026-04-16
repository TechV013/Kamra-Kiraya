"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { AlertCircle, CheckCircle, Clock, QrCode, Download, Copy } from "lucide-react";
import Link from "next/link";

interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  transactionRef?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    room: {
      id: string;
      title: string;
      images: string[];
    };
  };
}

export default function PaymentsPage() {
  const { token, user } = useAuthStore();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [paymentReferenceInput, setPaymentReferenceInput] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchPayments();
  }, [token]);

  const fetchPayments = async () => {
    try {
      const res = await axios.get("/api/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      SUCCEEDED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      REFUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };
    const icons = {
      PENDING: <Clock className="w-4 h-4 inline mr-1" />,
      SUCCEEDED: <CheckCircle className="w-4 h-4 inline mr-1" />,
      FAILED: <AlertCircle className="w-4 h-4 inline mr-1" />,
      REFUNDED: <CheckCircle className="w-4 h-4 inline mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  const generateQRPayload = (paymentId: string, amount: number) => {
    const upiId = process.env.NEXT_PUBLIC_UPI_ID;
    const payeeName = "कमरा किराया";
    const note = `Payment ${paymentId}`;
    
    const params = new URLSearchParams({
      pa: upiId || "",
      pn: payeeName,
      am: amount.toFixed(2),
      cu: "INR",
      tn: note,
      tr: `payment_${paymentId}`,
    });

    return `upi://pay?${params.toString()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleVerifyPayment = async () => {
    if (!selectedPayment) return;
    if (!paymentReferenceInput.trim()) {
      toast.error("Please enter the transaction reference");
      return;
    }

    setVerifyingPayment(true);
    try {
      await axios.post(
        "/api/payments/verify",
        {
          paymentId: selectedPayment.id,
          bookingId: selectedPayment.bookingId,
          paymentReference: paymentReferenceInput.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Payment verified successfully.");
      setShowQRModal(false);
      setPaymentReferenceInput("");
      setSelectedPayment(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to verify payment");
    } finally {
      setVerifyingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment History</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Track your room booking payments and QR codes</p>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
            <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No payments yet</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Your booking payments will appear here</p>
            <Link href="/browse" className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">
              Browse rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={payment.booking.room.images?.[0] || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=100&q=80"}
                          alt={payment.booking.room.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{payment.booking.room.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Check-in: {new Date(payment.booking.checkIn).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{getStatusBadge(payment.status)}</p>
                    </div>
                  </div>

                  {payment.status === "PENDING" && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowQRModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium"
                      >
                        <QrCode className="w-4 h-4" />
                        View & Pay with QR
                      </button>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Payment ID: {payment.id.slice(0, 8)}... | Created: {new Date(payment.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQRModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pay with UPI</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Scan the QR code with any UPI payment app</p>

            <div className="grid place-items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateQRPayload(selectedPayment.id, selectedPayment.amount))}`}
                alt="UPI QR code"
                className="w-64 h-64 rounded-lg"
              />
            </div>

            <div className="space-y-3 text-sm">
              {selectedPayment.transactionRef && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-300">
                  <div className="font-medium text-gray-900 dark:text-white">Transaction request ref</div>
                  <div>{selectedPayment.transactionRef}</div>
                </div>
              )}
              <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Amount</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{selectedPayment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">UPI ID</span>
                <button
                  onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_UPI_ID || "")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono text-xs flex items-center gap-1"
                >
                  {process.env.NEXT_PUBLIC_UPI_ID} <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Transaction reference</label>
              <input
                value={paymentReferenceInput}
                onChange={(e) => setPaymentReferenceInput(e.target.value)}
                placeholder="Enter UPI transaction ID"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition"
              />
              <button
                onClick={handleVerifyPayment}
                disabled={verifyingPayment}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 disabled:opacity-60 transition-colors"
              >
                {verifyingPayment ? "Verifying..." : "Confirm Payment"}
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">Enter the transaction reference from your UPI app after you pay.</p>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setPaymentReferenceInput("");
                }}
                className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
