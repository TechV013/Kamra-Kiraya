"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, MapPin, Shield, Star, Users, ChevronRight,
  Building2, Zap, Clock, CheckCircle, ArrowRight, Sparkles
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import type { Room } from "@/types";
import RoomCard from "@/components/rooms/RoomCard";
import { RoomCardSkeleton } from "@/components/shared/Skeletons";
import AnimatedTitle from "@/components/animations/AnimatedTitle";

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
    color: "from-maroon-500 to-maroon-600",
  },
  {
    step: "2",
    title: "Choose & Book",
    desc: "Select your preferred room, choose daily or monthly plan, and book instantly.",
    icon: CheckCircle,
    color: "from-maroon-500 to-maroon-600",
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
  { name: "Delhi", count: "2,400+ rooms", img: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=500&q=80", landmark: "🏛️ India Gate" },
  { name: "Mumbai", count: "1,800+ rooms", img: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=500&q=80", landmark: "🏖️ Gateway of India" },
  { name: "Bangalore", count: "2,100+ rooms", img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=500&q=80", landmark: "💻 Tech Hub" },
  { name: "Pune", count: "950+ rooms", img: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=500&q=80", landmark: "⛰️ Mountain Views" },
  { name: "Chennai", count: "850+ rooms", img: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=500&q=80", landmark: "🌊 Marina Beach" },
  { name: "Hyderabad", count: "1,100+ rooms", img: "https://images.unsplash.com/photo-1597010925555-34ddcb4b6c90?auto=format&fit=crop&w=500&q=80", landmark: "🕌 Charminar" },
  { name: "Kolkata", count: "680+ rooms", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80", landmark: "🌉 Howrah Bridge" },
  { name: "Jaipur", count: "520+ rooms", img: "https://images.unsplash.com/photo-1706961121783-4ae6c933983a?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amFpcHVyJTIwaGF3YSUyMG1haGFsfGVufDB8fDB8fHww", landmark: "🏰 Hawa Mahal" },
  { name: "Ahmedabad", count: "640+ rooms", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80", landmark: "🌊 Sabarmati River" },
  { name: "Chandigarh", count: "420+ rooms", img: "https://images.unsplash.com/photo-15069474127e8-a1d8ba4ea4ff?auto=format&fit=crop&w=500&q=80", landmark: "🏛️ Rock Garden" },
  { name: "Indore", count: "380+ rooms", img: "https://images.unsplash.com/photo-1512813382948-7c109f3f3ccf?auto=format&fit=crop&w=500&q=80", landmark: "🏰 Rajwada Palace" },
  { name: "Lucknow", count: "540+ rooms", img: "https://images.unsplash.com/photo-1545362100-2879326f7f00?auto=format&fit=crop&w=500&q=80", landmark: "👑 Imambara" },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [featured, setFeatured] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: "2025-06-04", to: "2025-06-07" });
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [showGuestOptions, setShowGuestOptions] = useState(false);

function AICardGrid() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/recommendations?limit=6")
      .then((r) => setRooms(r.data.rooms || []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.slice(0, 6).map((room, i) => (
        <RoomCard key={room.id} room={room} index={i} />
      ))}
    </div>
  );
}

  const formattedDate = `${new Date(dateRange.from).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(dateRange.to).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const formattedGuests = `${guests.adults + guests.children} guests, ${guests.rooms} room`;

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
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);
    params.set("guests", String(guests.adults + guests.children));
    params.set("rooms", String(guests.rooms));
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center gradient-hero">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-maroon-200/30 dark:bg-maroon-900/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-maroon-200/30 dark:bg-maroon-900/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-maroon-100 dark:bg-maroon-900/50 text-maroon-700 dark:text-maroon-300 mb-6">
                <Shield className="w-3.5 h-3.5" />
                100% Verified Rooms
              </span>

              <div className="mb-6 flex justify-center">
              <div className="max-w-4xl">
               <AnimatedTitle />
              </div>
              </div>

<motion.p
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5, duration: 0.8 }}
  className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
>
  Browse thousands of verified PG, hostel, and rental rooms near your college.
  Book daily or monthly — your home away from home.
</motion.p>

              {/* Search Bar */}
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="max-w-3xl mx-auto"
              >
                <div className="rounded-[2rem] border border-white/20 bg-white/95 dark:border-gray-800 dark:bg-slate-900/90 shadow-2xl backdrop-blur-xl p-6 sm:p-8">
                  <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
                    Enter a city, hotel, airport, address or landmark
                  </p>

                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-950">
                      <Search className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search rooms, PG, hostel..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 text-sm outline-none"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDateOptions((prev) => !prev);
                            setShowGuestOptions(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-4 text-left dark:border-gray-700 dark:bg-gray-950"
                        >
                          <Clock className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{formattedDate}</span>
                        </button>
                        {showDateOptions && (
                          <div className="absolute left-0 top-full z-10 mt-2 w-full rounded-3xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                            <label className="block text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400 mb-3">Check in / Check out</label>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                                className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              />
                              <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                                className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowGuestOptions((prev) => !prev);
                            setShowDateOptions(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-4 text-left dark:border-gray-700 dark:bg-gray-950"
                        >
                          <Users className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{formattedGuests}</span>
                        </button>
                        {showGuestOptions && (
                          <div className="absolute left-0 top-full z-10 mt-2 w-full rounded-3xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                            <div className="space-y-3">
                              {[
                                { label: "Adults", key: "adults" },
                                { label: "Children", key: "children" },
                                { label: "Rooms", key: "rooms" },
                              ].map(({ label, key }) => (
                                <div key={key} className="flex items-center justify-between gap-4">
                                  <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setGuests((prev) => ({
                                          ...prev,
                                          [key]: Math.max(0, prev[key as keyof typeof prev] - 1),
                                        }))
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-200"
                                    >
                                      -
                                    </button>
                                    <span className="w-10 text-center text-sm text-gray-900 dark:text-white">{guests[key as keyof typeof guests]}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setGuests((prev) => ({
                                          ...prev,
                                          [key]: prev[key as keyof typeof prev] + 1,
                                        }))
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{
                        scale: 1.03,
                        y: -3,
                      }}
                      whileTap={{
                        scale: 0.96,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                      className="
                        w-full
                        rounded-3xl
                        bg-gradient-to-r
                        from-maroon-600
                        via-maroon-600
                        to-pink-600
                        px-5
                        py-4
                        text-sm
                        font-semibold
                        uppercase
                        tracking-[0.04em]
                        text-white
                        shadow-xl
                        shadow-maroon-500/30
                        hover:shadow-2xl
                        hover:shadow-maroon-500/40
                        transition-all
                        duration-300
                        relative
                        overflow-hidden
                      "
                    >
  <span className="relative z-10 flex items-center justify-center gap-2">
    <Search className="w-4 h-4" />
    Search Rooms
  </span>

  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
</motion.button>
                  </div>
                </div>
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
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-maroon-400 hover:text-maroon-600 transition-colors"
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
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-maroon-100 to-maroon-100 dark:from-maroon-900/50 dark:to-maroon-900/50 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-maroon-600 dark:text-maroon-400" />
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
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-maroon-600 dark:text-maroon-400 hover:gap-2.5 transition-all"
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
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-maroon-600 text-white text-sm rounded-lg hover:bg-maroon-700 transition-colors"
              >
                List Your Property
              </Link>
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-maroon-600 to-maroon-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Browse All Rooms <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* AI Recommendations */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-coral-500" />
                <span className="text-xs font-semibold uppercase tracking-widest text-coral-500">AI Powered</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Recommended for You</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Smart suggestions based on your preferences</p>
            </div>
          </motion.div>

          <AICardGrid />
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
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-maroon-200 to-maroon-200 dark:from-maroon-800 dark:to-maroon-800" />

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
                <div className="absolute top-0 right-[calc(50%-44px)] translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-maroon-600 to-maroon-600 text-white text-xs font-bold flex items-center justify-center">
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
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Browse by City</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Find rooms in major student cities across India</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
            {CITIES.map((city, i) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/browse?city=${city.name}`}>
                  <div className="relative overflow-hidden rounded-3xl aspect-square group cursor-pointer bg-gray-200 dark:bg-gray-800 shadow-md hover:shadow-2xl transition-all duration-300">
                    {/* Image with fallback */}
                    <img
                      src={city.img}
                      alt={city.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=500&fit=crop&t=${Date.now()}`;
                      }}
                      className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                    />
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-300" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                      <h3 className="font-bold text-lg sm:text-xl leading-tight group-hover:translate-y-0.5 transition-transform duration-300">
                        {city.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-200 mt-1 group-hover:text-white transition-colors duration-300 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {city.count}
                      </p>
                      {city.landmark && (
                        <p className="text-xs text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          📍 {city.landmark}
                        </p>
                      )}
                    </div>

                    {/* Hover arrow effect */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Explore All Cities CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 rounded-3xl bg-gradient-to-br from-maroon-600 via-maroon-600 to-maroon-700 p-8 md:p-12 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left content */}
              <div className="text-white">
                <p className="text-sm font-semibold uppercase tracking-widest text-maroon-200 mb-3">Explore More</p>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Discover Rooms Across India</h3>
                <p className="text-maroon-100 text-lg mb-6 leading-relaxed">
                  Browse our complete collection of verified student rooms, PGs, and hostels in all major Indian cities. Find your perfect home away from home.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/browse"
                    className="px-6 py-3 bg-white text-maroon-600 font-semibold rounded-2xl hover:bg-maroon-50 transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Browse All Rooms
                  </Link>
                  <Link
                    href="/register?role=OWNER"
                    className="px-6 py-3 border-2 border-white/50 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    List Your Property
                  </Link>
                </div>
              </div>

              {/* Right - Quick filters */}
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
                  <p className="text-white font-semibold mb-4 text-sm">Popular in Large Cities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { city: "Delhi", icon: "🏛️" },
                      { city: "Mumbai", icon: "🏖️" },
                      { city: "Bangalore", icon: "💻" },
                      { city: "Pune", icon: "🎓" }
                    ].map((item) => (
                      <Link
                        key={item.city}
                        href={`/browse?city=${item.city}`}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl transition-all duration-300 font-medium flex items-center gap-2"
                      >
                        <span>{item.icon}</span>
                        {item.city}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-white/90">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                    <p className="text-2xl font-bold text-white">12+</p>
                    <p className="text-xs mt-1">Cities Covered</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                    <p className="text-2xl font-bold text-white">15K+</p>
                    <p className="text-xs mt-1">Verified Rooms</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maroon-500 to-maroon-500 flex items-center justify-center text-white font-bold text-sm">
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
      <section className="py-20 bg-gradient-to-br from-maroon-600 via-maroon-600 to-maroon-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Find Your Room?
            </h2>
            <p className="text-maroon-100 text-lg mb-10 max-w-2xl mx-auto">
              Join 50,000+ students who found their perfect room on कमरा किराया. Start your search today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=STUDENT"
                className="px-8 py-3.5 bg-white text-maroon-600 font-semibold rounded-xl hover:bg-maroon-50 transition-colors shadow-lg"
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
