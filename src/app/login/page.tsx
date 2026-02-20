"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Building2, Mail, Lock, ArrowRight } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      const redirect = searchParams.get("redirect") || (
        res.data.user.role === "ADMIN" ? "/dashboard/admin" :
        res.data.user.role === "OWNER" ? "/dashboard/owner" :
        "/dashboard/student"
      );
      router.push(redirect);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              StayFinder
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md flex items-center justify-center gap-2"
            >
              {loading ? "Signing in..." : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Create one
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-indigo-600 dark:text-indigo-400">
              <p>Admin: admin@stayfinder.in / admin123</p>
              <p>Student: student@test.in / student123</p>
              <p>Owner: owner@test.in / owner123</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md text-center text-white"
        >
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-white/20 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Find Your Home Away From Home</h2>
          <p className="text-indigo-100 text-lg leading-relaxed">
            Join 50,000+ students who found their perfect room on StayFinder. Verified properties, transparent pricing.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: "10K+", label: "Rooms" },
              { value: "50K+", label: "Students" },
              { value: "200+", label: "Cities" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-indigo-200">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
