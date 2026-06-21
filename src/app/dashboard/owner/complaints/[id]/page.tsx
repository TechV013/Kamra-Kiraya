"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import ComplaintTimeline from "@/components/complaints/ComplaintTimeline";
import { ArrowLeft, Send, CheckCircle, User, Calendar, Tag, Loader2 } from "lucide-react";

interface ComplaintDetail {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  attachments: string[];
  resolution: string | null;
  resolvedAt: string | null;
  escalatedAt: string | null;
  complainant: { id: string; name: string; email: string; avatar: string | null };
  respondent: { id: string; name: string; email: string; avatar: string | null };
  booking: { id: string; room: { id: string; title: string } } | null;
  messages: Array<{
    id: string;
    message: string;
    createdAt: string;
    sender: { id: string; name: string; avatar: string | null; role: string };
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    changedBy: { id: string; name: string; role: string };
  }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  NOISE: "Noise Disturbance", MAINTENANCE: "Maintenance Issue", HYGIENE: "Hygiene Problem",
  BILLING: "Billing Dispute", SECURITY: "Security Concern", HARASSMENT: "Harassment",
  ROOM_CONDITION: "Room Condition", OTHER: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ESCALATED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function OwnerComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, hasHydrated } = useAuthStore();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "OWNER") { router.push("/"); return; }
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    if (token && params.id) fetchComplaint();
  }, [token, params.id]);

  const fetchComplaint = async () => {
    try {
      const res = await axios.get(`/api/complaints/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setComplaint(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load complaint");
      router.push("/dashboard/owner/complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await axios.post(`/api/complaints/${params.id}/messages`, { message: message.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("");
      fetchComplaint();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveNote.trim()) { toast.error("Please provide a resolution note"); return; }
    setResolving(true);
    try {
      await axios.put(`/api/complaints/${params.id}`, { status: "RESOLVED", note: resolveNote.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Complaint marked as resolved");
      setResolveNote("");
      fetchComplaint();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to resolve");
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!complaint) return null;

  const showResolve = complaint.status !== "CLOSED" && complaint.status !== "RESOLVED";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/dashboard/owner/complaints" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Complaints
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{complaint.title}</h1>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[complaint.status]}`}>{complaint.status}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {CATEGORY_LABELS[complaint.category]}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(complaint.createdAt).toLocaleDateString()}</span>
                {complaint.booking && (
                  <Link href={`/rooms/${complaint.booking.room.id}`} className="flex items-center gap-1 text-maroon-600 hover:underline">
                    Room: {complaint.booking.room.title}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-6 text-sm mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><User className="w-4 h-4 text-gray-500" /></div>
              <div><p className="font-medium text-gray-900 dark:text-white">{complaint.complainant.name}</p><p className="text-xs text-gray-500">Complainant</p></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><User className="w-4 h-4 text-gray-500" /></div>
              <div><p className="font-medium text-gray-900 dark:text-white">{complaint.respondent.name}</p><p className="text-xs text-gray-500">Respondent</p></div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {complaint.description}
          </div>

          {complaint.resolution && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Resolution</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">{complaint.resolution}</p>
            </div>
          )}
        </div>

        {showResolve && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Resolve This Complaint</h3>
            <div className="flex gap-3">
              <input type="text" value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="Describe how this was resolved..." className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              <button onClick={handleResolve} disabled={resolving} className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition disabled:opacity-50">
                {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Resolve
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Messages ({complaint.messages.length})</h3>
          {complaint.messages.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No messages yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {complaint.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender.id === user?.id ? "justify-end" : ""}`}>
                  <div className={`max-w-[80%] rounded-xl p-3 text-sm ${msg.sender.id === user?.id ? "bg-maroon-100 dark:bg-maroon-900/30 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">{msg.sender.name}</span>
                      <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {complaint.status !== "CLOSED" && (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." disabled={sending} className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50" />
              <button type="submit" disabled={sending || !message.trim()} className="inline-flex items-center gap-1 rounded-xl bg-maroon-600 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-700 transition disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
              </button>
            </form>
          )}
        </div>

        <ComplaintTimeline history={complaint.statusHistory} />
      </div>
    </div>
  );
}
