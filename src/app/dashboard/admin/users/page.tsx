"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { Users, Search, Eye, ChevronLeft, ChevronRight, Shield, UserCheck, UserX } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  _count: { bookings: number; rooms: number };
}

const ROLE_STYLES: Record<string, string> = {
  STUDENT: "bg-blue-100 text-blue-700",
  OWNER: "bg-emerald-100 text-emerald-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "STUDENT" | "OWNER" | "ADMIN">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    if (token && user?.role === "ADMIN") fetchUsers();
  }, [token, user, filter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (filter !== "all") params.set("role", filter);
      const res = await axios.get(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data.users || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      await axios.patch(`/api/admin/users/${userId}`, { isActive: !isActive }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isActive ? "User deactivated" : "User activated");
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: !isActive } : u));
      if (selectedUser?.id === userId) setSelectedUser((prev) => prev ? { ...prev, isActive: !isActive } : prev);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update user");
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    setActionLoading(userId);
    try {
      await axios.patch(`/api/admin/users/${userId}`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Role changed to ${newRole}`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to change role");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage all users, roles, and access.</p>
          </div>
          <Link href="/dashboard/admin" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition">
            Back to Dashboard
          </Link>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
          {(["all", "STUDENT", "OWNER", "ADMIN"] as const).map((tab) => (
            <button key={tab} onClick={() => { setFilter(tab); setPage(1); }} className={`pb-3 px-3 text-sm font-medium border-b-2 transition ${filter === tab ? "border-maroon-600 text-maroon-600 dark:text-maroon-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>
              {tab === "all" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No users found</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Rooms</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Bookings</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLES[u.role] || ""}`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{u._count.rooms}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{u._count.bookings}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{format(new Date(u.createdAt), "dd MMM yyyy")}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setSelectedUser(u)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => toggleActive(u.id, u.isActive)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50">
                            {u.isActive ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedUser(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-400">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Role</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLES[selectedUser.role]}`}>{selectedUser.role}</span>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className={`mt-1 font-semibold text-sm ${selectedUser.isActive ? "text-green-600" : "text-red-600"}`}>{selectedUser.isActive ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white text-sm">{selectedUser.phone || "—"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white text-sm">{format(new Date(selectedUser.createdAt), "dd MMM yyyy")}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => toggleActive(selectedUser.id, selectedUser.isActive)} disabled={actionLoading === selectedUser.id} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition disabled:opacity-50">
                    {selectedUser.isActive ? "Deactivate" : "Activate"}
                  </button>
                  {selectedUser.role !== "ADMIN" && (
                    <>
                      {selectedUser.role !== "OWNER" && (
                        <button onClick={() => changeRole(selectedUser.id, "OWNER")} disabled={actionLoading === selectedUser.id} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition">
                          Make Owner
                        </button>
                      )}
                      {selectedUser.role !== "STUDENT" && (
                        <button onClick={() => changeRole(selectedUser.id, "STUDENT")} disabled={actionLoading === selectedUser.id} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition">
                          Make Student
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
