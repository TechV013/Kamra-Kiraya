# 🚀 Quick Start Guide - Orchids Backend

## ⚡ 60-Second Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Start Dev Server
```bash
npm run dev
```

### 4. Test Database Connection
```bash
curl "http://localhost:3000/api/health"
```

### 5. Done! 🎉
Open: **http://localhost:3000**

---

## 🧪 Test the API

### Check Database Health (NEW!)
```bash
# Full health check including database connectivity
curl "http://localhost:3000/api/health"
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-22T10:30:00.000Z",
  "uptime": 45.3,
  "environment": "development",
  "database": {
    "status": "healthy",
    "connection": {
      "success": true,
      "message": "Database connected successfully. 7 tables found.",
      "timestamp": "2026-02-22T10:30:00.000Z",
      "tables": 7,
      "latency": 45
    },
    "userCount": 2,
    "roomCount": 0,
    "bookingCount": 0
  }
}
```

### Get All Rooms (Public)
```bash
curl "http://localhost:3000/api/rooms"
```

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "role": "STUDENT"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

---

## 🗄️ Database Connectivity

### Environment Variables Required
```env
# database configuration
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT configuration
JWT_SECRET="your-secret-key"

# App configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Verify Database Connection

The health check endpoint provides:
- ✅ Database connectivity status
- ✅ Number of tables
- ✅ Connection latency
- ✅ Data summary (users, rooms, bookings)
- ✅ System uptime

```bash
# Check database status
curl "http://localhost:3000/api/health"

# Expected latency: < 100ms
# If latency is high, check:
# - DATABASE_URL connection string
# - Network connectivity
# - PostgreSQL server status
```

### Database Connection Pooling

The backend automatically handles:
- ✅ Connection pooling via Prisma
- ✅ Graceful shutdown on SIGTERM/SIGINT
- ✅ Automatic reconnection on failure
- ✅ Query logging in development mode

---

## 📚 Documentation

- **Full API Reference**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Setup Guide**: See [BACKEND_GUIDE.md](./BACKEND_GUIDE.md) (if available)
- **Implementation Summary**: See [BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md) (if available)

---

## 🔌 API Endpoints at a Glance

| Feature | Endpoints |
|---------|-----------|
| 🔐 Auth | Register, Login, Logout, Get Profile |
| 🏠 Rooms | List, Create, Update, Delete, Search |
| 📅 Bookings | Create, View, Update Status |
| ⭐ Reviews | Create, View |
| 💝 Wishlist | Add, Remove, View |
| 🔔 Notifications | Get, Mark as Read |
| 💳 Payments | Create Intent, View History |
| 👤 Users | Profile Management |
| 🛠️ Admin | User/Room/Booking Management, Stats |
| 💚 Health | Check system and database health |

---

## ⚙️ Environment Setup

Required `.env` variables:
```env
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 🎯 Common Tasks

### Create a Room
1. Login as OWNER
2. POST to `/api/rooms` with room details
3. Room enters PENDING status
4. Admin approves in dashboard
5. Room becomes available for booking

### Make a Booking
1. Login as STUDENT
2. Browse rooms via GET `/api/rooms`
3. POST to `/api/bookings` with dates
4. Owner receives booking
5. Owner updates status to CONFIRMED
6. Booking active

### Leave a Review
1. Booking must be CONFIRMED or COMPLETED
2. POST to `/api/reviews` with rating (1-5) and comment
3. Room rating auto-updated
4. Review visible on room page

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change port: `npm run dev -- -p 3001` |
| Prisma errors | Run: `npx prisma generate` |
| DB connection fails | Run: `curl http://localhost:3000/api/health` to check status |
| JWT errors | Verify `JWT_SECRET` is set |
| Connection timeout | Check DATABASE_URL format and network connectivity |
| Database permissions | Ensure user has CREATE, INSERT, UPDATE, DELETE permissions |

---

## 📊 Tech Stack

- Next.js 15
- TypeScript
- PostgreSQL
- Prisma v6
- JWT Auth

---

## 🎓 Learn More

- [Full Backend Guide](./BACKEND_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Implementation Summary](./BACKEND_COMPLETE.md)

---

**Everything is set up and ready to go! Start building! 🚀**
