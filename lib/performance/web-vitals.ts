/**
 * Web Vitals Tracking
 *
 * Implements Core Web Vitals monitoring for CRMS PWA optimization.
 * Tracks: LCP, FID, CLS, TTFB, FCP, INP
 *
 * Pan-African Design Considerations:
 * - Special attention to metrics on 2G/3G networks
 * - Tracks network conditions for context
 * - Monitors performance across different device types
 * - Supports offline metric queuing for later upload
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export interface WebVitalMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
  timestamp: number;
}

export interface PerformanceContext {
  url: string;
  userAgent: string;
  connection: {
    effectiveType: string; // '4g', '3g', '2g', 'slow-2g'
    downlink: number; // Mbps
    rtt: number; // Round trip time in ms
    saveData: boolean; // User has data saver enabled
  };
  device: {
    memory: number; // GB (deviceMemory API)
    hardwareConcurrency: number; // CPU cores
  };
  viewport: {
    width: number;
    height: number;
  };
}

export interface PerformanceReport {
  metric: WebVitalMetric;
  context: PerformanceContext;
  sessionId: string;
  userId?: string;
}

/**
 * Get rating for each metric based on Web Vitals thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Get current network connection information
 */
function getConnectionInfo() {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const conn = (navigator as any).connection;
    return {
      effectiveType: conn?.effectiveType || 'unknown',
      downlink: conn?.downlink || 0,
      rtt: conn?.rtt || 0,
      saveData: conn?.saveData || false,
    };
  }
  return {
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  };
}

/**
 * Get device information
 */
function getDeviceInfo() {
  if (typeof navigator !== 'undefined') {
    return {
      memory: (navigator as any).deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
    };
  }
  return {
    memory: 0,
    hardwareConcurrency: 0,
  };
}

/**
 * Get viewport information
 */
function getViewportInfo() {
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  return {
    width: 0,
    height: 0,
  };
}

/**
 * Get or create session ID for grouping metrics
 */
function getSessionId(): string {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('crms-performance-session');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('crms-performance-session', sessionId);
    }
    return sessionId;
  }
  return 'unknown-session';
}

/**
 * Get current performance context
 */
function getPerformanceContext(): PerformanceContext {
  return {
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    connection: getConnectionInfo(),
    device: getDeviceInfo(),
    viewport: getViewportInfo(),
  };
}

/**
 * Queue metrics for later upload (when offline)
 */
async function queueMetric(report: PerformanceReport): Promise<void> {
  try {
    // Store in localStorage for offline persistence
    const queue = JSON.parse(localStorage.getItem('crms-perf-queue') || '[]');
    queue.push(report);

    // Limit queue size to prevent storage issues (keep last 100 metrics)
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100);
    }

    localStorage.setItem('crms-perf-queue', JSON.stringify(queue));
  } catch (error) {
    console.error('Error queuing performance metric:', error);
  }
}

/**
 * Send metric to API endpoint
 */
async function sendMetric(report: PerformanceReport): Promise<void> {
  try {
    // Check if online
    if (!navigator.onLine) {
      await queueMetric(report);
      return;
    }

    // Send to API
    const response = await fetch('/api/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
      // Use sendBeacon alternative for reliability
      keepalive: true,
    });

    if (!response.ok) {
      // If failed, queue for retry (silently in development)
      await queueMetric(report);
    }
  } catch (error) {
    // Queue for retry but don't log in development (API not implemented yet)
    if (process.env.NODE_ENV !== 'development') {
      console.error('Error sending performance metric:', error);
    }
    await queueMetric(report);
  }
}

/**
 * Process queued metrics and send them
 */
export async function flushPerformanceQueue(): Promise<void> {
  try {
    if (!navigator.onLine) return;

    const queue = JSON.parse(localStorage.getItem('crms-perf-queue') || '[]');
    if (queue.length === 0) return;

    console.log(`Flushing ${queue.length} queued performance metrics...`);

    // Send all queued metrics
    const promises = queue.map((report: PerformanceReport) =>
      fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
        keepalive: true,
      }).catch((error) => {
        console.error('Error flushing metric:', error);
        return null;
      })
    );

    await Promise.all(promises);

    // Clear queue after successful flush
    localStorage.removeItem('crms-perf-queue');
    console.log('Performance queue flushed successfully');
  } catch (error) {
    console.error('Error flushing performance queue:', error);
  }
}

/**
 * Handle Web Vitals metric
 */
function handleMetric(metric: Metric, userId?: string): void {
  const webVitalMetric: WebVitalMetric = {
    id: metric.id,
    name: metric.name as any,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
  };

  const report: PerformanceReport = {
    metric: webVitalMetric,
    context: getPerformanceContext(),
    sessionId: getSessionId(),
    userId,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', webVitalMetric.name, {
      value: Math.round(webVitalMetric.value),
      rating: webVitalMetric.rating,
      connection: report.context.connection.effectiveType,
    });
  }

  // Send to API
  sendMetric(report);
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals(userId?: string): void {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals (v4 API - FID replaced by INP)
  onCLS((metric) => handleMetric(metric, userId));
  onLCP((metric) => handleMetric(metric, userId));
  onINP((metric) => handleMetric(metric, userId));

  // Track additional metrics
  onFCP((metric) => handleMetric(metric, userId));
  onTTFB((metric) => handleMetric(metric, userId));

  // Flush queued metrics on page visibility
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      flushPerformanceQueue();
    }
  });

  // Flush queued metrics when online
  window.addEventListener('online', () => {
    flushPerformanceQueue();
  });

  // Flush on page unload (best effort)
  window.addEventListener('beforeunload', () => {
    flushPerformanceQueue();
  });
}

/**
 * Report custom performance marks
 */
export function reportCustomMetric(
  name: string,
  value: number,
  unit: string = 'ms'
): void {
  if (typeof window === 'undefined') return;

  const customMetric: WebVitalMetric = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name as any,
    value,
    rating: 'good', // Custom metrics don't have standard ratings
    delta: value,
    navigationType: 'custom',
    timestamp: Date.now(),
  };

  const report: PerformanceReport = {
    metric: customMetric,
    context: getPerformanceContext(),
    sessionId: getSessionId(),
  };

  sendMetric(report);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Custom Metric]', name, value, unit);
  }
}

/**
 * Measure and report custom timing
 */
export async function measureOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    reportCustomMetric(name, duration, 'ms');
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    reportCustomMetric(`${name}-error`, duration, 'ms');
    throw error;
  }
}

/**
 * Get current network quality assessment
 */
export function getNetworkQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
  if (!navigator.onLine) return 'offline';

  const connection = getConnectionInfo();
  const effectiveType = connection.effectiveType.toLowerCase();

  if (effectiveType === '4g' || effectiveType === 'wifi') return 'excellent';
  if (effectiveType === '3g') return 'good';
  return 'poor'; // 2g, slow-2g
}

/**
 * Check if device is low-end (for adaptive performance)
 */
export function isLowEndDevice(): boolean {
  const device = getDeviceInfo();
  // Consider low-end if less than 4GB RAM or less than 4 CPU cores
  return device.memory < 4 || device.hardwareConcurrency < 4;
}
