"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=512&q=80";

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, token, hasHydrated, login } = useAuthStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
    fetchProfile();
  }, [hasHydrated, token, user, router]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/users/profile", { headers: { Authorization: `Bearer ${token}` } });
      setName(res.data.name || "");
      setPhone(res.data.phone || "");
      setAvatar(res.data.avatar || "");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await axios.patch(
        "/api/users/profile",
        { name, phone, avatar },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      login(res.data, token ?? "");
      toast.success("Profile updated successfully.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-700 dark:text-gray-200">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-xl dark:bg-gray-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Profile</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Update your administrator profile details.</p>
            </div>
            <img src={avatar || DEFAULT_AVATAR} alt="Profile avatar" className="w-20 h-20 rounded-3xl object-cover border border-gray-200 dark:border-gray-700" />
          </div>

          <form onSubmit={handleSave} className="mt-10 space-y-6">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Phone number
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Avatar URL
              <input
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">Email: {user?.email}</p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-maroon-600 px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
