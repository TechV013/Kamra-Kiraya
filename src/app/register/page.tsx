"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Building2, Mail, Lock, User, Phone, ArrowRight, GraduationCap, Home } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

type Role = "STUDENT" | "OWNER";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [role, setRole] = useState<Role>("STUDENT");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = (params.get("role") as Role) || "STUDENT";
    setRole(roleParam);
  }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill all required fields"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", { name, email, password, role, phone });
      login(res.data.user, res.data.token);
      toast.success(`Welcome to कमरा किराया, ${res.data.user.name}!`);
      router.push(role === "OWNER" ? "/dashboard/owner" : "/dashboard/student");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-maroon-600 via-maroon-600 to-maroon-700 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md text-center text-white"
        >
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-white/20 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Start Your Journey Today</h2>
          <p className="text-maroon-100 text-lg leading-relaxed">
            Create your free account and discover thousands of verified rooms near your college.
          </p>
        </motion.div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white dark:bg-gray-900 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-maroon-600 to-maroon-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">कK</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-maroon-600 to-maroon-600 bg-clip-text text-transparent">
              कमरा किराया
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Join thousands of students and owners</p>

          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("STUDENT")}
              className={`flex items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                role === "STUDENT"
                  ? "border-maroon-500 bg-maroon-50 dark:bg-maroon-950/40"
                  : "border-gray-200 dark:border-gray-700 hover:border-maroon-300"
              }`}
            >
              <GraduationCap className={`w-5 h-5 ${role === "STUDENT" ? "text-maroon-600" : "text-gray-400"}`} />
              <div className="text-left">
                <p className={`text-sm font-semibold ${role === "STUDENT" ? "text-maroon-700 dark:text-maroon-300" : "text-gray-700 dark:text-gray-200"}`}>Student</p>
                <p className="text-xs text-gray-400">Find rooms</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole("OWNER")}
              className={`flex items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                role === "OWNER"
                  ? "border-maroon-500 bg-maroon-50 dark:bg-maroon-950/40"
                  : "border-gray-200 dark:border-gray-700 hover:border-maroon-300"
              }`}
            >
              <Home className={`w-5 h-5 ${role === "OWNER" ? "text-maroon-600" : "text-gray-400"}`} />
              <div className="text-left">
                <p className={`text-sm font-semibold ${role === "OWNER" ? "text-maroon-700 dark:text-maroon-300" : "text-gray-700 dark:text-gray-200"}`}>Owner</p>
                <p className="text-xs text-gray-400">List property</p>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-maroon-400 focus:ring-1 focus:ring-maroon-400 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-maroon-400 focus:ring-1 focus:ring-maroon-400 transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-maroon-400 focus:ring-1 focus:ring-maroon-400 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-maroon-400 focus:ring-1 focus:ring-maroon-400 transition-all"
                />
                <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-maroon-400 focus:ring-1 focus:ring-maroon-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-maroon-600 to-maroon-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md flex items-center justify-center gap-2"
            >
              {loading ? "Creating account..." : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-maroon-600 font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
