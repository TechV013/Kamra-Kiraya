"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft, Shield, Save, RefreshCcw, Camera, LogOut, Mail } from "lucide-react";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=512&q=80";

type ProfileData = {
  name: string;
  phone: string;
  avatar: string;
  email: string;
  role: string;
  createdAt: string;
  isVerified: boolean;
  isActive: boolean;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, token, hasHydrated, login, logout } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    phone: "",
    avatar: "",
    email: user?.email || "",
    role: user?.role || "STUDENT",
    createdAt: "",
    isVerified: false,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [token, hasHydrated]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setProfile({
        name: data.name || "",
        phone: data.phone || "",
        avatar: data.avatar || "",
        email: data.email || "",
        role: data.role || user?.role || "STUDENT",
        createdAt: data.createdAt || "",
        isVerified: data.isVerified ?? false,
        isActive: data.isActive ?? true,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Unable to load your profile.");
      router.push("/login");
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
        { name: profile.name, phone: profile.phone, avatar: profile.avatar },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      login(res.data, token ?? "");
      setProfile((current) => ({ ...current, ...res.data }));
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-gray-700 dark:text-gray-200">
        <div className="rounded-3xl bg-white/80 dark:bg-gray-900/80 px-8 py-6 shadow-xl backdrop-blur text-center">
          <p className="text-lg font-medium">Loading your profile…</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">One moment while we prepare your account settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href={
              user?.role === "STUDENT"
                ? "/dashboard/student"
                : user?.role === "OWNER"
                ? "/dashboard/owner"
                : "/"
            }
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] bg-white p-8 shadow-xl dark:bg-gray-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-maroon-600 dark:text-maroon-300">Account</p>
                <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Profile settings</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Update your name, phone, and profile image. Keep your account details current for the best experience.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-3xl bg-maroon-50 px-4 py-2 text-sm font-semibold text-maroon-700 dark:bg-maroon-900/40 dark:text-maroon-200">
                <Shield className="w-4 h-4" /> {profile.role}
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-3xl bg-maroon-50 px-5 py-5 dark:bg-maroon-950/30">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Member since</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{profile.createdAt ? format(new Date(profile.createdAt), "MMMM d, yyyy") : "Not available"}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-5 dark:bg-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Verified account</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">{profile.isVerified ? "Verified" : "Not verified"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${profile.isVerified ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200"}`}>
                      {profile.isVerified ? "Live" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl bg-gray-50 p-5 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Account status</p>
                  <p className="mt-2 font-semibold text-gray-900 dark:text-white">{profile.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-5 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Primary email</p>
                  <p className="mt-2 font-semibold text-gray-900 dark:text-white">{profile.email}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-10 space-y-6">
              <div className="grid gap-5 lg:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full name
                  <input
                    value={profile.name}
                    onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                    className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone number
                  <input
                    value={profile.phone}
                    onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                    className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="+91 98765 43210"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile image URL</label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <input
                    value={profile.avatar}
                    onChange={(event) => setProfile({ ...profile, avatar: event.target.value })}
                    className="flex-1 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Paste an image URL"
                  />
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, avatar: "" })}
                    className="inline-flex items-center gap-2 rounded-3xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <RefreshCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-950">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-gray-200 dark:bg-gray-800">
                      <img
                        src={profile.avatar || DEFAULT_AVATAR}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Profile preview</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Any image URL you paste will show here immediately.</p>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">If you don't have a profile image, leave it blank for a clean avatar fallback.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white">Need help?</p>
                  <p>Visit the support page any time for account questions.</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-maroon-600 px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving changes…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-6 rounded-[2rem] bg-white p-8 shadow-xl dark:bg-gray-900">
            <div className="flex items-center gap-3 rounded-3xl bg-maroon-50 p-5 dark:bg-maroon-950/30">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-maroon-100 text-maroon-700 dark:bg-maroon-900 dark:text-maroon-200">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Profile essentials</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Keep your name and phone number up to date for faster booking.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-950">
                <p className="text-sm text-gray-500 dark:text-gray-400">Email address</p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{profile.email}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-950">
                <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{profile.role}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-950">
                <p className="text-sm text-gray-500 dark:text-gray-400">Account status</p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{profile.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
              <p className="font-semibold text-gray-900 dark:text-white">Quick tips</p>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li>Use a real photo for better trust in bookings.</li>
                <li>Keep your phone number current so hosts can reach you.</li>
                <li>Sign out after using shared devices.</li>
              </ul>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-3xl border border-gray-200 bg-maroon-50 px-4 py-3 text-sm font-semibold text-maroon-700 hover:bg-maroon-100 dark:border-gray-700 dark:bg-gray-900 dark:text-maroon-200 dark:hover:bg-gray-800"
            >
              <Mail className="w-4 h-4" />
              Contact support
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
