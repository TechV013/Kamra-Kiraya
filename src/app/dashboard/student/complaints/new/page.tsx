"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { AlertTriangle, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "NOISE", label: "Noise Disturbance" },
  { value: "MAINTENANCE", label: "Maintenance Issue" },
  { value: "HYGIENE", label: "Hygiene Problem" },
  { value: "BILLING", label: "Billing Dispute" },
  { value: "SECURITY", label: "Security Concern" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "ROOM_CONDITION", label: "Room Condition" },
  { value: "OTHER", label: "Other" },
];

interface BookingOption {
  id: string;
  status: string;
  room: { title: string; city: string };
  owner: { name: string };
}

export default function NewComplaintPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "STUDENT") { router.push("/"); return; }
    fetchBookings();
  }, [hasHydrated, token, user, router]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("/api/bookings", { headers: { Authorization: `Bearer ${token}` } });
      setBookings(res.data || []);
    } catch {
      toast.error("Failed to load bookings");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post("/api/complaints", { bookingId: bookingId || undefined, category, title: title.trim(), description: description.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Complaint filed successfully");
      router.push(`/dashboard/student/complaints/${res.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to file complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/dashboard/student/complaints" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Complaints
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File a Complaint</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Describe your issue and we will help resolve it</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Related Booking (optional)</label>
              <select value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">No specific booking</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>{b.room.title} — {b.owner?.name || "Owner"} ({b.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary of your issue" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Describe your issue in detail..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-maroon-500 resize-y dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>

            <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-maroon-600 px-4 py-3 text-sm font-medium text-white hover:bg-maroon-700 transition disabled:opacity-50">
              {submitting ? "Submitting..." : <><Send className="w-4 h-4" /> File Complaint</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
