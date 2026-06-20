"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Upload, Shield, CheckCircle, Clock, XCircle, AlertCircle,
  FileText, RefreshCw, Eye
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import VerificationBadge from "@/components/shared/VerificationBadge";

const DOC_TYPES = ["aadhaar", "pan", "property"] as const;
const DOC_LABELS: Record<string, string> = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  property: "Property Proof",
};

export default function OwnerVerificationPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "OWNER") { router.push("/"); return; }
    fetchStatus();
  }, [token, user, hasHydrated]);

  const fetchStatus = async () => {
    try {
      const res = await axios.get("/api/owner/verification", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecord(res.data);
      if (res.data.aadhaarUrl) setDocs((d) => ({ ...d, aadhaar: res.data.aadhaarUrl }));
      if (res.data.panUrl) setDocs((d) => ({ ...d, pan: res.data.panUrl }));
      if (res.data.propertyProofUrl) setDocs((d) => ({ ...d, property: res.data.propertyProofUrl }));
    } catch {
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (type: string, file: File) => {
    if (!["aadhaar", "pan", "property"].includes(type)) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and PDF files allowed");
      return;
    }

    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const res = await axios.post("/api/owner/verification/upload", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setDocs((d) => ({ ...d, [type]: res.data.path }));
      toast.success(`${DOC_LABELS[type]} uploaded`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!docs.aadhaar || !docs.pan || !docs.property) {
      toast.error("Please upload all three documents");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post("/api/owner/verification",
        { aadhaarUrl: docs.aadhaar, panUrl: docs.pan, propertyProofUrl: docs.property },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecord(res.data);
      toast.success("Verification submitted! Admin will review your documents.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-600" />
      </div>
    );
  }

  const status = record?.status || null;
  const canSubmit = docs.aadhaar && docs.pan && docs.property;
  const needsResubmit = status === "REJECTED";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/dashboard/owner"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-maroon-100 dark:bg-maroon-900/30">
            <Shield className="w-6 h-6 text-maroon-600 dark:text-maroon-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Owner Verification</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Submit your documents to start publishing rooms</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Status</span>
            <VerificationBadge status={status} size="lg" />
          </div>
          {record?.expiresAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Verified until {new Date(record.expiresAt).toLocaleDateString()}
            </p>
          )}
          {record?.rejectionNote && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-600 dark:text-red-300">{record.rejectionNote}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Documents</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Upload clear photos or scans (JPEG, PNG, PDF • max 5MB each)</p>

          <div className="space-y-4">
            {DOC_TYPES.map((type) => (
              <div key={type} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{DOC_LABELS[type]}</span>
                  {docs[type] ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" /> Uploaded
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not uploaded</span>
                  )}
                </div>
                <label className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${docs[type] ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20" : "border-gray-300 dark:border-gray-600 hover:border-maroon-300"}`}>
                  <Upload className={`w-5 h-5 ${docs[type] ? "text-green-500" : "text-gray-400"}`} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {uploading === type ? "Uploading..." : docs[type] ? "Replace file" : "Click to upload"}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    disabled={uploading === type}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(type, file);
                    }}
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`w-full mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition ${canSubmit && !submitting ? "bg-maroon-600 text-white hover:bg-maroon-500" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"}`}
          >
            {submitting ? (
              <>Submitting...</>
            ) : needsResubmit ? (
              <><RefreshCw className="w-4 h-4" /> Resubmit for Review</>
            ) : (
              <><Shield className="w-4 h-4" /> Submit for Verification</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
