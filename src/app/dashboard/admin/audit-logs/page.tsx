"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { Search, ChevronLeft, ChevronRight, Filter, Clock, User, Shield, RefreshCw, Loader2 } from "lucide-react";

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  actionLabel: string;
  entity: string;
  entityLabel: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
}

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  USER_LOGOUT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  USER_REGISTER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PASSWORD_RESET: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  ROOM_CREATE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  ROOM_UPDATE: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  ROOM_DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  BOOKING_CREATE: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  BOOKING_APPROVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  BOOKING_CANCEL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  PAYMENT_CREATE: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  PAYMENT_FAIL: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  COMPLAINT_CREATE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  ADMIN_ACTION: "bg-maroon-100 text-maroon-700 dark:bg-maroon-900/30 dark:text-maroon-300",
};

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [availableActions, setAvailableActions] = useState<Record<string, string>>({});
  const [availableEntities, setAvailableEntities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    if (token && user?.role === "ADMIN") fetchLogs();
  }, [token, user, page, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entity", entityFilter);
      if (userFilter) params.set("userId", userFilter);
      if (search) params.set("search", search);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const res = await axios.get(`/api/admin/audit-logs?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
      setAvailableActions(res.data.actions || {});
      setAvailableEntities(res.data.entities || {});
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const getActionColor = (action: string) => ACTION_COLORS[action] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Track all platform activity — {total.toLocaleString()} total events</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition ${showFilters ? "bg-maroon-600 text-white border-maroon-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"}`}>
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button onClick={handleSearch} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <Link href="/dashboard/admin" className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition">
              Dashboard
            </Link>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Action</label>
                <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option value="">All Actions</option>
                  {Object.entries(availableActions).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Entity</label>
                <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option value="">All Entities</option>
                  {Object.entries(availableEntities).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search (name, email, entity ID)</label>
                <div className="flex gap-2">
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search..." className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                  <button onClick={handleSearch} className="inline-flex items-center gap-1.5 rounded-xl bg-maroon-600 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-700 transition">
                    <Search className="w-4 h-4" /> Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No audit log entries found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adjust your filters or wait for platform activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionColor(log.action)}`}>{log.actionLabel}</span>
                      <span className="text-xs text-gray-400 uppercase">{log.entityLabel}</span>
                      <span className="text-xs text-gray-400 font-mono">#{log.entityId.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span>{log.user.name}</span>
                      <span className="text-xs text-gray-400">({log.user.email})</span>
                      <Shield className="w-3.5 h-3.5 ml-1" />
                      <span className="text-xs">{log.user.role}</span>
                    </div>
                    {log.ipAddress && (
                      <p className="text-xs text-gray-400 mt-1">IP: {log.ipAddress}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View metadata</summary>
                    <pre className="mt-1 text-xs bg-gray-50 dark:bg-gray-800 rounded-lg p-2 overflow-x-auto max-h-32">{JSON.stringify(log.metadata, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
