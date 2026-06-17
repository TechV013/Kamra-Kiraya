"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  QrCode,
  Save,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export default function OwnerPaymentSettingsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "OWNER") { router.push("/"); return; }
    fetchProfile();
  }, [hasHydrated, token, user, router]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpiId(res.data.upiId || "");
      setUpiName(res.data.upiName || "");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim()) {
      toast.error("UPI ID is required");
      return;
    }
    setSaving(true);
    try {
      await axios.patch(
        "/api/users/profile",
        { upiId: upiId.trim(), upiName: upiName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Payment settings saved successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = Boolean(upiId.trim());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-700 dark:text-gray-200">
        Loading payment settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/owner"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-maroon-600 hover:border-maroon-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Payment Settings
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Configure your UPI payment details
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 border ${
            isConfigured
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
          }`}
        >
          <div className="flex items-center gap-3">
            {isConfigured ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
            )}
            <div>
              <p
                className={`font-semibold text-sm ${
                  isConfigured
                    ? "text-green-700 dark:text-green-300"
                    : "text-yellow-700 dark:text-yellow-300"
                }`}
              >
                {isConfigured ? "Payment configured" : "Not configured"}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  isConfigured
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {isConfigured
                  ? `UPI ID: ${upiId}`
                  : "Set up your UPI ID to receive payments from students"}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                UPI Details
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                UPI ID
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="owner@upi"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </label>

              <label className="block text-sm text-gray-700 dark:text-gray-300">
                UPI Display Name
                <input
                  type="text"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  placeholder="Raj Properties"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                  Shown to students when they make a payment
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-maroon-600 px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </form>
          </motion.div>

          {/* QR Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <QrCode className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                QR Preview
              </h2>
            </div>

            {isConfigured ? (
              <div className="flex flex-col items-center">
                <div className="w-full aspect-square rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                  <img
                    src={`/api/qr?upiId=${encodeURIComponent(upiId)}&amount=1&payeeName=${encodeURIComponent(upiName || "Payment")}`}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  Students will scan this QR to pay
                </p>
              </div>
            ) : (
              <div className="aspect-square rounded-xl bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-center p-4">
                <QrCode className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No QR code available
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Add your UPI ID to generate a QR code
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
