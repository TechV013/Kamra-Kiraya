"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Mail, ArrowRight, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    // Simulate sending reset email (backend endpoint not implemented)
    await new Promise((r) => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            StayFinder
          </span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
            <Link href="/login" className="text-indigo-600 font-medium hover:underline text-sm">
              Back to Sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Forgot password?</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Enter your email and we&apos;ll send you a reset link
            </p>
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md flex items-center justify-center gap-2"
              >
                {loading ? "Sending..." : <><span>Send Reset Link</span> <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              <Link href="/login" className="text-indigo-600 hover:underline">Back to Sign in</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
