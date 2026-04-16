# Student Room Booking Platform - API Documentation

## Overview
This document outlines all API endpoints available in the Orchids platform. The API uses JWT for authentication with tokens stored in HTTP cookies.

## Authentication
- All protected endpoints require a valid JWT token
- Token is stored in an HTTP-only cookie named `token`
- Token expires after 7 days

## Base URL
```
http://localhost:3000/api
```

---

## Authentication Endpoints

### 1. Register
- **Method:** `POST`
- **URL:** `/auth/register`
- **Auth:** Not required
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "role": "STUDENT",  // or "OWNER"
    "phone": "+1234567890"  // optional
  }
  ```
- **Response:** User object + JWT token
- **Status:** 201

### 2. Login
- **Method:** `POST`
- **URL:** `/auth/login`
- **Auth:** Not required
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response:** User object + JWT token
- **Status:** 200

### 3. Get Current User
- **Method:** `GET`
- **URL:** `/auth/me`
- **Auth:** Required
- **Response:** User object
- **Status:** 200

### 4. Logout
- **Method:** `POST`
- **URL:** `/auth/logout`
- **Auth:** Required
- **Response:** `{ message: "Logged out" }`
- **Status:** 200

### 5. Forgot Password
- **Method:** `POST`
- **URL:** `/auth/forgot-password`
- **Auth:** Not required
- **Body:**
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response:** Success message (email will be sent)
- **Status:** 200

### 6. Reset Password
- **Method:** `PATCH`
- **URL:** `/auth/forgot-password`
- **Auth:** Not required
- **Body:**
  ```json
  {
    "token": "reset-token-from-email",
    "newPassword": "newPassword123"
  }
  ```
- **Response:** Success message
- **Status:** 200

---

## Room Endpoints

### 1. List Rooms (Public)
- **Method:** `GET`
- **URL:** `/rooms`
- **Auth:** Not required
- **Query Parameters:**
  - `city` - Filter by city
  - `minPrice`, `maxPrice` - Filter by price range
  - `roomType` - Filter by room type (SINGLE, DOUBLE, TRIPLE, DORMITORY, STUDIO, APARTMENT)
  - `bookingType` - DAILY or MONTHLY (default: MONTHLY)
  - `search` - Search in title, description, city, address
  - `sortBy` - createdAt, price, or rating (default: createdAt)
  - `page` - Page number (default: 1)
  - `limit` - Results per page (default: 12)
- **Response:** Array of rooms with pagination
- **Status:** 200

### 2. Get Room Details
- **Method:** `GET`
- **URL:** `/rooms/[id]`
- **Auth:** Not required
- **Response:** Room object with owner, reviews, and counts
- **Status:** 200

### 3. Create Room (Owner Only)
- **Method:** `POST`
- **URL:** `/rooms`
- **Auth:** Required (OWNER or ADMIN)
- **Body:**
  ```json
  {
    "title": "Beautiful Studio Apartment",
    "description": "Cozy studio with modern amenities",
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "priceDaily": 50,
    "priceMonthly": 1200,
    "roomType": "STUDIO",
    "maxOccupancy": 2,
    "totalRooms": 1,
    "images": ["url1", "url2"],
    "amenities": ["WiFi", "Kitchen", "Bathroom"],
    "rules": ["No smoking", "No pets"]
  }
  ```
- **Response:** Created room object
- **Status:** 201

### 4. Update Room (Owner Only)
- **Method:** `PUT`
- **URL:** `/rooms/[id]`
- **Auth:** Required (OWNER or ADMIN)
- **Body:** Same as create (partial update supported)
- **Response:** Updated room object
- **Status:** 200

### 5. Delete Room (Owner Only)
- **Method:** `DELETE`
- **URL:** `/rooms/[id]`
- **Auth:** Required (OWNER or ADMIN)
- **Response:** `{ message: "Room deleted" }`
- **Status:** 200

### 6. Get My Rooms (Owner Only)
- **Method:** `GET`
- **URL:** `/rooms/my-rooms`
- **Auth:** Required (OWNER or ADMIN)
- **Response:** Array of owner's rooms
- **Status:** 200

---

## Booking Endpoints

### 1. Get My Bookings (Student)
- **Method:** `GET`
- **URL:** `/bookings`
- **Auth:** Required
- **Response:** Array of bookings with room and payment details
- **Status:** 200

### 2. Create Booking
- **Method:** `POST`
- **URL:** `/bookings`
- **Auth:** Required
- **Body:**
  ```json
  {
    "roomId": "room-id",
    "checkIn": "2024-03-01T00:00:00Z",
    "checkOut": "2024-03-31T00:00:00Z",
    "bookingType": "MONTHLY",
    "specialNote": "Early check-in preferred"
  }
  ```
- **Response:** Created booking object
- **Status:** 201

### 3. Get Booking Details
- **Method:** `GET`
- **URL:** `/bookings/[id]`
- **Auth:** Required
- **Response:** Booking object with full details
- **Status:** 200

### 4. Update Booking Status
- **Method:** `PATCH`
- **URL:** `/bookings/[id]`
- **Auth:** Required
- **Body:**
  ```json
  {
    "status": "CANCELLED"  // or CONFIRMED, COMPLETED
  }
  ```
- **Response:** Updated booking object
- **Status:** 200

### 5. Get Owner Bookings
- **Method:** `GET`
- **URL:** `/bookings/owner`
- **Auth:** Required (OWNER or ADMIN)
- **Response:** Array of bookings for owner's rooms
- **Status:** 200

---

## Review Endpoints

### 1. Get Room Reviews
- **Method:** `GET`
- **URL:** `/reviews?roomId=[id]`
- **Auth:** Not required
- **Response:** Array of reviews for the room
- **Status:** 200

### 2. Create/Update Review
- **Method:** `POST`
- **URL:** `/reviews`
- **Auth:** Required
- **Body:**
  ```json
  {
    "roomId": "room-id",
    "rating": 4,  // 1-5
    "comment": "Great room, excellent host!"
  }
  ```
- **Response:** Created/updated review object
- **Status:** 201 or 200

---

## User Endpoints

### 1. Get User Profile
- **Method:** `GET`
- **URL:** `/users/profile`
- **Auth:** Required
- **Response:** User profile object
- **Status:** 200

### 2. Update User Profile
- **Method:** `PATCH`
- **URL:** `/users/profile`
- **Auth:** Required
- **Body:**
  ```json
  {
    "name": "John Doe Updated",
    "phone": "+1234567891",
    "avatar": "https://example.com/avatar.jpg"
  }
  ```
- **Response:** Updated user profile
- **Status:** 200

---

## Wishlist Endpoints

### 1. Get Wishlist
- **Method:** `GET`
- **URL:** `/wishlist`
- **Auth:** Required
- **Response:** Array of wishlist items with room details
- **Status:** 200

### 2. Toggle Room in Wishlist
- **Method:** `POST`
- **URL:** `/wishlist`
- **Auth:** Required
- **Body:**
  ```json
  {
    "roomId": "room-id"
  }
  ```
- **Response:** `{ message: "...", added: boolean }`
- **Status:** 200 or 201

---

## Notification Endpoints

### 1. Get Notifications
- **Method:** `GET`
- **URL:** `/notifications`
- **Auth:** Required
- **Query Parameters:**
  - `unreadOnly` - true to get only unread (optional)
- **Response:** Array of notifications + unread count
- **Status:** 200

### 2. Mark Notification as Read
- **Method:** `POST`
- **URL:** `/notifications`
- **Auth:** Required
- **Body:**
  ```json
  {
    "notificationId": "notification-id"
    // OR for marking all as read:
    "markAllAsRead": true
  }
  ```
- **Response:** Updated notification or success message
- **Status:** 200

---

## Payment Endpoints

### 1. Get My Payments
- **Method:** `GET`
- **URL:** `/payments`
- **Auth:** Required
- **Response:** Array of payment records
- **Status:** 200

### 2. Create Payment Intent
- **Method:** `POST`
- **URL:** `/payments`
- **Auth:** Required
- **Body:**
  ```json
  {
    "bookingId": "booking-id"
  }
  ```
- **Response:** Payment object with Stripe intent details
- **Status:** 201

---

## Admin Endpoints

### 1. Get All Users
- **Method:** `GET`
- **URL:** `/admin/users`
- **Auth:** Required (ADMIN only)
- **Query Parameters:**
  - `role` - Filter by role (STUDENT, OWNER)
  - `page` - Page number
  - `limit` - Results per page
- **Response:** Array of users with pagination
- **Status:** 200

### 2. Get User Details (Admin)
- **Method:** `GET`
- **URL:** `/admin/users/[id]`
- **Auth:** Required (ADMIN only)
- **Response:** User object with stats
- **Status:** 200

### 3. Update User Status (Admin)
- **Method:** `PATCH`
- **URL:** `/admin/users/[id]`
- **Auth:** Required (ADMIN only)
- **Body:**
  ```json
  {
    "isActive": true,
    "isVerified": true,
    "role": "OWNER"
  }
  ```
- **Response:** Updated user object
- **Status:** 200

### 4. Get All Rooms (Admin)
- **Method:** `GET`
- **URL:** `/admin/rooms`
- **Auth:** Required (ADMIN only)
- **Query Parameters:**
  - `status` - Filter by status (PENDING, APPROVED, REJECTED, INACTIVE)
  - `page` - Page number
  - `limit` - Results per page
- **Response:** Array of rooms with pagination
- **Status:** 200

### 5. Update Room Status (Admin)
- **Method:** `PATCH`
- **URL:** `/admin/rooms/[id]`
- **Auth:** Required (ADMIN only)
- **Body:**
  ```json
  {
    "status": "APPROVED"  // or REJECTED, INACTIVE
  }
  ```
- **Response:** Updated room object
- **Status:** 200

### 6. Get All Bookings (Admin)
- **Method:** `GET`
- **URL:** `/admin/bookings`
- **Auth:** Required (ADMIN only)
- **Query Parameters:**
  - `status` - Filter by status
  - `page` - Page number
  - `limit` - Results per page
- **Response:** Array of bookings with pagination
- **Status:** 200

### 7. Get Platform Statistics
- **Method:** `GET`
- **URL:** `/admin/stats`
- **Auth:** Required (ADMIN only)
- **Response:** Statistics object with:
  - totalUsers, totalRooms, totalBookings, totalRevenue
  - pendingRooms, activeBookings
  - recentBookings list
  - usersByRole breakdown
- **Status:** 200

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

Common HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Notes

1. **JWT Token**: Obtained from login/register endpoints, valid for 7 days
2. **Timestamps**: All dates are in ISO 8601 format
3. **Pagination**: Default limit is based on endpoint (12-20)
4. **Room Status**: PENDING → APPROVED → Available for booking
5. **Booking Status**: PENDING → CONFIRMED → COMPLETED or CANCELLED
6. **Price Calculation**: For MONTHLY bookings, price = months × priceMonthly
