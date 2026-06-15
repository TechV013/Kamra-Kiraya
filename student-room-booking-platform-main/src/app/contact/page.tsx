"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ContactPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please complete all fields.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent — we will get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
      router.push("/");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_0.7fr]">
          <div className="rounded-3xl bg-white p-8 shadow-xl dark:bg-gray-900">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contact कमरा किराया</h1>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Have a question? Send us a message and our support team will help you right away.</p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={6}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-maroon-600 px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-maroon-600 via-maroon-600 to-pink-500 p-8 text-white shadow-xl">
            <div className="space-y-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4" /> कमरा किराया Support
                </span>
                <h2 className="mt-6 text-3xl font-bold">We’re here to help</h2>
                <p className="mt-4 text-gray-200/90">Whether you need help with booking, listing, or account issues, our support team is ready to assist.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Call us</p>
                    <p className="mt-1 text-sm text-white/80">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Email</p>
                    <p className="mt-1 text-sm text-white/80">support@kamarakiraya.in</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Head office</p>
                    <p className="mt-1 text-sm text-white/80">Bengaluru, Karnataka</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
