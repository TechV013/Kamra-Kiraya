# 📋 Database Connectivity - Quick Reference

## Health Check Command
```bash
curl http://localhost:3001/api/health | jq .
```

## Key Endpoints
```
Health Status:    GET /api/health
Database Test:    Included in health check
Status Response:  HTTP 200 (healthy) or 503 (unhealthy)
```

## Environment Setup
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

## Prisma Commands
```bash
Generate client:        npx prisma generate
Sync schema:           npx prisma db push
Create migration:      npx prisma migrate dev --name migration_name
View schema:           npx prisma studio
```

## Testing Connectivity

### JavaScript
```javascript
import { testDatabaseConnection } from "@/lib/db-test";

const result = await testDatabaseConnection();
if (result.success) {
  console.log(`✓ Connected (${result.tables} tables, ${result.latency}ms latency)`);
}
```

### API Response Example
```json
{
  "status": "ok",
  "database": {
    "status": "healthy",
    "connection": {
      "success": true,
      "latency": 48,
      "tables": 7
    },
    "userCount": 2,
    "roomCount": 5
  }
}
```

## Troubleshooting Reference

| Issue | Command | Fix |
|-------|---------|-----|
| Connection failed | `curl http://localhost:3001/api/health` | Check DATABASE_URL |
| High latency | `curl http://localhost:3001/api/health` | Check DB server load |
| Tables not found | `npx prisma db push` | Sync schema |
| Type errors | `npx prisma generate` | Regenerate client |

## Performance Targets

| Metric | Target | Warning |
|--------|--------|---------|
| Connection latency | < 100ms | > 500ms |
| Health check response | < 2s | > 5s |
| Table count | 7 | < 7 |

## Connection Pooling Status

Current implementation:
- ✅ Singleton pattern (one instance per process)
- ✅ Automatic connection reuse
- ✅ Graceful shutdown (SIGTERM/SIGINT)
- ✅ Auto-reconnection on failure

## Error Codes Reference

| Prisma Code | HTTP Status | Meaning |
|-------------|------------|---------|
| P2002 | 409 | Unique constraint violation |
| P2025 | 404 | Record not found |
| P2003 | 400 | Foreign key constraint |
| P2018 | 400 | Invalid relation |

## Files Modified

```
NEW FILES:
- src/lib/db-test.ts
- src/app/api/health/route.ts
- DATABASE_CONNECTIVITY.md
- MONITORING_ENDPOINTS.md

UPDATED FILES:
- src/lib/prisma.ts
- src/lib/api-helpers.ts
- QUICKSTART.md
```

## Monitoring Setup

### Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s \
  CMD curl -f http://localhost:3001/api/health || exit 1
```

### Kubernetes Liveness
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  periodSeconds: 30
  failureThreshold: 3
```

## Production Checklist

- [x] Connection pooling enabled
- [x] Graceful shutdown handlers
- [x] Error mapping complete
- [x] Health endpoint available
- [x] Logging configured
- [x] Documentation provided
- [x] Tested and working

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Test health endpoint**
   ```bash
   curl http://localhost:3001/api/health
   ```

## Documentation Index

| Document | Purpose |
|----------|---------|
| DATABASE_CONNECTIVITY.md | Complete guide (20KB) |
| MONITORING_ENDPOINTS.md | Endpoint reference |
| QUICKSTART.md | 60-second setup |
| API_DOCUMENTATION.md | All 40+ endpoints |

## Common Tasks

### Check if Database is Connected
```bash
curl -s http://localhost:3001/api/health | jq '.database.status'
```

### Get Connection Latency
```bash
curl -s http://localhost:3001/api/health | jq '.database.connection.latency'
```

### View Database Metrics
```bash
curl -s http://localhost:3001/api/health | jq '.database | {status, userCount, roomCount, bookingCount}'
```

### Monitor Continuously
```bash
watch -n 5 'curl -s http://localhost:3001/api/health | jq ".database"'
```

## Import Cheat Sheet

```typescript
// Database client
import { prisma } from "@/lib/prisma";

// Testing utilities
import { testDatabaseConnection, getDatabaseHealth } from "@/lib/db-test";

// API helpers
import { apiResponse, apiError, handleDatabaseError } from "@/lib/api-helpers";

// Usage
const health = await getDatabaseHealth();
const response = apiResponse(data, 200);
```

## Connection String Formats

### PostgreSQL (Supabase)
```
postgresql://user:password@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

### Local PostgreSQL
```
postgresql://postgres:password@localhost:5432/orchids_db
```

### Environment Variable
```bash
DATABASE_URL="postgresql://..."
```

## Status Codes

| Code | Meaning | Cause |
|------|---------|-------|
| 200 | OK | Healthy system |
| 503 | Service Unavailable | Database down |
| 500 | Server Error | Internal error |

## Need Help?

1. **Check health**: `curl http://localhost:3001/api/health`
2. **Read guide**: Open `DATABASE_CONNECTIVITY.md`
3. **Check logs**: Look for Prisma query logs
4. **Verify env**: Check `DATABASE_URL` format
5. **Test connection**: Use testing utilities

## Key Metrics to Monitor

```
✓ Connection latency (target: < 100ms)
✓ Health check status (target: 200)
✓ Table count (target: 7)
✓ Data counts (users, rooms, bookings)
✓ Response time (target: < 2 seconds)
```

---

**Keep this reference handy for quick lookups!**

For detailed information, see the comprehensive guides in the documentation folder.
