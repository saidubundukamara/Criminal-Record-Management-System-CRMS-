/**
 * Performance Monitoring Utilities
 *
 * Helper functions for tracking and analyzing application performance.
 * Supports both browser and server-side performance monitoring.
 *
 * Pan-African Design Considerations:
 * - Monitor performance under various network conditions
 * - Track performance metrics specific to low-end devices
 * - Support for offline performance tracking
 */

export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
  cached: boolean;
}

export interface PageLoadMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  domInteractive: number;
  resources: ResourceTiming[];
}

/**
 * Performance Monitor Class
 */
class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private customMetrics: Map<string, number[]> = new Map();

  /**
   * Start a performance measurement
   */
  mark(name: string, metadata?: Record<string, any>): void {
    if (typeof performance === 'undefined') return;

    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.marks.set(name, mark);

    // Also use native Performance API
    try {
      performance.mark(`crms:${name}:start`);
    } catch (error) {
      // Ignore errors (e.g., duplicate marks)
    }
  }

  /**
   * End a performance measurement and return duration
   */
  measure(name: string, metadata?: Record<string, any>): number | null {
    if (typeof performance === 'undefined') return null;

    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`No performance mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - mark.startTime;
    mark.duration = duration;
    mark.metadata = { ...mark.metadata, ...metadata };

    // Store in custom metrics for aggregation
    const metrics = this.customMetrics.get(name) || [];
    metrics.push(duration);
    this.customMetrics.set(name, metrics);

    // Use native Performance API
    try {
      performance.mark(`crms:${name}:end`);
      performance.measure(`crms:${name}`, `crms:${name}:start`, `crms:${name}:end`);
    } catch (error) {
      // Ignore errors
    }

    // Clean up mark
    this.marks.delete(name);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${Math.round(duration)}ms`, metadata);
    }

    return duration;
  }

  /**
   * Get statistics for a metric
   */
  getMetricStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p75: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.customMetrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const sorted = [...metrics].sort((a, b) => a - b);
    const count = sorted.length;

    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];

    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * count) - 1;
      return sorted[Math.max(0, index)];
    };

    return {
      count,
      avg: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      p50: Math.round(percentile(50) * 100) / 100,
      p75: Math.round(percentile(75) * 100) / 100,
      p95: Math.round(percentile(95) * 100) / 100,
      p99: Math.round(percentile(99) * 100) / 100,
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.marks.clear();
    this.customMetrics.clear();

    if (typeof performance !== 'undefined') {
      try {
        performance.clearMarks();
        performance.clearMeasures();
      } catch (error) {
        // Ignore errors
      }
    }
  }

  /**
   * Get all custom metrics
   */
  getAllMetrics(): Record<string, number[]> {
    const result: Record<string, number[]> = {};
    this.customMetrics.forEach((values, key) => {
      result[key] = [...values];
    });
    return result;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Get page load metrics
 */
export function getPageLoadMetrics(): PageLoadMetrics | null {
  if (typeof performance === 'undefined' || !performance.timing) return null;

  const timing = performance.timing;
  const navigationStart = timing.navigationStart;

  // Get paint timing
  let firstPaint = 0;
  let firstContentfulPaint = 0;

  if (performance.getEntriesByType) {
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry: any) => {
      if (entry.name === 'first-paint') {
        firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        firstContentfulPaint = entry.startTime;
      }
    });
  }

  // Get resource timing
  const resources: ResourceTiming[] = [];
  if (performance.getEntriesByType) {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    resourceEntries.forEach((entry) => {
      resources.push({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize || 0,
        type: entry.initiatorType,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      });
    });
  }

  return {
    domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
    loadComplete: timing.loadEventEnd - navigationStart,
    firstPaint,
    firstContentfulPaint,
    domInteractive: timing.domInteractive - navigationStart,
    resources,
  };
}

/**
 * Get resource timing summary
 */
export function getResourceTimingSummary(): {
  totalResources: number;
  cachedResources: number;
  totalSize: number;
  totalDuration: number;
  byType: Record<string, { count: number; size: number; duration: number }>;
} {
  const metrics = getPageLoadMetrics();
  if (!metrics) {
    return {
      totalResources: 0,
      cachedResources: 0,
      totalSize: 0,
      totalDuration: 0,
      byType: {},
    };
  }

  const { resources } = metrics;
  const byType: Record<string, { count: number; size: number; duration: number }> = {};

  let totalSize = 0;
  let totalDuration = 0;
  let cachedCount = 0;

  resources.forEach((resource) => {
    totalSize += resource.size;
    totalDuration += resource.duration;
    if (resource.cached) cachedCount++;

    if (!byType[resource.type]) {
      byType[resource.type] = { count: 0, size: 0, duration: 0 };
    }

    byType[resource.type].count++;
    byType[resource.type].size += resource.size;
    byType[resource.type].duration += resource.duration;
  });

  return {
    totalResources: resources.length,
    cachedResources: cachedCount,
    totalSize,
    totalDuration,
    byType,
  };
}

/**
 * Monitor a function execution
 */
export async function monitorFunction<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  performanceMonitor.mark(name, metadata);
  try {
    const result = await fn();
    performanceMonitor.measure(name, { ...metadata, success: true });
    return result;
  } catch (error) {
    performanceMonitor.measure(name, { ...metadata, success: false, error: String(error) });
    throw error;
  }
}

/**
 * Throttle function execution (useful for high-frequency events)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Debounce function execution (useful for search inputs, etc.)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Request Idle Callback wrapper with fallback
 */
export function requestIdleCallback(callback: () => void, timeout: number = 2000): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    // Fallback to setTimeout
    setTimeout(callback, timeout);
  }
}

/**
 * Measure First Input Delay (FID) manually
 */
export function measureFirstInputDelay(): void {
  if (typeof window === 'undefined') return;

  let firstInputDelay: number | null = null;

  const measureFID = (event: Event) => {
    if (firstInputDelay !== null) return; // Already measured

    if (event.timeStamp && performance.timing) {
      firstInputDelay = event.timeStamp - performance.timing.navigationStart;
      console.log('[FID]', Math.round(firstInputDelay), 'ms');

      // Remove listeners after first input
      window.removeEventListener('click', measureFID, true);
      window.removeEventListener('mousedown', measureFID, true);
      window.removeEventListener('keydown', measureFID, true);
      window.removeEventListener('touchstart', measureFID, true);
      window.removeEventListener('pointerdown', measureFID, true);
    }
  };

  // Listen for first input events
  window.addEventListener('click', measureFID, true);
  window.addEventListener('mousedown', measureFID, true);
  window.addEventListener('keydown', measureFID, true);
  window.addEventListener('touchstart', measureFID, true);
  window.addEventListener('pointerdown', measureFID, true);
}

/**
 * Log performance metrics to console (dev only)
 */
export function logPerformanceMetrics(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const pageLoad = getPageLoadMetrics();
  if (pageLoad) {
    console.group('📊 Page Load Metrics');
    console.log('DOM Content Loaded:', Math.round(pageLoad.domContentLoaded), 'ms');
    console.log('Load Complete:', Math.round(pageLoad.loadComplete), 'ms');
    console.log('First Paint:', Math.round(pageLoad.firstPaint), 'ms');
    console.log('FCP:', Math.round(pageLoad.firstContentfulPaint), 'ms');
    console.log('DOM Interactive:', Math.round(pageLoad.domInteractive), 'ms');
    console.groupEnd();
  }

  const resourceSummary = getResourceTimingSummary();
  console.group('📦 Resource Timing');
  console.log('Total Resources:', resourceSummary.totalResources);
  console.log('Cached Resources:', resourceSummary.cachedResources);
  console.log('Total Size:', Math.round(resourceSummary.totalSize / 1024), 'KB');
  console.log('Total Duration:', Math.round(resourceSummary.totalDuration), 'ms');
  console.log('By Type:', resourceSummary.byType);
  console.groupEnd();
}

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  limit: number;
} | null {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Monitor memory usage and warn if high
 */
export function monitorMemoryUsage(threshold: number = 0.9): void {
  const memory = getMemoryUsage();
  if (!memory) return;

  const usageRatio = memory.used / memory.limit;
  if (usageRatio > threshold) {
    console.warn(
      `⚠️ High memory usage: ${Math.round(usageRatio * 100)}% (${Math.round(memory.used / 1024 / 1024)}MB / ${Math.round(memory.limit / 1024 / 1024)}MB)`
    );
  }
}

/**
 * Adaptive loading based on device and network
 */
export function shouldLoadHeavyResources(): boolean {
  if (typeof navigator === 'undefined') return true;

  // Check data saver
  if ((navigator as any).connection?.saveData) {
    return false;
  }

  // Check network quality
  const connection = (navigator as any).connection;
  if (connection) {
    const effectiveType = connection.effectiveType?.toLowerCase();
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return false;
    }
  }

  // Check device memory
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 2) {
    return false; // Low-end device
  }

  return true;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}
