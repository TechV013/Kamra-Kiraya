"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Shield, CheckCircle, XCircle, Download, User,
  Mail, Phone, Building2, Calendar, FileText, AlertCircle
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { format } from "date-fns";

const DOC_LABELS: Record<string, string> = {
  aadhaarUrl: "Aadhaar Card",
  panUrl: "PAN Card",
  propertyProofUrl: "Property Proof",
};

export default function VerificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, hasHydrated } = useAuthStore();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
    fetchDetail();
  }, [hasHydrated, token, user, router]);

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`/api/admin/verifications/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecord(res.data);
    } catch {
      toast.error("Failed to load verification");
      router.push("/dashboard/admin/verifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (action === "reject" && rejectionNote.trim().length < 10) {
      toast.error("Please provide a detailed rejection note (at least 10 characters)");
      return;
    }
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "reject") body.rejectionNote = rejectionNote;
      await axios.put(`/api/admin/verifications/${params.id}`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(action === "approve" ? "Verification approved!" : "Verification rejected");
      fetchDetail();
      setRejectionNote("");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-600" />
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/dashboard/admin/verifications"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Verifications
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-maroon-100 dark:bg-maroon-900/30">
              <Shield className="w-6 h-6 text-maroon-600 dark:text-maroon-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Verification Review</h1>
              <VerificationBadge status={record.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Owner Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{record.owner.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{record.owner.email}</span>
              </div>
              {record.owner.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{record.owner.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Joined {format(new Date(record.owner.createdAt), "dd MMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {record.owner.roomCount || 0} rooms listed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Submitted {format(new Date(record.submittedAt), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documents</h2>
            <div className="space-y-4">
              {["aadhaarUrl", "panUrl", "propertyProofUrl"].map((key) => (
                <div key={key}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {DOC_LABELS[key]}
                  </p>
                  {record[key] ? (
                    <a
                      href={record[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      <FileText className="w-4 h-4" /> View Document
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">Not uploaded</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {record.rejectionNote && (
          <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Previous Rejection Reason</p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{record.rejectionNote}</p>
                {record.reviewer && (
                  <p className="text-xs text-red-500 mt-1">Reviewed by {record.reviewer.name}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {(record.status === "PENDING" || record.status === "UNDER_REVIEW" || record.status === "REJECTED") && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Decision</h2>

            <div className="space-y-4 mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rejection Note <span className="text-xs text-gray-400">(required for rejection, min 10 chars)</span>
                </span>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/30"
                  placeholder="Specify which documents need correction or what information is missing..."
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAction("approve")}
                disabled={actionLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60 transition"
              >
                <CheckCircle className="w-4 h-4" />
                {actionLoading ? "Processing..." : "Approve"}
              </button>
              <button
                onClick={() => handleAction("reject")}
                disabled={actionLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 transition"
              >
                <XCircle className="w-4 h-4" />
                {actionLoading ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        )}

        {record.reviewer && record.status !== "REJECTED" && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reviewed by <span className="font-medium text-gray-700 dark:text-gray-300">{record.reviewer.name}</span>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
