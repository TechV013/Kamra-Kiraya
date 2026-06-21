"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import dynamic from "next/dynamic";
import type { RoomType } from "@/types";

const RoomMapPicker = dynamic(() => import("@/components/rooms/RoomMapPicker"), { ssr: false });

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "SINGLE", label: "Single" },
  { value: "DOUBLE", label: "Double" },
  { value: "TRIPLE", label: "Triple" },
  { value: "DORMITORY", label: "Dormitory" },
  { value: "STUDIO", label: "Studio" },
  { value: "APARTMENT", label: "Apartment" },
];

export default function AddRoomPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [priceDaily, setPriceDaily] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("SINGLE");
  const [maxOccupancy, setMaxOccupancy] = useState("1");
  const [totalRooms, setTotalRooms] = useState("1");
  const [images, setImages] = useState("");
  const [amenities, setAmenities] = useState("");
  const [rules, setRules] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user?.role !== "OWNER") {
      router.push("/");
    }
  }, [token, user, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title || !description || !address || !city || !stateValue || !priceDaily || !priceMonthly) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        "/api/rooms",
        {
          title,
          description,
          address,
          city,
          state: stateValue,
          zipCode,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
          priceDaily,
          priceMonthly,
          roomType,
          maxOccupancy,
          totalRooms,
          images: images
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          amenities: amenities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          rules: rules
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Room created successfully.");
      router.push("/dashboard/owner");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Unable to create room.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Room</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Create a new listing for students to book.
            </p>
          </div>
          <Link
            href="/dashboard/owner"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Back to dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Title *</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Room title"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Description *</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the room"
                rows={5}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Address *</span>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street address"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>City *</span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>State *</span>
              <input
                value={stateValue}
                onChange={(event) => setStateValue(event.target.value)}
                placeholder="State"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Zip code</span>
              <input
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value)}
                placeholder="123456"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <div className="lg:col-span-2">
              <RoomMapPicker
                latitude={parseFloat(latitude) || 0}
                longitude={parseFloat(longitude) || 0}
                onLocationChange={(lat, lng) => {
                  setLatitude(lat.toString());
                  setLongitude(lng.toString());
                }}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Price per day *</span>
              <input
                type="number"
                value={priceDaily}
                onChange={(event) => setPriceDaily(event.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Price per month *</span>
              <input
                type="number"
                value={priceMonthly}
                onChange={(event) => setPriceMonthly(event.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Room type</span>
              <select
                value={roomType}
                onChange={(event) => setRoomType(event.target.value as RoomType)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {ROOM_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Max occupancy</span>
              <input
                type="number"
                min="1"
                value={maxOccupancy}
                onChange={(event) => setMaxOccupancy(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Total rooms</span>
              <input
                type="number"
                min="1"
                value={totalRooms}
                onChange={(event) => setTotalRooms(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Images</span>
              <input
                value={images}
                onChange={(event) => setImages(event.target.value)}
                placeholder="https://example.com/photo.jpg, https://example.com/room.png"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-gray-400">Comma-separated URLs. Supports JPG, PNG, WebP, GIF formats.</p>
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Amenities</span>
              <input
                value={amenities}
                onChange={(event) => setAmenities(event.target.value)}
                placeholder="WiFi, Parking, Meals"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Rules</span>
              <input
                value={rules}
                onChange={(event) => setRules(event.target.value)}
                placeholder="No smoking, No pets"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Required fields are marked with an asterisk.</p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-maroon-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-maroon-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
