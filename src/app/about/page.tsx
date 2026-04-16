"use client";

import Link from "next/link";
import { Building2, Search, Heart, Star, MapPin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
              <Building2 className="w-4 h-4" /> About कमरा किराया
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Find safe student housing faster, smarter, and with confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-600 dark:text-gray-300">
              कमरा किराया connects students with verified rooms, trusted owners, and transparent pricing so every move is easier. Our platform helps you search, save, and book the right place with total peace of mind.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Search, label: "Smart search", desc: "Filter rooms by city, price, type and amenities." },
                { icon: Heart, label: "Saved favorites", desc: "Keep your top rooms in one place." },
                { icon: Star, label: "Verified listings", desc: "Only trusted spaces from reliable owners." },
                { icon: MapPin, label: "City coverage", desc: "Browse rooms across top student cities." },
              ].map((feature) => (
                <div key={feature.label} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <feature.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                  <h2 className="mt-4 text-lg font-semibold">{feature.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/browse" className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">
                Browse Rooms
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">
                Contact support
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-10 text-white shadow-2xl">
            <div className="grid gap-6">
              <div className="rounded-3xl bg-white/10 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-indigo-100/80">Our mission</p>
                <p className="mt-4 text-xl font-semibold">Helping every student find a comfortable home.</p>
              </div>
              <div className="grid gap-4 rounded-3xl bg-white/10 p-6">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5" />
                  <span className="text-sm">Fast room discovery</span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5" />
                  <span className="text-sm">Save favorites securely</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5" />
                  <span className="text-sm">Verified owner rentals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
