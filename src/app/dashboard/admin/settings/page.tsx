"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { Settings, Save, Percent, Calculator, ArrowLeft } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [commissionPercent, setCommissionPercent] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
    fetchConfig();
  }, [hasHydrated, token, user, router]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const commissionKey = res.data.configs?.find(
        (c: { key: string; value: string }) => c.key === "commission_percent"
      );
      if (commissionKey) {
        setCommissionPercent(parseFloat(commissionKey.value) || 5);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commissionPercent < 0 || commissionPercent > 100) {
      toast.error("Commission must be between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        "/api/admin/config",
        { configs: [{ key: "commission_percent", value: String(commissionPercent) }] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Commission updated successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const sampleAmount = 10000;
  const platformEarns = (sampleAmount * commissionPercent) / 100;
  const ownerReceives = sampleAmount - platformEarns;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-700 dark:text-gray-200">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/admin"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-maroon-600 hover:border-maroon-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure platform-wide commission rates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 bg-maroon-50 dark:bg-maroon-900/20 border border-maroon-200 dark:border-maroon-800"
        >
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-maroon-600 dark:text-maroon-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-maroon-700 dark:text-maroon-300">
                Current commission: {commissionPercent}%
              </p>
              <p className="text-xs text-maroon-600 dark:text-maroon-400 mt-0.5">
                This percentage is deducted from each booking payment. The rest is paid to the property owner.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Settings className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Commission Settings</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Commission Percentage
                <div className="relative mt-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">%</span>
                </div>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview</h2>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              For a ₹{sampleAmount.toLocaleString()} booking:
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-sm text-gray-600 dark:text-gray-400">Platform earns</span>
                <span className="text-sm font-semibold text-maroon-600 dark:text-maroon-400">₹{platformEarns.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-sm text-gray-600 dark:text-gray-400">Owner receives</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">₹{ownerReceives.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
