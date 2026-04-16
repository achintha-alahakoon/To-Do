import express from 'express';
import { register, Counter, Gauge, Histogram } from 'prom-client';

const app = express();
const port = process.env.METRICS_PORT || 5000;

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const taskTotal = new Gauge({
  name: 'tasks_total',
  help: 'Total number of tasks',
  labelNames: ['status'],
});

export const taskCreatedTotal = new Counter({
  name: 'tasks_created_total',
  help: 'Total number of tasks created',
});

export const taskDeletedTotal = new Counter({
  name: 'tasks_deleted_total',
  help: 'Total number of tasks deleted',
});

export const taskUpdatedTotal = new Counter({
  name: 'tasks_updated_total',
  help: 'Total number of tasks updated',
});

export const apiErrors = new Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['error_type', 'status_code'],
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

export const supabaseConnectionStatus = new Gauge({
  name: 'supabase_connection_status',
  help: 'Supabase connection status (1 = connected, 0 = disconnected)',
});

// Middleware to track HTTP requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();

    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(method, route, statusCode)
      .inc();
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Update task metrics (call from frontend via fetch)
app.post('/api/metrics/task', express.json(), (req, res) => {
  const { action, status, count } = req.body;

  if (action === 'create') {
    taskCreatedTotal.inc();
  } else if (action === 'delete') {
    taskDeletedTotal.inc();
  } else if (action === 'update') {
    taskUpdatedTotal.inc();
  } else if (action === 'total' && status) {
    taskTotal.labels(status).set(count);
  }

  res.json({ success: true });
});

// Update Supabase connection status
app.post('/api/metrics/connection', express.json(), (req, res) => {
  const { connected } = req.body;
  supabaseConnectionStatus.set(connected ? 1 : 0);
  res.json({ success: true });
});

// Update database query duration
app.post('/api/metrics/db-query', express.json(), (req, res) => {
  const { operation, table, duration } = req.body;
  databaseQueryDuration.labels(operation, table).observe(duration);
  res.json({ success: true });
});

// Update API errors
app.post('/api/metrics/error', express.json(), (req, res) => {
  const { errorType, statusCode } = req.body;
  apiErrors.labels(errorType, statusCode.toString()).inc();
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`📊 Metrics server running on http://localhost:${port}`);
  console.log(`📈 Prometheus metrics available at http://localhost:${port}/metrics`);
});
