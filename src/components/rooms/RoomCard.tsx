"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, MapPin, Star, Users, Wifi, Car, Coffee } from "lucide-react";
import type { Room } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/uiStore";
import axios from "axios";
import toast from "react-hot-toast";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-3 h-3" />,
  Parking: <Car className="w-3 h-3" />,
  Meals: <Coffee className="w-3 h-3" />,
};

interface RoomCardProps {
  room: Room;
  index?: number;
}

export default function RoomCard({ room, index = 0 }: RoomCardProps) {
  const { token } = useAuthStore();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlistStore();
  const wishlisted = isWishlisted(room.id);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      toast.error("Please sign in to save rooms");
      return;
    }
    try {
      if (wishlisted) {
        await axios.delete("/api/wishlist", {
          data: { roomId: room.id },
          headers: { Authorization: `Bearer ${token}` },
        });
        removeFromWishlist(room.id);
        toast.success("Removed from wishlist");
      } else {
        await axios.post(
          "/api/wishlist",
          { roomId: room.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        addToWishlist(room.id);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const imageUrl = room.images?.[0] || `https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link href={`/rooms/${room.id}`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          {/* Image */}
          <div className="relative overflow-hidden h-52">
            <img
              src={imageUrl}
              alt={room.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Badge */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow">
                {room.roomType}
              </span>
            </div>
            {/* Wishlist */}
            <button
              onClick={handleWishlist}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow hover:scale-110 transition-transform"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  wishlisted ? "fill-rose-500 text-rose-500" : "text-gray-400"
                }`}
              />
            </button>
            {/* Available indicator */}
            <div className="absolute bottom-3 right-3">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  room.isAvailable && room.availableRooms > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {room.isAvailable && room.availableRooms > 0 ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {room.title}
              </h3>
              {room.rating > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {room.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 mb-3">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                {room.address}, {room.city}
              </span>
            </div>

            {/* Amenities */}
            {room.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {room.amenities.slice(0, 3).map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    {AMENITY_ICONS[a] || null}
                    {a}
                  </span>
                ))}
                {room.amenities.length > 3 && (
                  <span className="px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-500">
                    +{room.amenities.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  ₹{room.priceMonthly.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span>{room.availableRooms} left</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
