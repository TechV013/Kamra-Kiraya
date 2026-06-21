// Shared TypeScript types for कमरा किराया

export type Role = "STUDENT" | "OWNER" | "ADMIN";
export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | "VERIFICATION_PENDING";
export type RoomType = "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY" | "STUDIO" | "APARTMENT";
export type BookingType = "DAILY" | "MONTHLY";
export type PropertyStatus = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  priceDaily: number;
  priceMonthly: number;
  roomType: RoomType;
  status: PropertyStatus;
  maxOccupancy: number;
  totalRooms: number;
  availableRooms: number;
  images: string[];
  amenities: string[];
  rules: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  ownerId: string;
  owner?: { id: string; name: string; avatar?: string | null };
  createdAt: string;
  updatedAt: string;
  distanceKm?: number;
  _count?: { reviews: number };
}

export interface Booking {
  id: string;
  roomId: string;
  studentId: string;
  bookingType: BookingType;
  checkIn: string;
  checkOut: string;
  totalDays: number;
  totalAmount: number;
  status: BookingStatus;
  specialNote?: string | null;
  createdAt: string;
  updatedAt: string;
  room?: Room;
  student?: User;
  payment?: Payment | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentId?: string | null;
  stripeSessionId?: string | null;
  refundId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  roomId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; avatar?: string | null };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  rooms?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
}
