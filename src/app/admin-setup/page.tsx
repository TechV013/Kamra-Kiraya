"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AdminSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/setup").then((res) => {
      setAdminExists(res.data.adminExists);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !secretKey) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/admin/setup", { name, email, password, secretKey });
      toast.success("Admin account created! You can now login.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Checking...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-maroon-100 text-maroon-600 mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Setup</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {adminExists
              ? "Admin account already exists. Please login."
              : "Create the first admin account for your platform."}
          </p>
        </div>

        {adminExists ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              An admin account is already set up. Login with your admin credentials.
            </p>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-maroon-600 px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-500 transition"
            >
              Go to Login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-8 space-y-5 dark:border-gray-800 dark:bg-gray-900">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin Name"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kamrakiraya.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Secret Key</label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter admin secret key"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1.5 text-xs text-gray-400">Default: kamra-kiraya-admin-2024</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-maroon-600 px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-500 disabled:opacity-50 transition"
            >
              {loading ? "Creating..." : "Create Admin Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
