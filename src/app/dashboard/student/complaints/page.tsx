"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { AlertTriangle, Search, Plus, ChevronLeft, ChevronRight, MessageCircle, CheckCircle, Clock, ArrowUpCircle, XCircle, RotateCcw } from "lucide-react";

interface Complaint {
  id: string;
  category: string;
  title: string;
  status: string;
  createdAt: string;
  complainant: { id: string; name: string };
  respondent: { id: string; name: string };
  booking: { id: string; room: { title: string } } | null;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ESCALATED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: "Maintenance Issue",
  PAYMENT: "Payment Dispute",
  REFUND: "Refund Request",
  PROPERTY_ISSUE: "Property Issue",
  HARASSMENT: "Harassment",
  FAKE_LISTING: "Fake Listing",
  OTHER: "Other",
};

export default function StudentComplaintsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "STUDENT") { router.push("/"); return; }
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    if (token && user?.role === "STUDENT") fetchComplaints();
  }, [token, user, page, statusFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await axios.get(`/api/complaints?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setComplaints(res.data.complaints || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.respondent.name.toLowerCase().includes(q) || c.booking?.room.title.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Complaints</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Track and manage your complaints</p>
          </div>
          <Link href="/dashboard/student/complaints/new" className="inline-flex items-center gap-2 rounded-xl bg-maroon-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-maroon-700 transition">
            <Plus className="w-4 h-4" /> File Complaint
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search complaints..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition ${statusFilter === s ? "bg-maroon-600 text-white border-maroon-600" : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-50"}`}>
                {s || "All"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No complaints found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">If you have an issue, file a complaint</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <Link key={c.id} href={`/dashboard/student/complaints/${c.id}`} className="block rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{c.title}</h3>
                      <span className="text-xs text-gray-400 shrink-0">{CATEGORY_LABELS[c.category] || c.category}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Against: {c.respondent.name} · {c.booking ? `Room: ${c.booking.room.title}` : "Platform"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                </div>
              </Link>
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
      </div>
    </div>
  );
}
