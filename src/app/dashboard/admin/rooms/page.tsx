"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Eye, Search, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import RoomImage from "@/components/rooms/RoomImage";

interface AdminRoom {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  address: string;
  priceDaily: number;
  priceMonthly: number;
  status: string;
  roomType: string;
  totalRooms: number;
  availableRooms: number;
  images: string[];
  amenities: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  _count: { bookings: number };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  INACTIVE: "bg-gray-100 text-gray-600",
};

export default function AdminRoomsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE">("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<AdminRoom | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    if (token && user?.role === "ADMIN") fetchRooms();
  }, [token, user, filter, page]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (filter !== "all") params.set("status", filter);
      const res = await axios.get(`/api/admin/rooms?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data.rooms || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (roomId: string, status: string) => {
    setActionLoading(roomId);
    try {
      await axios.patch(`/api/admin/rooms/${roomId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Room ${status.toLowerCase()}`);
      setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, status } : r));
      setSelectedRoom(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update room");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = rooms.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || r.owner.name.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Room Management</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Approve, reject, or manage room listings.</p>
          </div>
          <Link href="/dashboard/admin" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition">
            Back to Dashboard
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, city, or owner..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
          {(["all", "PENDING", "APPROVED", "REJECTED", "INACTIVE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setFilter(tab); setPage(1); }}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition ${
                filter === tab
                  ? "border-maroon-600 text-maroon-600 dark:text-maroon-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {tab === "all" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Room List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No rooms found</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {filter === "PENDING" ? "No rooms pending approval." : "No rooms match your filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((room) => (
              <div key={room.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-4 p-5">
                  <RoomImage src={room.images?.[0]} alt={room.title} className="w-full sm:w-32 h-24 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{room.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{room.address}, {room.city}, {room.state}</p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[room.status] || ""}`}>
                        {room.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Owner: {room.owner.name}</span>
                      <span>₹{room.priceMonthly}/mo · ₹{room.priceDaily}/day</span>
                      <span>{room.roomType} · {room.availableRooms}/{room.totalRooms} available</span>
                      <span>{room._count.bookings} bookings</span>
                      <span>Created: {format(new Date(room.createdAt), "dd MMM yyyy")}</span>
                    </div>
                    {room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {room.amenities.slice(0, 5).map((a) => (
                          <span key={a} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => setSelectedRoom(room)} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {room.status === "PENDING" && (
                      <>
                        <button onClick={() => handleStatus(room.id, "APPROVED")} disabled={actionLoading === room.id} className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleStatus(room.id, "REJECTED")} disabled={actionLoading === room.id} className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {room.status === "APPROVED" && (
                      <button onClick={() => handleStatus(room.id, "INACTIVE")} disabled={actionLoading === room.id} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition">
                        Deactivate
                      </button>
                    )}
                    {room.status === "REJECTED" && (
                      <button onClick={() => handleStatus(room.id, "APPROVED")} disabled={actionLoading === room.id} className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition">
                        Approve
                      </button>
                    )}
                    {room.status === "INACTIVE" && (
                      <button onClick={() => handleStatus(room.id, "APPROVED")} disabled={actionLoading === room.id} className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition">
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Room Detail Modal */}
        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedRoom(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <RoomImage src={selectedRoom.images?.[0]} alt={selectedRoom.title} className="w-full h-56 object-cover rounded-t-2xl" />
                <button onClick={() => setSelectedRoom(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRoom.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRoom.address}, {selectedRoom.city}, {selectedRoom.state}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[selectedRoom.status]}`}>
                    {selectedRoom.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedRoom.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Monthly Price</p>
                    <p className="font-semibold text-gray-900 dark:text-white">₹{selectedRoom.priceMonthly}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Daily Price</p>
                    <p className="font-semibold text-gray-900 dark:text-white">₹{selectedRoom.priceDaily}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Room Type</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedRoom.roomType}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500">Available</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedRoom.availableRooms}/{selectedRoom.totalRooms}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                  <p className="text-xs text-gray-500 mb-1">Owner</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedRoom.owner.name} ({selectedRoom.owner.email})</p>
                </div>
                {selectedRoom.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.amenities.map((a) => (
                      <span key={a} className="px-2.5 py-1 rounded-full text-xs bg-maroon-100 text-maroon-700 dark:bg-maroon-900/20 dark:text-maroon-300">{a}</span>
                    ))}
                  </div>
                )}
                {selectedRoom.status === "PENDING" && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleStatus(selectedRoom.id, "APPROVED")} disabled={actionLoading === selectedRoom.id} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 disabled:opacity-50 transition">
                      Approve
                    </button>
                    <button onClick={() => handleStatus(selectedRoom.id, "REJECTED")} disabled={actionLoading === selectedRoom.id} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50 transition">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
