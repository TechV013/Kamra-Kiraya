import { z } from "zod";

const xssPattern = /<script|javascript:|onerror\s*=|onload\s*=|onclick\s*=/i;

function xssRefine(val: string) {
  if (xssPattern.test(val)) return false;
  return true;
}

const xssMessage = "Input contains blocked patterns";

const emailField = z.string().email("Invalid email format").transform((v) => v.toLowerCase().trim());

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).refine(xssRefine, xssMessage),
  email: emailField,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  role: z.enum(["STUDENT", "OWNER", "ADMIN"]).default("STUDENT"),
  phone: z.string().optional().nullable(),
  adminSecret: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const roomSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150).refine(xssRefine, xssMessage),
  description: z.string().min(10, "Description must be at least 10 characters").refine(xssRefine, xssMessage),
  address: z.string().min(5, "Address must be at least 5 characters").refine(xssRefine, xssMessage),
  city: z.string().min(2, "City must be at least 2 characters").refine(xssRefine, xssMessage),
  state: z.string().min(2, "State must be at least 2 characters").refine(xssRefine, xssMessage),
  zipCode: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  priceDaily: z.preprocess((val) => Number(val), z.number().positive("Daily price must be positive")),
  priceMonthly: z.preprocess((val) => Number(val), z.number().positive("Monthly price must be positive")),
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY", "STUDIO", "APARTMENT"]).default("SINGLE"),
  maxOccupancy: z.preprocess((val) => Number(val), z.number().int().positive("Max occupancy must be at least 1")),
  totalRooms: z.preprocess((val) => Number(val), z.number().int().positive("Total rooms must be at least 1")),
  images: z.array(z.string().min(1, "Image URL cannot be empty")).default([]),
  amenities: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
});

export const bookingSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid check-in date format",
  }),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid check-out date format",
  }),
  bookingType: z.enum(["DAILY", "MONTHLY"]),
  specialNote: z.string().optional().nullable(),
});

export const paymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

export const paymentVerifySchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  bookingId: z.string().min(1, "Booking ID is required"),
  paymentReference: z.string().regex(/^[A-Za-z0-9\-_.]+$/, "Invalid transaction reference characters").min(8).max(35),
});

export const verificationSubmitSchema = z.object({
  aadhaarUrl: z.string().min(1, "Aadhaar document is required"),
  panUrl: z.string().min(1, "PAN document is required"),
  propertyProofUrl: z.string().min(1, "Property proof is required"),
});

export const verificationReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionNote: z.string().optional(),
});

export const roomStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "INACTIVE"]),
});

export const complaintCreateSchema = z.object({
  bookingId: z.string().optional().nullable(),
  category: z.enum(["MAINTENANCE", "PAYMENT", "REFUND", "PROPERTY_ISSUE", "HARASSMENT", "FAKE_LISTING", "OTHER"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(150).refine(xssRefine, xssMessage),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000).refine(xssRefine, xssMessage),
});

export const complaintMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000).refine(xssRefine, xssMessage),
});

export const complaintStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"]),
  note: z.string().min(10, "Please provide a note (at least 10 characters)").max(500).optional().nullable(),
});
