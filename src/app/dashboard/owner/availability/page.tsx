"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import AvailabilityCalendar from "@/components/rooms/AvailabilityCalendar";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

interface RoomOption {
  id: string;
  title: string;
  totalRooms: number;
}

export default function OwnerAvailabilityPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "OWNER") { router.push("/"); return; }
    fetchRooms();
  }, [hasHydrated, token, user, router]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get("/api/rooms/my-rooms", { headers: { Authorization: `Bearer ${token}` } });
      const roomsData = res.data.rooms || res.data || [];
      setRooms(roomsData);
      if (roomsData.length > 0) setSelectedRoomId(roomsData[0].id);
    } catch {
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = useCallback(async () => {
    if (!selectedRoomId || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/rooms/${selectedRoomId}/availability?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCalendarData(res.data.calendar || []);
    } catch {
      toast.error("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, [selectedRoomId, year, month, token]);

  useEffect(() => {
    if (selectedRoomId) fetchCalendar();
  }, [selectedRoomId, fetchCalendar]);

  const handleDateToggle = async (date: string, currentStatus: { isBlocked: boolean }) => {
    if (!token) return;
    setSaving(true);
    try {
      await axios.post(`/api/rooms/${selectedRoomId}/availability`,
        { updates: [{ date, isBlocked: !currentStatus.isBlocked }] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCalendar();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async (updates: Array<{ date: string; isBlocked?: boolean; availableCount?: number }>) => {
    if (!token) return;
    setSaving(true);
    try {
      await axios.post(`/api/rooms/${selectedRoomId}/availability`,
        { updates },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Updated ${updates.length} dates`);
      fetchCalendar();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard/owner" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Availability Calendar</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage date availability, block dates, and set room counts</p>
          </div>
        </div>

        {rooms.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No rooms yet</p>
            <p className="text-sm text-gray-500">Add a room to start managing availability</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Room</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.title} ({r.totalRooms} room{r.totalRooms > 1 ? "s" : ""})</option>
                ))}
              </select>
            </div>

            <div className="max-w-md mx-auto">
              <AvailabilityCalendar
                roomId={selectedRoomId}
                year={year}
                month={month}
                calendarData={calendarData}
                onMonthChange={(y, m) => { setYear(y); setMonth(m); }}
                mode="edit"
                onDateToggle={handleDateToggle}
                onBulkUpdate={handleBulkUpdate}
                minDate={new Date()}
                loading={loading}
              />
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </div>
            )}

            {selectedRoom && (
              <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Room Info</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Title:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedRoom.title}</span></div>
                  <div><span className="text-gray-500">Total Units:</span> <span className="font-medium">{selectedRoom.totalRooms}</span></div>
                </div>
                <p className="text-xs text-gray-400 mt-4">Click any date to toggle blocked/unblocked. Use bulk actions to update the entire month. The number shown on each date is the effective available count.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
