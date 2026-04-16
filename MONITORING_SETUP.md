# 📊 Prometheus & Grafana Monitoring Setup

Complete guide to set up monitoring for your To-Do application.

## 🚀 Quick Start (5 minutes)

### Step 1: Start Docker Containers

```bash
docker-compose up -d
```

This starts:
- **Prometheus** → http://localhost:9090
- **Grafana** → http://localhost:3000 (admin/admin)
- **Metrics Server** → http://localhost:9091/metrics

### Step 2: Set up Metrics Server

```bash
cd monitoring/server
npm install
npm run dev
```

The metrics server will start on port 9091 (or change with `METRICS_PORT` env var)

### Step 3: Instrument Your React App

Create `src/lib/metrics.ts` (already created with example functions) and use in your hooks:

```typescript
import { trackTaskAction, updateTaskStats } from '@/lib/metrics';

// In your useTasks hook:
const handleCreate = async (input: TaskInsert) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(input)
    .select()
    .single();

  if (!error) {
    trackTaskAction('create');  // 📊 Track metric
  }
  
  return data as Task;
};
```

### Step 4: View Dashboard

Open http://localhost:3000 in your browser

**Login:** admin / admin (change password on first login!)

## 📈 Available Metrics

### HTTP Performance
- `http_requests_total` - Total requests by method/route
- `http_request_duration_seconds` - Response time percentiles (p95, p99)

### Task Operations
- `tasks_created_total` - New tasks created
- `tasks_updated_total` - Tasks modified
- `tasks_deleted_total` - Tasks deleted
- `tasks_total` - Current task count by status

### System Health
- `supabase_connection_status` - Database connectivity (1=ok, 0=down)
- `api_errors_total` - Error count by type
- `database_query_duration_seconds` - Query performance

## 🔧 Integration Examples

### Track Task Creation
```typescript
import { trackTaskAction } from '@/lib/metrics';

const handleCreate = async (data: TaskInsert) => {
  await createTask(data);
  trackTaskAction('create');  // Send metric
};
```

### Update Task Statistics
```typescript
import { updateTaskStats } from '@/lib/metrics';

useEffect(() => {
  updateTaskStats({
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    done: tasks.filter(t => t.status === 'done').length,
  });
}, [tasks]);
```

### Report Errors
```typescript
import { reportError } from '@/lib/metrics';

const handleDelete = async (id: string) => {
  try {
    await deleteTask(id);
  } catch (error) {
    reportError('task_delete_failed', 500);
  }
};
```

### Track Query Performance
```typescript
import { reportDbQueryTime } from '@/lib/metrics';

const fetchTasks = async () => {
  const start = performance.now();
  const { data } = await supabase.from('tasks').select('*');
  const duration = (performance.now() - start) / 1000;
  reportDbQueryTime('SELECT', 'tasks', duration);
  return data;
};
```

## 📊 Pre-built Dashboard

The dashboard includes 6 panels:

1. **Request Rate** - Requests/sec over time
2. **Request Latency** - p95 & p99 percentiles
3. **Tasks Created** - Last hour count
4. **Tasks Updated** - Last hour count
5. **DB Connection** - Health indicator
6. **Database Performance** - Query times

## 🔍 Custom Queries (PromQL)

Try these queries in Prometheus (http://localhost:9090):

```promql
# Requests per second (5 min avg)
rate(http_requests_total[5m])

# Error rate percentage
(rate(http_requests_total{status_code=~"5.."}[5m]) / 
 rate(http_requests_total[5m])) * 100

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Tasks created per minute
rate(tasks_created_total[1m])

# Current task breakdown
sum by (status) (tasks_total)
```

## 🛑 Stopping Everything

```bash
# Stop containers
docker-compose down

# Remove volumes (careful - deletes data)
docker-compose down -v
```

## 📁 Directory Structure

```
project/
├── src/
│   └── lib/
│       └── metrics.ts          # Frontend metrics client
├── monitoring/
│   ├── server/
│   │   ├── src/
│   │   │   └── server.ts       # Metrics aggregator
│   │   └── package.json
│   ├── prometheus/
│   │   └── prometheus.yml      # Scrape config
│   ├── grafana/
│   │   ├── provisioning/
│   │   │   ├── datasources/    # Auto-connect Prometheus
│   │   │   └── dashboards/     # Auto-load dashboard
│   │   └── dashboards/
│   │       └── todo-dashboard.json
│   └── README.md
├── docker-compose.yml          # Prometheus + Grafana
└── MONITORING_SETUP.md         # This file
```

## 🔐 Security Notes

### Development
- Default Grafana credentials: admin / admin
- Metrics server is open on localhost:9091
- Prometheus accessible on localhost:9090

### Production
- Change Grafana admin password immediately
- Use environment variables for sensitive config
- Implement authentication for metrics server:
  ```typescript
  // In monitoring/server/src/server.ts
  app.use('/api/metrics', (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || token !== process.env.METRICS_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });
  ```
- Rate limit metrics endpoint
- Run metrics server behind reverse proxy

## 🐛 Troubleshooting

### Prometheus can't scrape metrics
```bash
# Check metrics server is running
curl http://localhost:9091/metrics

# Check prometheus logs
docker logs todo-prometheus

# Restart Prometheus
docker-compose restart prometheus
```

### Grafana not loading dashboard
```bash
# Wait 30s and refresh (provisioning takes time)
# Check Prometheus datasource connection
# Go to: Configuration → Data Sources → Prometheus

# View Grafana logs
docker logs todo-grafana
```

### Metrics aren't appearing in Grafana
1. Verify frontend is calling metrics endpoints
2. Check browser Network tab for fetch errors
3. Ensure metrics server is accessible from frontend
4. Check CORS isn't blocking requests

### Ports already in use
```bash
# Find what's using port 3000 (Grafana)
lsof -i :3000

# Use different ports in docker-compose.yml
# Or kill the process
kill -9 <PID>
```

## 📚 Learn More

- [Prometheus Documentation](https://prometheus.io/docs/prometheus/latest/getting_started/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [prom-client Library](https://github.com/siimon/prom-client)
