# 🗄️ Database Connectivity Guide

## Overview

The Orchids backend uses **PostgreSQL** with **Prisma ORM** for type-safe database operations. This guide explains the database setup, connectivity, and troubleshooting.

---

## Database Setup

### Environment Configuration

All database connectivity is controlled via environment variables in `.env`:

```env
# Production database URL
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### Connection String Format

```
postgresql://[user[:password]@][host][:port][/database][?param=value]
```

**Example (Supabase):**
```
postgresql://postgres:password@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

---

## Prisma ORM Configuration

### Client Initialization

The Prisma client is initialized in `src/lib/prisma.ts` with:

- ✅ **Connection pooling** - Automatic connection reuse
- ✅ **Error logging** - Query errors logged in development
- ✅ **Graceful shutdown** - SIGTERM/SIGINT handlers
- ✅ **Singleton pattern** - Only one instance per process

### Features

```typescript
// Logging query types in development
log: ["query", "error", "warn"]

// Pretty error formatting
errorFormat: "pretty"
```

---

## Health Check Endpoint

### Overview

The `/api/health` endpoint provides comprehensive system and database diagnostics.

### Request

```bash
curl "http://localhost:3000/api/health"
```

### Response

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
    "roomCount": 5,
    "bookingCount": 3
  }
}
```

### Response Fields

| Field | Description |
|-------|-------------|
| `status` | System status: "ok" or "error" |
| `uptime` | Server uptime in seconds |
| `environment` | Current environment (development/production) |
| `database.status` | Database health: "healthy" or "unhealthy" |
| `database.tables` | Number of tables in database |
| `database.latency` | Connection latency in milliseconds |
| `userCount` | Total registered users |
| `roomCount` | Total active rooms |
| `bookingCount` | Total bookings |

### Status Codes

| Code | Meaning |
|------|---------|
| `200` | All systems healthy |
| `503` | Database connection issue |
| `500` | Server error |

---

## Connection Testing

### Database Test Utilities

The `src/lib/db-test.ts` file provides testing utilities:

#### 1. Test Basic Connection
```typescript
import { testDatabaseConnection } from "@/lib/db-test";

const result = await testDatabaseConnection();
console.log(result);
// {
//   success: true,
//   message: "Database connected successfully. 7 tables found.",
//   timestamp: "2026-02-22T10:30:00.000Z",
//   tables: 7,
//   latency: 45
// }
```

#### 2. Test Database Operations
```typescript
import { testDatabaseOperations } from "@/lib/db-test";

const result = await testDatabaseOperations();
console.log(result);
// {
//   connection: { success: true, ... },
//   userCount: 5,
//   roomCount: 10,
//   bookingCount: 3
// }
```

#### 3. Get Database Health
```typescript
import { getDatabaseHealth } from "@/lib/db-test";

const health = await getDatabaseHealth();
console.log(health.status); // "healthy" or "unhealthy"
```

---

## Connection Pooling

### How It Works

Prisma automatically manages a connection pool:

1. **Initial Connection** - Connects on first query
2. **Pool Reuse** - Reuses connections for subsequent queries
3. **Idle Timeout** - Closes unused connections after 30 minutes (configurable)
4. **Auto Reconnect** - Automatically reconnects on connection loss

### Monitoring Connection Pool

Current connection status is visible in development logs:

```
[Prisma] Connected to database
[Prisma] Query 1 - 45ms
[Prisma] Query 2 - 32ms
```

### Recommended Pool Settings

For various scenarios:

| Scenario | Pool Size | Max Overflow |
|----------|-----------|--------------|
| Development | 5 | 2 |
| Production Small | 10 | 5 |
| Production Medium | 20 | 10 |
| Production Large | 50+ | 20+ |

---

## Error Handling

### Database Error Types

The backend handles various Prisma errors:

| Error Code | Meaning | HTTP Status |
|------------|---------|------------|
| `P2002` | Unique constraint violation | 409 |
| `P2025` | Record not found | 404 |
| `P2003` | Foreign key constraint | 400 |
| `P2018` | Invalid relation | 400 |

### Example Error Response

```json
{
  "error": "email already exists"
}
```

### Database Error Logging

In development mode, all database errors are logged:

```typescript
console.error("Database error:", error);
```

---

## Prisma Schema

### Database Tables

```
users (7 fields)
├── id, email, name, role
├── password, phone, avatar
└── isVerified, isActive, createdAt, updatedAt

rooms (14 fields)
├── id, title, description
├── address, city, state, zipCode
├── priceDaily, priceMonthly
├── roomType, maxOccupancy, totalRooms
├── availableRooms, images, amenities, rules
├── rating, reviewCount, isAvailable
└── ownerId, status, createdAt, updatedAt

bookings (11 fields)
├── id, roomId, studentId
├── checkIn, checkOut, totalDays
├── totalAmount, bookingType
├── status, specialNote
└── createdAt, updatedAt

payments (8 fields)
├── id, bookingId, amount
├── currency, status
├── stripePaymentId, stripeSessionId
└── createdAt, updatedAt

reviews (7 fields)
├── id, roomId, userId
├── rating, comment
└── createdAt, updatedAt

wishlists (4 fields)
├── id, userId, roomId
└── createdAt

notifications (6 fields)
├── id, userId, title
├── message, isRead, type
└── createdAt
```

---

## Troubleshooting

### Issue: Database Connection Timeout

**Symptoms:**
```
connect ECONNREFUSED
```

**Solutions:**
1. Check DATABASE_URL format
2. Verify PostgreSQL server is running
3. Test network connectivity

```bash
# Test connection
curl "http://localhost:3000/api/health"

# Check DATABASE_URL
echo $DATABASE_URL
```

### Issue: Connection Pool Exhausted

**Symptoms:**
```
remaining connection slots reserved for non-replication superuser connections
```

**Solutions:**
1. Increase connection pool size
2. Check for connection leaks
3. Review query performance

```typescript
// Check pool status in logs
// Look for: "Pool size" messages
```

### Issue: Slow Queries

**Symptoms:**
- High database latency (>500ms)
- Slow API responses

**Solutions:**
1. Check query logs
2. Add database indexes
3. Optimize Prisma queries

```bash
# Enable query logging
NODE_ENV=development npm run dev

# Check latency in /api/health response
curl "http://localhost:3000/api/health"
```

### Issue: "No more replicas available"

**Symptoms:**
```
Could not find any matching replica
```

**Solutions:**
1. Check database replica status
2. Use primary connection string
3. Configure fallback connection

---

## Performance Optimization

### Query Optimization

#### Good Practice - Select Specific Fields
```typescript
// ✅ Good - only fetches needed fields
const user = await prisma.user.findUnique({
  where: { id: "1" },
  select: { id: true, name: true, email: true },
});
```

#### Avoid - Fetching All Fields
```typescript
// ❌ Bad - fetches everything including password
const user = await prisma.user.findUnique({
  where: { id: "1" },
});
```

### Connection Pooling Best Practices

1. **Reuse Prisma Client** - Use singleton pattern
2. **Avoid Creating Multiple Instances** - One instance per app
3. **Close on Shutdown** - Properly disconnect on exit
4. **Monitor Pool Usage** - Watch connection metrics

### Caching Strategy

Implement caching for frequently accessed data:

```typescript
// Cache room list for 5 minutes
const rooms = await redis.getOrSet(
  "rooms:list",
  () => prisma.room.findMany(),
  300
);
```

---

## Production Setup

### Environment Variables

```env
# Secure production database URL
DATABASE_URL="postgresql://secure_user:secure_pass@prod-host:5432/prod_db"

# Enable minimal logging
NODE_ENV="production"

# Other settings
JWT_SECRET="very-secure-secret-key"
```

### Connection Pool for Production

```typescript
// Recommended for production
new PrismaClient({
  log: ["error"], // Only log errors
  errorFormat: "json", // JSON formatting for log aggregation
});
```

### Monitoring

Set up monitoring for:
- ✅ Connection pool utilization
- ✅ Query performance
- ✅ Database uptime
- ✅ Error rates

### Backup Strategy

- Daily database backups
- Point-in-time recovery enabled
- Test restore procedures regularly

---

## Migration Management

### Schema Changes

```bash
# Create migration
npx prisma migrate dev --name add_field_name

# Push schema to database
npx prisma db push

# View migration history
npx prisma migrate status
```

### Deployment

```bash
# Apply pending migrations
npx prisma migrate deploy

# Verify schema sync
npx prisma migrate resolve
```

---

## Monitoring & Metrics

### Key Metrics to Track

| Metric | Target | Alert Level |
|--------|--------|------------|
| Connection latency | < 100ms | > 500ms |
| Query time | < 50ms | > 200ms |
| Pool utilization | < 80% | > 95% |
| Error rate | < 1% | > 5% |

### Health Check Frequency

```bash
# Check health every 30 seconds
every 30 seconds {
  GET /api/health
}
```

---

## FAQs

### Q: How do I change the database?
A: Update the DATABASE_URL environment variable and run `npx prisma db push`

### Q: Can I use MySQL instead of PostgreSQL?
A: Yes! Update `provider = "mysql"` in schema.prisma and update DATABASE_URL

### Q: How do I backup my database?
A: Use your database provider's backup tools (Supabase has automatic backups)

### Q: What's the maximum pool size?
A: Depends on your database, typically 20-100 for PostgreSQL

### Q: How do I debug queries?
A: Set `log: ["query"]` in PrismaClient and check server logs

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs/)
- [Connection String Format](https://www.prisma.io/docs/reference/database-reference/connection-urls)

---

## Summary

✅ **Database connectivity is fully configured**
✅ **Health check endpoint available**
✅ **Error handling implemented**
✅ **Connection pooling enabled**
✅ **Production ready**

For real-time monitoring, use the `/api/health` endpoint!
