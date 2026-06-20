"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin, Star, Users, Wifi, Car, Coffee, Tv, Dumbbell,
  Phone, Mail, Heart, Share2,
  CheckCircle, Calendar, Bed, Shield, Clock, Sparkles
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import ImageGallery from "@/components/rooms/ImageGallery";
import Link from "next/link";
import type { Room, Review } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/uiStore";
import RoomCard from "@/components/rooms/RoomCard";
import { RoomCardSkeleton } from "@/components/shared/Skeletons";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-4 h-4" />,
  Parking: <Car className="w-4 h-4" />,
  Meals: <Coffee className="w-4 h-4" />,
  TV: <Tv className="w-4 h-4" />,
  Gym: <Dumbbell className="w-4 h-4" />,
};

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlistStore();

  const [room, setRoom] = useState<Room & { reviews?: Review[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState<"DAILY" | "MONTHLY">("MONTHLY");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [booking, setBooking] = useState(false);
  const [paymentSession, setPaymentSession] = useState<{
    paymentId: string;
    bookingId: string;
    qrPayload: string;
    amount: number;
    currency: string;
    upiId: string;
    payeeName: string;
    note: string;
    status: string;
  } | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [txRef, setTxRef] = useState("");
  const [showTxDialog, setShowTxDialog] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [similarRooms, setSimilarRooms] = useState<Room[]>([]);

  const wishlisted = isWishlisted(id);

  useEffect(() => {
    axios
      .get(`/api/rooms/${id}`)
      .then((r) => setRoom(r.data))
      .catch(() => toast.error("Room not found"))
      .finally(() => setLoading(false));

    axios
      .get(`/api/recommendations?roomId=${id}&limit=4`)
      .then((r) => setSimilarRooms(r.data.rooms || []))
      .catch(() => {});
  }, [id]);

  const handleBook = async () => {
    if (!user || !token) {
      toast.error("Please sign in to book");
      router.push("/login");
      return;
    }
    if (user.role !== "STUDENT") {
      toast.error("Only students can book rooms");
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      toast.error("Please enter valid check-in and check-out dates");
      return;
    }
    if (checkInDate >= checkOutDate) {
      toast.error("Check-out must be after check-in");
      return;
    }

    setBooking(true);
    try {
      await axios.post(
        "/api/bookings",
        { roomId: id, checkIn, checkOut, bookingType, specialNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Booking request sent to the owner. They will approve or reject it soon.");
      router.push("/dashboard/student");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Booking request failed");
    } finally {
      setBooking(false);
    }
  };

  const verifyPayment = async () => {
    if (!paymentSession || !token) {
      toast.error("Unable to verify payment");
      return;
    }
    if (!txRef || txRef.length < 8) {
      toast.error("Please enter a valid transaction ID (at least 8 characters)");
      return;
    }

    setVerifyingPayment(true);
    try {
      const res = await axios.post(
        "/api/payments/verify",
        {
          paymentId: paymentSession.paymentId,
          bookingId: paymentSession.bookingId,
          paymentReference: txRef,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "VERIFICATION_PENDING") {
        toast.success("Payment submitted! Waiting for owner verification.");
      } else {
        toast.success("Payment confirmed and booking completed.");
      }
      setShowTxDialog(false);
      setTxRef("");
      router.push("/dashboard/student");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Payment confirmation failed");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleWishlist = async () => {
    if (!token) {
      toast.error("Please sign in");
      return;
    }
    try {
      if (wishlisted) {
        await axios.delete("/api/wishlist", { data: { roomId: id }, headers: { Authorization: `Bearer ${token}` } });
        removeFromWishlist(id);
        toast.success("Removed from wishlist");
      } else {
        await axios.post("/api/wishlist", { roomId: id }, { headers: { Authorization: `Bearer ${token}` } });
        addToWishlist(id);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Failed");
    }
  };

  const handleReview = async () => {
    if (!token) { toast.error("Please sign in"); return; }
    if (!reviewText.trim()) { toast.error("Please write a review"); return; }
    setSubmittingReview(true);
    try {
      const res = await axios.post(
        "/api/reviews",
        { roomId: id, rating: reviewRating, comment: reviewText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Review submitted!");
      setReviewText("");
      setReviewRating(5);
      // Refresh
      const r = await axios.get(`/api/rooms/${id}`);
      setRoom(r.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const totalAmount = () => {
    if (!room || !checkIn || !checkOut) return 0;
    const days = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    if (bookingType === "MONTHLY") return Math.ceil(days / 30) * room.priceMonthly;
    return days * room.priceDaily;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Room not found</h2>
          <Link href="/browse" className="mt-3 inline-block text-maroon-600">Browse Rooms</Link>
        </div>
      </div>
    );
  }

  const images = room.images?.length > 0
    ? room.images
    : ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link href="/browse" className="hover:text-maroon-600 transition-colors">Browse</Link>
          <span>/</span>
          <Link href={`/browse?city=${room.city}`} className="hover:text-maroon-600 transition-colors">{room.city}</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white line-clamp-1">{room.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={images} className="h-[420px]" />

            {/* Title + actions */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-maroon-100 dark:bg-maroon-900/50 text-maroon-700 dark:text-maroon-300">
                      {room.roomType}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        room.isAvailable
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {room.isAvailable ? "Available" : "Not Available"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{room.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{room.address}, {room.city}, {room.state}</span>
                  </div>
                  {room.rating > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(room.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-600"}`} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{room.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">({room.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleWishlist}
                    className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-rose-400 transition-colors"
                  >
                    <Heart className={`w-5 h-5 ${wishlisted ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                    className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-maroon-400 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Room Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Bed, label: "Room Type", value: room.roomType },
                { icon: Users, label: "Max Occupancy", value: `${room.maxOccupancy} people` },
                { icon: CheckCircle, label: "Available", value: `${room.availableRooms} of ${room.totalRooms}` },
                { icon: Shield, label: "Verified", value: room.status === "APPROVED" ? "Yes" : "Pending" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                  <stat.icon className="w-5 h-5 text-maroon-500 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-3">About this room</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{room.description}</p>
            </div>

            {/* Amenities */}
            {room.amenities?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {room.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-maroon-100 dark:bg-maroon-900/50 flex items-center justify-center text-maroon-600 dark:text-maroon-400">
                        {AMENITY_ICONS[a] || <CheckCircle className="w-4 h-4" />}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {room.rules?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">House Rules</h2>
                <ul className="space-y-2">
                  {room.rules.map((rule) => (
                    <li key={rule} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-maroon-500 shrink-0" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Owner Info */}
            {room.owner && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">About the Owner</h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-maroon-500 to-maroon-500 flex items-center justify-center text-white font-bold text-xl">
                    {room.owner.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{room.owner.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Property Owner</p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    {(room.owner as any).phone && (
                      <a
                        href={`tel:${(room.owner as any).phone}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:border-maroon-400 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    )}
                    {(room.owner as any).email && (
                      <a
                        href={`mailto:${(room.owner as any).email}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:border-maroon-400 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-5">
                Reviews {room.reviewCount > 0 && <span className="text-gray-400 font-normal text-sm">({room.reviewCount})</span>}
              </h2>

              {/* Submit Review */}
              {user?.role === "STUDENT" && (
                <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Leave a review</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button key={r} onClick={() => setReviewRating(r)}>
                        <Star className={`w-6 h-6 transition-colors ${r <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-600"}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none border border-gray-200 dark:border-gray-600 focus:border-maroon-400 transition-colors resize-none"
                  />
                  <button
                    onClick={handleReview}
                    disabled={submittingReview}
                    className="mt-2 px-5 py-2 bg-maroon-600 text-white text-sm rounded-xl font-medium hover:bg-maroon-700 disabled:opacity-50 transition-colors"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              )}

              {/* Review list */}
              {(room as any).reviews?.length > 0 ? (
                <div className="space-y-4">
                  {(room as any).reviews.map((review: Review & { user: { name: string; avatar?: string } }) => (
                    <div key={review.id} className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maroon-400 to-maroon-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {review.user?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{review.user?.name}</p>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden">
                {/* Price Header */}
                <div className="bg-gradient-to-r from-maroon-600 to-maroon-600 p-5 text-white">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">₹{room.priceMonthly.toLocaleString()}</span>
                    <span className="text-maroon-100 mb-1">/month</span>
                  </div>
                  <p className="text-maroon-100 text-sm mt-1">
                    or ₹{room.priceDaily.toLocaleString()}/day
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Booking Type */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                      Booking Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["DAILY", "MONTHLY"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setBookingType(t)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            bookingType === t
                              ? "bg-maroon-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {t === "DAILY" ? "Daily" : "Monthly"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                        Check-in
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 outline-none focus:border-maroon-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                        Check-out
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn || new Date().toISOString().split("T")[0]}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 outline-none focus:border-maroon-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Special note */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                      Special Note (optional)
                    </label>
                    <textarea
                      value={specialNote}
                      onChange={(e) => setSpecialNote(e.target.value)}
                      placeholder="Any special requirements..."
                      rows={2}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 outline-none focus:border-maroon-400 transition-colors resize-none placeholder-gray-400"
                    />
                  </div>

                  {/* Price breakdown */}
                  {checkIn && checkOut && (
                    <div className="bg-maroon-50 dark:bg-maroon-950/30 rounded-xl p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Total estimate</span>
                        <span className="font-bold text-maroon-600 dark:text-maroon-400">₹{totalAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={booking || !room.isAvailable || !!paymentSession}
                    className="w-full py-3 bg-gradient-to-r from-maroon-600 to-maroon-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
                  >
                    {booking ? "Booking..." : paymentSession ? "Payment pending" : !room.isAvailable ? "Not Available" : "Book Now"}
                  </button>

                  {paymentSession && (
                    <div className="rounded-3xl border border-maroon-100 dark:border-maroon-900 bg-white dark:bg-gray-900 p-5 mt-4 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pay with QR code</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Scan with any UPI app or payment app and pay the exact amount.</p>
                      <div className="grid place-items-center">
                        <img
                          src={`/api/qr?paymentId=${paymentSession.paymentId}&amount=${paymentSession.amount}`}
                          alt="UPI QR code"
                          className="w-64 h-64 rounded-2xl border border-gray-200 dark:border-gray-700"
                        />
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                        <p><strong>Amount:</strong> ₹{paymentSession.amount.toLocaleString()}</p>
                        <p><strong>UPI ID:</strong> {paymentSession.upiId}</p>
                        <p><strong>Payee:</strong> {paymentSession.payeeName}</p>
                      </div>
                      <button
                        onClick={() => setShowTxDialog(true)}
                        disabled={verifyingPayment}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                      >
                        I have paid
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tap confirm only after completing the payment in your app.</p>
                    </div>
                  )}

                  {!user && (
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                      <Link href="/login" className="text-maroon-600 hover:underline">Sign in</Link> to book this room
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 justify-center">
                    <Shield className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Safe & verified property</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {similarRooms.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="w-5 h-5 text-coral-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Similar Rooms</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarRooms.map((room, i) => (
                <RoomCard key={room.id} room={room} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Transaction ID Dialog */}
      {showTxDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Enter Transaction ID</h3>
              <button onClick={() => setShowTxDialog(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              After completing the UPI payment, enter the transaction ID from your payment app.
            </p>
            <input
              type="text"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder="e.g. 412345678901"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:border-maroon-400 focus:ring-1 focus:ring-maroon-400"
            />
            <p className="text-xs text-gray-400">8-35 characters. Found in your UPI app under transaction details.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTxDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={verifyPayment}
                disabled={verifyingPayment || txRef.length < 8}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {verifyingPayment ? "Verifying..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
