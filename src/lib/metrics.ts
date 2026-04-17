// Metrics Integration Service
// Sends application metrics to Prometheus via the metrics server

// Type definitions for better type safety
interface TaskStats {
  total?: number;
  todo?: number;
  in_progress?: number;
  done?: number;
}

interface DbQueryMetric {
  operation: string;
  table: string;
  duration: number;
}

interface ConnectionMetric {
  connected: boolean;
}

interface ErrorMetric {
  errorType: string;
  statusCode?: number;
}

interface TaskActionMetric {
  action: 'create' | 'update' | 'delete';
  count?: number;
}

const METRICS_URL = import.meta.env.VITE_METRICS_URL || 'http://localhost:5000';
const REQUEST_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 2;

/**
 * Send metrics to the metrics server with retry logic and timeout
 * Silently fails to prevent breaking the application
 */
async function sendMetric(
  endpoint: string,
  data: Record<string, unknown>
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      await fetch(`${METRICS_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return; // Success - exit function
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        // Wait before retrying (exponential backoff: 100ms, 200ms)
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 100));
      }
    }
  }

  // Log warning only in development mode
  if (import.meta.env.DEV) {
    console.warn(
      `Failed to send metric to ${METRICS_URL}${endpoint} after ${MAX_RETRIES + 1} attempts:`,
      lastError?.message
    );
  }
}

/**
 * Track task operations (create, update, delete)
 * Fire-and-forget - does not block
 */
export function trackTaskAction(
  action: 'create' | 'update' | 'delete',
  count?: number
): void {
  const metric: TaskActionMetric = { action, count };
  sendMetric('/api/metrics/task', metric).catch(() => {
    // Silently ignore errors to prevent breaking the app
  });
}

/**
 * Update task statistics (total tasks by status)
 * Fire-and-forget - does not block
 */
export function updateTaskStats(stats: TaskStats): void {
  // Create array of metric promises for parallel execution
  const metricPromises: Promise<void>[] = [];

  for (const [status, count] of Object.entries(stats)) {
    if (count !== undefined && count !== null) {
      const metric = { action: 'total', status, count };
      metricPromises.push(
        sendMetric('/api/metrics/task', metric).catch(() => {
          // Silently ignore errors
        })
      );
    }
  }

  // Execute all metrics in parallel (fire-and-forget)
  Promise.all(metricPromises).catch(() => {
    // Silently ignore errors to prevent breaking the app
  });
}

/**
 * Report Supabase connection status
 * Fire-and-forget - does not block
 */
export function reportConnectionStatus(connected: boolean): void {
  const metric: ConnectionMetric = { connected };
  sendMetric('/api/metrics/connection', metric).catch(() => {
    // Silently ignore errors to prevent breaking the app
  });
}

/**
 * Report database query performance
 * Fire-and-forget - does not block
 */
export function reportDbQueryTime(
  operation: string,
  table: string,
  duration: number
): void {
  const metric: DbQueryMetric = { operation, table, duration };
  sendMetric('/api/metrics/db-query', metric).catch(() => {
    // Silently ignore errors to prevent breaking the app
  });
}

/**
 * Report application errors
 * Fire-and-forget - does not block
 */
export function reportError(errorType: string, statusCode?: number): void {
  const metric: ErrorMetric = { errorType, statusCode: statusCode ?? 500 };
  sendMetric('/api/metrics/error', metric).catch(() => {
    // Silently ignore errors to prevent breaking the app
  });
}

// Export all functions as named exports
export default {
  trackTaskAction,
  updateTaskStats,
  reportConnectionStatus,
  reportDbQueryTime,
  reportError,
};
