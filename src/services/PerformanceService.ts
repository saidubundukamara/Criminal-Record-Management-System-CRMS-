/**
 * Performance Service
 *
 * Business logic layer for performance monitoring and Web Vitals analytics.
 * Aggregates performance metrics for dashboard visualization and analysis.
 *
 * Phase 9: PWA Optimization
 * - Collects Web Vitals metrics (LCP, FID, CLS, TTFB, FCP, INP)
 * - Tracks sync queue performance
 * - Monitors cache hit rates
 * - Analyzes performance by network condition and device type
 *
 * Pan-African Design:
 * - Special focus on 2G/3G network performance
 * - Low-end device performance tracking
 * - Network condition correlation
 */

export interface PerformanceMetricInput {
  userId?: string;
  sessionId: string;
  metricName: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  connectionType: string;
  deviceMemory: number;
  timestamp: Date;
}

export interface WebVitalsAggregation {
  metricName: string;
  count: number;
  average: number;
  median: number;
  p75: number;
  p95: number;
  p99: number;
  goodCount: number;
  needsImprovementCount: number;
  poorCount: number;
  goodPercent: number;
}

export interface PerformanceByConnection {
  connectionType: string;
  metrics: {
    [metricName: string]: {
      average: number;
      median: number;
      count: number;
    };
  };
}

export interface PerformanceByDevice {
  deviceCategory: 'low-end' | 'mid-range' | 'high-end';
  memoryRange: string; // "< 2GB", "2-4GB", "> 4GB"
  metrics: {
    [metricName: string]: {
      average: number;
      median: number;
      count: number;
    };
  };
}

export interface PerformanceTimelinePoint {
  date: string; // ISO date (YYYY-MM-DD)
  hour?: number; // Optional hour (0-23) for hourly granularity
  metrics: {
    [metricName: string]: number; // Average value
  };
  sampleCount: number;
}

export interface SyncPerformanceMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  successRate: number;
  averageSyncDuration: number;
  averageQueueSize: number;
  averageItemsPerSync: number;
  conflictRate: number;
  autoResolvedConflicts: number;
  manualResolvedConflicts: number;
}

export interface CachePerformanceMetrics {
  totalCaches: number;
  totalSize: number;
  hitRate: number;
  cacheBreakdown: {
    name: string;
    size: number;
    itemCount: number;
    hitRate: number;
  }[];
}

export interface PerformanceDashboardData {
  summary: {
    totalSessions: number;
    avgLCP: number;
    avgFID: number;
    avgCLS: number;
    avgTTFB: number;
    avgFCP: number;
    avgINP: number;
  };
  byConnection: PerformanceByConnection[];
  byDevice: PerformanceByDevice[];
  timeline: PerformanceTimelinePoint[];
  webVitals: WebVitalsAggregation[];
  syncPerformance: SyncPerformanceMetrics;
  cachePerformance: CachePerformanceMetrics;
}

/**
 * Performance Service Class
 */
export class PerformanceService {
  // In-memory storage (will be replaced with database in future)
  private metrics: PerformanceMetricInput[] = [];
  private readonly MAX_METRICS = 10000; // Limit in-memory storage

  constructor() {
    console.log('[PerformanceService] Initialized');
  }

  /**
   * Record a performance metric
   */
  async recordMetric(metric: PerformanceMetricInput): Promise<void> {
    // Store in memory (limit size)
    if (this.metrics.length >= this.MAX_METRICS) {
      // Remove oldest metrics
      this.metrics = this.metrics.slice(-this.MAX_METRICS + 1000);
    }

    this.metrics.push(metric);

    // TODO: Store in database for persistence
    // await this.performanceMetricRepository.create({
    //   userId: metric.userId,
    //   sessionId: metric.sessionId,
    //   metricName: metric.metricName,
    //   value: metric.value,
    //   rating: metric.rating,
    //   url: metric.url,
    //   connectionType: metric.connectionType,
    //   deviceMemory: metric.deviceMemory,
    //   timestamp: metric.timestamp,
    // });
  }

  /**
   * Get aggregated metrics for dashboard
   */
  async getAggregatedMetrics(options: {
    days?: number;
    metricName?: string;
    userId?: string;
  }): Promise<PerformanceDashboardData> {
    const { days = 7, metricName, userId } = options;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Filter metrics
    const filteredMetrics = this.metrics.filter((m) => {
      const inDateRange = m.timestamp >= startDate && m.timestamp <= endDate;
      const matchesMetric = !metricName || m.metricName === metricName;
      const matchesUser = !userId || m.userId === userId;
      return inDateRange && matchesMetric && matchesUser;
    });

    // Calculate summary
    const summary = this.calculateSummary(filteredMetrics);

    // Calculate by connection type
    const byConnection = this.calculateByConnection(filteredMetrics);

    // Calculate by device
    const byDevice = this.calculateByDevice(filteredMetrics);

    // Calculate timeline
    const timeline = this.calculateTimeline(filteredMetrics, days);

    // Calculate Web Vitals aggregations
    const webVitals = this.calculateWebVitalsAggregations(filteredMetrics);

    // Sync and cache performance (placeholder - will be implemented)
    const syncPerformance = this.calculateSyncPerformance();
    const cachePerformance = await this.calculateCachePerformance();

    return {
      summary,
      byConnection,
      byDevice,
      timeline,
      webVitals,
      syncPerformance,
      cachePerformance,
    };
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummary(metrics: PerformanceMetricInput[]): PerformanceDashboardData['summary'] {
    const sessions = new Set(metrics.map((m) => m.sessionId)).size;

    const metricsByName = this.groupByMetricName(metrics);

    return {
      totalSessions: sessions,
      avgLCP: this.getAverage(metricsByName['LCP']),
      avgFID: this.getAverage(metricsByName['FID']),
      avgCLS: this.getAverage(metricsByName['CLS']),
      avgTTFB: this.getAverage(metricsByName['TTFB']),
      avgFCP: this.getAverage(metricsByName['FCP']),
      avgINP: this.getAverage(metricsByName['INP']),
    };
  }

  /**
   * Calculate metrics by connection type
   */
  private calculateByConnection(metrics: PerformanceMetricInput[]): PerformanceByConnection[] {
    const grouped = this.groupBy(metrics, (m) => m.connectionType);

    return Object.entries(grouped).map(([connectionType, connectionMetrics]) => {
      const metricsByName = this.groupByMetricName(connectionMetrics);

      const metricsData: any = {};
      Object.entries(metricsByName).forEach(([name, values]) => {
        metricsData[name] = {
          average: this.getAverage(values),
          median: this.getMedian(values),
          count: values.length,
        };
      });

      return {
        connectionType,
        metrics: metricsData,
      };
    });
  }

  /**
   * Calculate metrics by device category
   */
  private calculateByDevice(metrics: PerformanceMetricInput[]): PerformanceByDevice[] {
    const categorized = this.categorizeByDevice(metrics);

    return Object.entries(categorized).map(([category, deviceMetrics]) => {
      const metricsByName = this.groupByMetricName(deviceMetrics);

      const metricsData: any = {};
      Object.entries(metricsByName).forEach(([name, values]) => {
        metricsData[name] = {
          average: this.getAverage(values),
          median: this.getMedian(values),
          count: values.length,
        };
      });

      const memoryRange = this.getMemoryRange(category as any);

      return {
        deviceCategory: category as any,
        memoryRange,
        metrics: metricsData,
      };
    });
  }

  /**
   * Calculate timeline data
   */
  private calculateTimeline(metrics: PerformanceMetricInput[], days: number): PerformanceTimelinePoint[] {
    const timeline: PerformanceTimelinePoint[] = [];

    // Group by date
    const groupedByDate = this.groupBy(metrics, (m) => {
      return m.timestamp.toISOString().split('T')[0];
    });

    Object.entries(groupedByDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .forEach(([date, dateMetrics]) => {
        const metricsByName = this.groupByMetricName(dateMetrics);

        const metricsData: any = {};
        Object.entries(metricsByName).forEach(([name, values]) => {
          metricsData[name] = this.getAverage(values);
        });

        timeline.push({
          date,
          metrics: metricsData,
          sampleCount: dateMetrics.length,
        });
      });

    return timeline;
  }

  /**
   * Calculate Web Vitals aggregations
   */
  private calculateWebVitalsAggregations(metrics: PerformanceMetricInput[]): WebVitalsAggregation[] {
    const metricsByName = this.groupByMetricName(metrics);

    return Object.entries(metricsByName).map(([metricName, values]) => {
      const ratings = metrics.filter((m) => m.metricName === metricName);

      const goodCount = ratings.filter((m) => m.rating === 'good').length;
      const needsImprovementCount = ratings.filter((m) => m.rating === 'needs-improvement').length;
      const poorCount = ratings.filter((m) => m.rating === 'poor').length;

      return {
        metricName,
        count: values.length,
        average: this.getAverage(values),
        median: this.getMedian(values),
        p75: this.getPercentile(values, 75),
        p95: this.getPercentile(values, 95),
        p99: this.getPercentile(values, 99),
        goodCount,
        needsImprovementCount,
        poorCount,
        goodPercent: values.length > 0 ? (goodCount / values.length) * 100 : 0,
      };
    });
  }

  /**
   * Calculate sync performance (placeholder)
   */
  private calculateSyncPerformance(): SyncPerformanceMetrics {
    // TODO: Integrate with SyncEngine to get actual metrics
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      successRate: 0,
      averageSyncDuration: 0,
      averageQueueSize: 0,
      averageItemsPerSync: 0,
      conflictRate: 0,
      autoResolvedConflicts: 0,
      manualResolvedConflicts: 0,
    };
  }

  /**
   * Calculate cache performance
   */
  private async calculateCachePerformance(): Promise<CachePerformanceMetrics> {
    // TODO: Integrate with CacheManager to get actual metrics
    return {
      totalCaches: 0,
      totalSize: 0,
      hitRate: 0,
      cacheBreakdown: [],
    };
  }

  // ==================== UTILITY METHODS ====================

  private groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return arr.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  private groupByMetricName(metrics: PerformanceMetricInput[]): Record<string, number[]> {
    const grouped: Record<string, number[]> = {};

    metrics.forEach((m) => {
      if (!grouped[m.metricName]) grouped[m.metricName] = [];
      grouped[m.metricName].push(m.value);
    });

    return grouped;
  }

  private categorizeByDevice(metrics: PerformanceMetricInput[]): Record<string, PerformanceMetricInput[]> {
    const categorized: Record<string, PerformanceMetricInput[]> = {
      'low-end': [],
      'mid-range': [],
      'high-end': [],
    };

    metrics.forEach((m) => {
      if (m.deviceMemory < 2) {
        categorized['low-end'].push(m);
      } else if (m.deviceMemory < 4) {
        categorized['mid-range'].push(m);
      } else {
        categorized['high-end'].push(m);
      }
    });

    return categorized;
  }

  private getMemoryRange(category: 'low-end' | 'mid-range' | 'high-end'): string {
    switch (category) {
      case 'low-end':
        return '< 2GB';
      case 'mid-range':
        return '2-4GB';
      case 'high-end':
        return '> 4GB';
    }
  }

  private getAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  private getMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private getPercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Clear all metrics (for testing or reset)
   */
  async clearMetrics(): Promise<void> {
    this.metrics = [];
    console.log('[PerformanceService] Metrics cleared');
  }

  /**
   * Get metrics count
   */
  getMetricsCount(): number {
    return this.metrics.length;
  }
}
