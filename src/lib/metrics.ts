// Metrics Integration Service
// Sends application metrics to Prometheus via the metrics server

const METRICS_URL = process.env.REACT_APP_METRICS_URL || 'http://localhost:5000';

// Helper function to send metrics to the metrics server
async function sendMetric(endpoint: string, data: Record<string, any>) {
  try {
    await fetch(`${METRICS_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to send metric:', error);
  }
}

/**
 * Track task operations (create, update, delete)
 */
export async function trackTaskAction(
  action: 'create' | 'update' | 'delete',
  count?: number
) {
  await sendMetric('/api/metrics/task', { action, count });
}

/**
 * Update task statistics (total tasks by status)
 */
export async function updateTaskStats(stats: {
  total?: number;
  todo?: number;
  in_progress?: number;
  done?: number;
}) {
  for (const [status, count] of Object.entries(stats)) {
    if (count !== undefined) {
      await sendMetric('/api/metrics/task', { action: 'total', status, count });
    }
  }
}

/**
 * Report Supabase connection status
 */
export async function reportConnectionStatus(connected: boolean) {
  await sendMetric('/api/metrics/connection', { connected });
}

/**
 * Report database query performance
 */
export async function reportDbQueryTime(
  operation: string,
  table: string,
  duration: number
) {
  await sendMetric('/api/metrics/db-query', { operation, table, duration });
}

/**
 * Report application errors
 */
export async function reportError(errorType: string, statusCode: number = 500) {
  await sendMetric('/api/metrics/error', { errorType, statusCode });
}

export default {
  trackTaskAction,
  updateTaskStats,
  reportConnectionStatus,
  reportDbQueryTime,
  reportError,
};
