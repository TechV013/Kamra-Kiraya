"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { Shield, Search, Eye, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, Users } from "lucide-react";
import VerificationBadge from "@/components/shared/VerificationBadge";

interface VerificationRecord {
  id: string;
  ownerId: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  expiresAt: string | null;
  owner: { id: string; name: string; email: string; phone: string | null };
}

const FILTERS = ["all", "PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"] as const;

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
    fetchData();
  }, [hasHydrated, token, user, router, filter]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);

      const res = await axios.get(`/api/admin/verifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data.records || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-maroon-100 dark:bg-maroon-900/30">
          <Shield className="w-6 h-6 text-maroon-600 dark:text-maroon-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Owner Verifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total requests</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? "bg-maroon-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase().replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by owner name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-600" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No verification requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{rec.owner.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{rec.owner.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <VerificationBadge status={rec.status} />
                  <span className="text-xs text-gray-400">
                    {format(new Date(rec.submittedAt), "dd MMM yyyy")}
                  </span>
                  <Link
                    href={`/dashboard/admin/verifications/${rec.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Review
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
