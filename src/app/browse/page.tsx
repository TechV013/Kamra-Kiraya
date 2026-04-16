"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, SlidersHorizontal, X, Grid3X3, List, Building2 } from "lucide-react";
import axios from "axios";
import type { Room, RoomType } from "@/types";
import RoomCard from "@/components/rooms/RoomCard";
import { RoomCardSkeleton } from "@/components/shared/Skeletons";

const ROOM_TYPES: { value: RoomType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "SINGLE", label: "Single" },
  { value: "DOUBLE", label: "Double" },
  { value: "TRIPLE", label: "Triple" },
  { value: "DORMITORY", label: "Dormitory" },
  { value: "STUDIO", label: "Studio" },
  { value: "APARTMENT", label: "Apartment" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Latest" },
  { value: "price", label: "Price: Low to High" },
  { value: "rating", label: "Top Rated" },
];

export default function BrowsePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter state
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [roomType, setRoomType] = useState("");
  const [bookingType, setBookingType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  const fetchRooms = useCallback(
    async (
      pg = 1,
      filters: {
        search?: string;
        city?: string;
        roomType?: string;
        bookingType?: string;
        minPrice?: string;
        maxPrice?: string;
        sortBy?: string;
      } = {}
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const querySearch = filters.search ?? search;
        const queryCity = filters.city ?? city;
        const queryRoomType = filters.roomType ?? roomType;
        const queryBookingType = filters.bookingType ?? bookingType;
        const queryMinPrice = filters.minPrice ?? minPrice;
        const queryMaxPrice = filters.maxPrice ?? maxPrice;
        const querySortBy = filters.sortBy ?? sortBy;

        if (querySearch) params.set("search", querySearch);
        if (queryCity) params.set("city", queryCity);
        if (queryRoomType) params.set("roomType", queryRoomType);
        if (queryBookingType) params.set("bookingType", queryBookingType);
        if (queryMinPrice) params.set("minPrice", queryMinPrice);
        if (queryMaxPrice) params.set("maxPrice", queryMaxPrice);
        params.set("sortBy", querySortBy);
        params.set("page", pg.toString());
        params.set("limit", "12");

        const res = await axios.get(`/api/rooms?${params.toString()}`);
        setRooms(res.data.rooms || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setPage(pg);
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    },
    [search, city, roomType, bookingType, minPrice, maxPrice, sortBy]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("search") || "";
    const initialCity = params.get("city") || "";
    const initialRoomType = params.get("roomType") || "";
    const initialBookingType = params.get("bookingType") || "";
    const initialMinPrice = params.get("minPrice") || "";
    const initialMaxPrice = params.get("maxPrice") || "";
    const initialSortBy = params.get("sortBy") || "createdAt";

    setSearch(initialSearch);
    setCity(initialCity);
    setRoomType(initialRoomType);
    setBookingType(initialBookingType);
    setMinPrice(initialMinPrice);
    setMaxPrice(initialMaxPrice);
    setSortBy(initialSortBy);

    fetchRooms(1, {
      search: initialSearch,
      city: initialCity,
      roomType: initialRoomType,
      bookingType: initialBookingType,
      minPrice: initialMinPrice,
      maxPrice: initialMaxPrice,
      sortBy: initialSortBy,
    });
  }, [fetchRooms]);

  const handleReset = () => {
    setSearch("");
    setCity("");
    setRoomType("");
    setBookingType("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("createdAt");
  };

  const hasFilters = search || city || roomType || bookingType || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search */}
            <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search rooms, location, amenities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchRooms(1)}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
              />
            </div>

            {/* City */}
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRooms(1)}
              className="w-full md:w-36 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            />

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-200 outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setFiltersOpen((p) => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filtersOpen || hasFilters
                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasFilters && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-400"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-400"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 items-end"
            >
              {/* Room Type */}
              <div className="flex flex-wrap gap-1.5">
                {ROOM_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setRoomType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      roomType === t.value
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Booking Type */}
              <div className="flex gap-1.5">
                {[{ value: "", label: "Any" }, { value: "DAILY", label: "Daily" }, { value: "MONTHLY", label: "Monthly" }].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setBookingType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      bookingType === t.value
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Price range */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 outline-none"
                />
                <span className="text-gray-400 text-xs">—</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 outline-none"
                />
              </div>

              {hasFilters && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear all
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Searching..." : `${total.toLocaleString()} rooms found`}
          </p>
        </div>

        {loading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No rooms found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Try adjusting your search filters</p>
            <button
              onClick={handleReset}
              className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "flex flex-col gap-4"
              }
            >
              {rooms.map((room, i) => (
                <RoomCard key={room.id} room={room} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => fetchRooms(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = i + Math.max(1, page - 2);
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => fetchRooms(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => fetchRooms(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
