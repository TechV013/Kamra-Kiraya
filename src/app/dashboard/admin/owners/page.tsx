"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { Users, Search, Eye, ChevronLeft, ChevronRight, Building2, BookOpen, Mail, Phone } from "lucide-react";
import RoomImage from "@/components/rooms/RoomImage";

interface OwnerUser {
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

interface OwnerDetail extends OwnerUser {
  rooms: {
    id: string;
    title: string;
    city: string;
    status: string;
    priceMonthly: number;
    images: string[];
    _count: { bookings: number };
  }[];
}

export default function AdminOwnersPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [owners, setOwners] = useState<OwnerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOwner, setSelectedOwner] = useState<OwnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    if (token && user?.role === "ADMIN") fetchOwners();
  }, [token, user, page]);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/users?role=OWNER&page=${page}&limit=12`, { headers: { Authorization: `Bearer ${token}` } });
      setOwners(res.data.users || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load owners");
    } finally {
      setLoading(false);
    }
  };

  const viewOwnerDetail = async (ownerId: string) => {
    setDetailLoading(true);
    try {
      const [userRes, roomsRes] = await Promise.all([
        axios.get(`/api/admin/users/${ownerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/admin/rooms?limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const userData = userRes.data;
      const allRooms = roomsRes.data.rooms || [];
      const ownerRooms = allRooms.filter((r: any) => r.owner?.id === ownerId);
      setSelectedOwner({ ...userData, rooms: ownerRooms });
    } catch {
      toast.error("Failed to load owner details");
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleActive = async (ownerId: string, isActive: boolean) => {
    setActionLoading(ownerId);
    try {
      await axios.patch(`/api/admin/users/${ownerId}`, { isActive: !isActive }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isActive ? "Owner deactivated" : "Owner activated");
      setOwners((prev) => prev.map((o) => o.id === ownerId ? { ...o, isActive: !isActive } : o));
      if (selectedOwner?.id === ownerId) setSelectedOwner((prev) => prev ? { ...prev, isActive: !isActive } : prev);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update owner");
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async (ownerId: string) => {
    if (!confirm("Remove this owner? They will become a student.")) return;
    setActionLoading(ownerId);
    try {
      await axios.patch(`/api/admin/users/${ownerId}`, { role: "STUDENT" }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Owner role removed");
      setOwners((prev) => prev.filter((o) => o.id !== ownerId));
      setSelectedOwner(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to change role");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = owners.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Owner Management</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">View and manage all property owners.</p>
          </div>
          <Link href="/dashboard/admin" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition">
            Back to Dashboard
          </Link>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search owners..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No owners found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((owner) => (
              <div key={owner.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-bold text-lg shrink-0">
                      {owner.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{owner.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${owner.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {owner.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{owner.email}</p>
                      {owner.phone && <p className="text-xs text-gray-400">{owner.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 shrink-0">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {owner._count.rooms} rooms</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {owner._count.bookings} bookings</span>
                    <span>Joined {format(new Date(owner.createdAt), "MMM yyyy")}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => viewOwnerDetail(owner.id)} disabled={detailLoading} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button onClick={() => toggleActive(owner.id, owner.isActive)} disabled={actionLoading === owner.id} className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition disabled:opacity-50">
                      {owner.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
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

        {/* Owner Detail Modal */}
        {selectedOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedOwner(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-bold text-xl">
                      {selectedOwner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedOwner.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedOwner.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedOwner(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedOwner.phone || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className={`font-semibold ${selectedOwner.isActive ? "text-green-600" : "text-red-600"}`}>{selectedOwner.isActive ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Total Rooms</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedOwner._count.rooms}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Total Bookings</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedOwner._count.bookings}</p>
                  </div>
                </div>

                {selectedOwner.rooms.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rooms</p>
                    <div className="space-y-2">
                      {selectedOwner.rooms.map((room) => (
                        <div key={room.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <RoomImage src={room.images?.[0]} alt={room.title} className="w-12 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{room.title}</p>
                            <p className="text-xs text-gray-500">{room.city} · ₹{room.priceMonthly}/mo</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            room.status === "APPROVED" ? "bg-green-100 text-green-700" :
                            room.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{room.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => toggleActive(selectedOwner.id, selectedOwner.isActive)} disabled={actionLoading === selectedOwner.id} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition disabled:opacity-50">
                    {selectedOwner.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => changeRole(selectedOwner.id)} disabled={actionLoading === selectedOwner.id} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50 transition">
                    Remove as Owner
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
