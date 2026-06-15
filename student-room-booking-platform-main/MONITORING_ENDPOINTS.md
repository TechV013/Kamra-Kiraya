# 🏥 System & Database Monitoring Endpoints

## Overview

New monitoring endpoints have been added to the backend for real-time system and database health checks.

---

## Health Check Endpoint

### **GET /api/health**

Real-time system and database health status.

#### Request
```bash
curl "http://localhost:3001/api/health"
```

#### Response (200 - Healthy)
```json
{
  "status": "ok",
  "timestamp": "2026-02-22T14:30:00Z",
  "uptime": 120.55,
  "environment": "development",
  "database": {
    "status": "healthy",
    "connection": {
      "success": true,
      "message": "Database connected successfully. 7 tables found.",
      "timestamp": "2026-02-22T14:30:00Z",
      "tables": 7,
      "latency": 48
    },
    "userCount": 2,
    "roomCount": 5,
    "bookingCount": 3
  }
}
```

#### Response (503 - Unhealthy)
```json
{
  "status": "error",
  "timestamp": "2026-02-22T14:30:00Z",
  "database": {
    "status": "unhealthy",
    "error": "connect ECONNREFUSED 127.0.0.1:5432"
  }
}
```

#### Status Codes
| Code | Meaning | Cause |
|------|---------|-------|
| 200 | Healthy | Database connected, all systems OK |
| 503 | Unavailable | Database connection failed |
| 500 | Error | Server error during check |

---

## Response Fields

### Root Level
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | "ok" or "error" |
| `timestamp` | string | ISO 8601 timestamp |
| `uptime` | number | Server uptime in seconds |
| `environment` | string | "development" or "production" |
| `database` | object | Database health info |

### Database Object
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | "healthy" or "unhealthy" |
| `connection` | object | Connection details |
| `userCount` | number | Total registered users |
| `roomCount` | number | Total active rooms |
| `bookingCount` | number | Total bookings |
| `error` | string | Error message if unhealthy |

### Connection Object
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Connection successful |
| `message` | string | Status message |
| `timestamp` | string | Check timestamp |
| `tables` | number | Database table count |
| `latency` | number | Response time in milliseconds |

---

## Usage Examples

### JavaScript/Node.js
```javascript
// Check database health
async function checkHealth() {
  const response = await fetch("http://localhost:3001/api/health");
  const health = await response.json();
  
  if (health.database.status === "healthy") {
    console.log(`✓ Database OK (latency: ${health.database.connection.latency}ms)`);
  } else {
    console.error("✗ Database NOT connected");
  }
}

checkHealth();
```

### Python
```python
import requests

response = requests.get("http://localhost:3001/api/health")
health = response.json()

if health["database"]["status"] == "healthy":
    print(f"✓ Database OK ({health['database']['connection']['latency']}ms latency)")
else:
    print(f"✗ Database error: {health['database']['error']}")
```

### Shell Script
```bash
#!/bin/bash

response=$(curl -s "http://localhost:3001/api/health")
status=$(echo $response | jq -r '.database.status')

if [ "$status" == "healthy" ]; then
    echo "✓ Database is healthy"
    echo "Latency: $(echo $response | jq '.database.connection.latency')ms"
    echo "Tables: $(echo $response | jq '.database.connection.tables')"
else
    echo "✗ Database is unhealthy"
    echo "Error: $(echo $response | jq -r '.database.error')"
fi
```

### Docker Health Check
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["npm", "run", "dev"]
```

---

## Monitoring Usage

### Kubernetes Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Load Balancer Health Check
```
Protocol: HTTP
Path: /api/health
Check Interval: 30 seconds
Healthy When: Status 200
Unhealthy When: Status >= 400
```

### Datadog Monitoring
```python
from datadog import api

api.Monitor.create(
    type="http",
    query='http_check.http_status{"url":"http://localhost:3001/api/health"} by {url}',
    name="Orchids API Health Check",
    message="Alert if API is down"
)
```

### Prometheus Exporter (Future)
```
# TYPE api_health_database_status gauge
api_health_database_status{environment="production"} 1

# TYPE api_health_connection_latency_milliseconds gauge
api_health_connection_latency_milliseconds 45

# TYPE api_health_user_count gauge
api_health_user_count 2
```

---

## Health Check Metrics

### Key Indicators
| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Connection Latency | < 100ms | 100-500ms | > 500ms |
| HTTP Status | 200 | N/A | 503/500 |
| Response Time | < 1s | 1-5s | > 5s |
| Table Count | = 7 | - | < 7 |

### Database Metrics
```json
{
  "userCount": 2,        // Total users registered
  "roomCount": 5,        // Active room listings
  "bookingCount": 3      // Total bookings made
}
```

---

## Troubleshooting

### Issue: Health Check Returns 503

**Symptoms:**
```json
{
  "status": "error",
  "database": {
    "status": "unhealthy",
    "error": "connect ECONNREFUSED"
  }
}
```

**Solutions:**
1. Check DATABASE_URL format
2. Verify PostgreSQL server is running
3. Test network connectivity

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check server status
curl -v http://localhost:3001/api/health
```

### Issue: High Latency (> 500ms)

**Symptoms:**
```json
{
  "database": {
    "connection": {
      "latency": 1234  // Too high!
    }
  }
}
```

**Solutions:**
1. Check database server load
2. Review network latency
3. Check query logs

---

## Integration Guide

### Set Up Monitoring

1. **Enable Health Checks**
   ```bash
   # Add to docker-compose.yml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

2. **Configure Load Balancer**
   - Set health check path: `/api/health`
   - Set check interval: 30 seconds
   - Success threshold: 2 checks
   - Failure threshold: 3 checks

3. **Set Up Monitoring Dashboard**
   - Plot latency over time
   - Track table counts
   - Monitor status codes
   - Alert on failures

4. **Configure Alerting**
   ```
   Alert when:
   - status != "ok" for > 2 minutes
   - latency > 500ms
   - Tables < 7
   ```

---

## API Health Schema

### TypeScript Types
```typescript
interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  environment: "development" | "production";
  database: DatabaseHealth;
}

interface DatabaseHealth {
  status: "healthy" | "unhealthy";
  connection?: ConnectionDetails;
  error?: string;
  userCount?: number;
  roomCount?: number;
  bookingCount?: number;
}

interface ConnectionDetails {
  success: boolean;
  message: string;
  timestamp: string;
  tables: number;
  latency: number;
}
```

---

## Performance Considerations

### Response Time
- **First request:** 4-5 seconds (includes compilation)
- **Subsequent:** 500-1000ms (from cache if available)
- **Database queries only:** 50-100ms

### Database Load
The health check performs:
- 1 SELECT 1 query (connection test)
- 1 information_schema query (table count)
- 3 COUNT queries (users, rooms, bookings)
- **Total:** ~50ms database time

### Recommended Check Frequency
- **Development:** Every 30 seconds
- **Production:** Every 60 seconds
- **Critical:** Every 10 seconds

---

## Best Practices

### Do's ✅
- ✅ Check health before deploying
- ✅ Monitor latency trends
- ✅ Alert on status changes
- ✅ Use for auto-recovery
- ✅ Include in dashboards

### Don'ts ❌
- ❌ Don't check too frequently (waste resources)
- ❌ Don't ignore latency warnings
- ❌ Don't expose health details in production logs
- ❌ Don't require authentication for health checks
- ❌ Don't crash on health check timeout

---

## Example Monitoring Setup

### Simple Shell Script
```bash
#!/bin/bash

CHECK_INTERVAL=30
ALERT_EMAIL="alerts@example.com"

while true; do
  response=$(curl -s "http://localhost:3001/api/health")
  status=$(echo $response | jq -r '.database.status')
  latency=$(echo $response | jq '.database.connection.latency')

  if [ "$status" != "healthy" ]; then
    echo "ALERT: Database unhealthy!" | mail -s "API Alert" $ALERT_EMAIL
  fi

  if [ "$latency" -gt 500 ]; then
    echo "WARNING: High latency: ${latency}ms" | mail -s "Performance Alert" $ALERT_EMAIL
  fi

  sleep $CHECK_INTERVAL
done
```

---

## Summary

✅ **Real-time health monitoring available**
✅ **Database connectivity tracked**
✅ **Performance metrics included**
✅ **Supports auto-recovery systems**
✅ **Production ready**

**Test the endpoint:**
```bash
curl http://localhost:3001/api/health
```

Health checks are essential for production reliability!
