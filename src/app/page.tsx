"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, MapPin, Shield, Star, Users, ChevronRight,
  Building2, Zap, Clock, CheckCircle, ArrowRight
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import type { Room } from "@/types";
import RoomCard from "@/components/rooms/RoomCard";
import { RoomCardSkeleton } from "@/components/shared/Skeletons";

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    college: "Delhi University",
    text: "Found my perfect PG room within 2 days! The verification system gave me confidence.",
    rating: 5,
    avatar: "P",
  },
  {
    name: "Rahul Kumar",
    college: "IIT Delhi",
    text: "Amazing platform! Saved so much time searching for rooms. Highly recommended.",
    rating: 5,
    avatar: "R",
  },
  {
    name: "Anjali Singh",
    college: "Amity University",
    text: "The filtering options are great. Found a budget room with all amenities I needed.",
    rating: 5,
    avatar: "A",
  },
];

const STATS = [
  { label: "Verified Rooms", value: "10,000+", icon: Building2 },
  { label: "Happy Students", value: "50,000+", icon: Users },
  { label: "Cities Covered", value: "200+", icon: MapPin },
  { label: "Average Rating", value: "4.8★", icon: Star },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Search Rooms",
    desc: "Browse thousands of verified rooms in your city with advanced filters.",
    icon: Search,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    step: "2",
    title: "Choose & Book",
    desc: "Select your preferred room, choose daily or monthly plan, and book instantly.",
    icon: CheckCircle,
    color: "from-purple-500 to-purple-600",
  },
  {
    step: "3",
    title: "Move In",
    desc: "Get confirmation and move in to your verified, comfortable room.",
    icon: Zap,
    color: "from-pink-500 to-pink-600",
  },
];

const CITIES = [
  { name: "Delhi", count: "2,400+ rooms", img: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=80" },
  { name: "Mumbai", count: "1,800+ rooms", img: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=300&q=80" },
  { name: "Bangalore", count: "2,100+ rooms", img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=80" },
  { name: "Pune", count: "900+ rooms", img: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=300&q=80" },
  { name: "Chennai", count: "750+ rooms", img: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=300&q=80" },
  { name: "Hyderabad", count: "1,100+ rooms", img: "https://images.unsplash.com/photo-1597010925555-34ddcb4b6c90?w=300&q=80" },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [featured, setFeatured] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/rooms?limit=6&sortBy=rating")
      .then((r) => setFeatured(r.data.rooms || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (city) params.set("city", city);
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center gradient-hero">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 mb-6">
                <Shield className="w-3.5 h-3.5" />
                100% Verified Rooms
              </span>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Find Your Perfect{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Student Room
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Browse thousands of verified PG, hostel, and rental rooms near your college. Book daily or monthly — your home away from home.
              </p>

              {/* Search Bar */}
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
              >
                <div className="flex-1 flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-lg border border-gray-200 dark:border-gray-600">
                  <Search className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search rooms, PG, hostel..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-lg border border-gray-200 dark:border-gray-600 sm:w-44">
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2 justify-center"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </motion.form>

              {/* Quick search tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Popular:</span>
                {["Delhi PG", "Mumbai Hostel", "Bangalore Rooms", "Pune Flats"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const parts = tag.split(" ");
                      router.push(`/browse?city=${parts[0]}&search=${parts[1] || ""}`);
                    }}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-gray-900 dark:text-white"
              >
                Featured Rooms
              </motion.h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Handpicked top-rated rooms for students</p>
            </div>
            <Link
              href="/browse"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:gap-2.5 transition-all"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((room, i) => (
                <RoomCard key={room.id} room={room} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No rooms available yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to list your property!</p>
              <Link
                href="/register?role=OWNER"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                List Your Property
              </Link>
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Browse All Rooms <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Book your perfect room in 3 simple steps. No hassle, no hidden charges.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800" />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div
                  className={`w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                >
                  <step.icon className="w-9 h-9 text-white" />
                </div>
                <div className="absolute top-0 right-[calc(50%-44px)] translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  {step.step}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by City */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Browse by City</h2>
            <p className="text-gray-500 dark:text-gray-400">Find rooms in major student cities across India</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CITIES.map((city, i) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link href={`/browse?city=${city.name}`}>
                  <div className="relative overflow-hidden rounded-2xl aspect-square group cursor-pointer">
                    <img
                      src={city.img}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="font-semibold text-sm">{city.name}</p>
                      <p className="text-xs text-gray-300">{city.count}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What Students Say</h2>
            <p className="text-gray-500 dark:text-gray-400">Trusted by thousands of students across India</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-5 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.college}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Find Your Room?
            </h2>
            <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
              Join 50,000+ students who found their perfect room on StayFinder. Start your search today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=STUDENT"
                className="px-8 py-3.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Find a Room
              </Link>
              <Link
                href="/register?role=OWNER"
                className="px-8 py-3.5 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                List Your Property
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
