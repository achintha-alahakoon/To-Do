# Monitoring with Prometheus & Grafana

This setup provides comprehensive monitoring for your To-Do application using Prometheus and Grafana.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed

### 1. Start the monitoring stack

```bash
docker-compose up -d
```

This will start:
- **Prometheus** on `http://localhost:9090` (port 9090)
- **Grafana** on `http://localhost:3000` (port 3000)
- **Metrics Server** on `http://localhost:9091` (port 9091)

### 2. Access Grafana Dashboard

1. Open `http://localhost:3000`
2. Login with:
   - Username: `admin`
   - Password: `admin`
3. The To-Do Dashboard is pre-configured and auto-loaded

## 📊 Metrics Available

### HTTP Metrics
- **http_requests_total** - Total HTTP requests by method, route, and status
- **http_request_duration_seconds** - Request duration histogram (p95, p99 latencies)

### Task Metrics
- **tasks_total** - Total tasks by status (todo, in_progress, done)
- **tasks_created_total** - Counter of created tasks
- **tasks_updated_total** - Counter of updated tasks
- **tasks_deleted_total** - Counter of deleted tasks

### Database Metrics
- **database_query_duration_seconds** - Database query performance by operation

### Application Health
- **supabase_connection_status** - Connection status (1 = connected, 0 = disconnected)
- **api_errors_total** - API errors by type and status code

## 🔧 Integration with Frontend

To send metrics from your React app, add this metrics service:

```typescript
// src/lib/metrics.ts
export const metricsUrl = 'http://localhost:9091';

export async function trackTaskAction(action: 'create' | 'update' | 'delete', count?: number) {
  try {
    await fetch(`${metricsUrl}/api/metrics/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, count }),
    });
  } catch (error) {
    console.error('Failed to track metric:', error);
  }
}

export async function updateTaskStats(stats: any) {
  try {
    for (const [status, count] of Object.entries(stats)) {
      await fetch(`${metricsUrl}/api/metrics/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'total', status, count }),
      });
    }
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}

export async function reportConnectionStatus(connected: boolean) {
  try {
    await fetch(`${metricsUrl}/api/metrics/connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected }),
    });
  } catch (error) {
    console.error('Failed to report connection:', error);
  }
}

export async function reportDbQueryTime(operation: string, table: string, duration: number) {
  try {
    await fetch(`${metricsUrl}/api/metrics/db-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, table, duration }),
    });
  } catch (error) {
    console.error('Failed to report query time:', error);
  }
}

export async function reportError(errorType: string, statusCode: number) {
  try {
    await fetch(`${metricsUrl}/api/metrics/error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errorType, statusCode }),
    });
  } catch (error) {
    console.error('Failed to report error:', error);
  }
}
```

Then call these functions from your components:

```typescript
// In your task operations
import { trackTaskAction, updateTaskStats } from '../lib/metrics';

const handleCreate = async (data: TaskInsert) => {
  await createTask(data);
  trackTaskAction('create');
  updateTaskStats(stats);
};
```

## 📈 Dashboard Panels

The pre-configured dashboard includes:

1. **Request Rate** - Requests per second over time
2. **Request Latency** - p95 and p99 percentiles
3. **Tasks Created** - Count of newly created tasks (last hour)
4. **Tasks Updated** - Count of updated tasks (last hour)
5. **Supabase Connection** - Connection status indicator
6. **API Errors** - Error count over time
7. **Database Performance** - Query execution times

## 🔍 Prometheus Queries

Common PromQL queries you can use:

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Task creation rate
rate(tasks_created_total[1h])

# Total tasks by status
tasks_total{status="todo"}
```

## 📁 Project Structure

```
monitoring/
├── server/
│   ├── src/
│   │   └── server.ts          # Metrics server
│   ├── package.json
│   └── tsconfig.json
├── prometheus/
│   └── prometheus.yml         # Prometheus configuration
└── grafana/
    ├── dashboards/
    │   └── todo-dashboard.json # Pre-built dashboard
    └── provisioning/
        ├── dashboards/        # Dashboard provisioning
        └── datasources/       # Data source config
```

## 🛑 Stopping the Stack

```bash
docker-compose down

# Remove volumes (optional)
docker-compose down -v
```

## 🔐 Security Notes

- Default Grafana password is `admin` - change it in production
- The metrics server exposes sensitive metrics - secure it appropriately
- Use environment variables for sensitive configuration

## 📚 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [prom-client](https://github.com/siimon/prom-client)

## Troubleshooting

### Prometheus can't reach metrics server
- Ensure metrics server is running: `npm run dev` in `monitoring/server/`
- Check that port 9091 is not blocked
- Verify prometheus.yml configuration

### Grafana dashboard not loading
- Wait 30 seconds for Grafana to initialize
- Check Prometheus is connected in Data Sources
- Verify dashboard JSON is in the correct directory

### Metrics not appearing
- Check browser console for fetch errors
- Verify metrics server is accessible from frontend
- Check CORS is not blocking requests
