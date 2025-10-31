/**
 * PerformanceService Unit Tests
 *
 * Tests for Performance monitoring business logic
 * Phase 9: PWA Optimization
 */
import { PerformanceService, PerformanceMetricInput } from '@/src/services/PerformanceService';

describe('PerformanceService', () => {
  let performanceService: PerformanceService;

  beforeEach(() => {
    // Create service instance
    performanceService = new PerformanceService();

    // Clear any existing metrics
    performanceService['metrics'] = [];
  });

  describe('recordMetric', () => {
    it('should record a valid Web Vitals metric', () => {
      // Arrange
      const metric: PerformanceMetricInput = {
        userId: 'officer-123',
        sessionId: 'session-abc',
        metricName: 'LCP',
        value: 2000, // 2 seconds
        rating: 'good',
        url: '/dashboard',
        connectionType: '4g',
        deviceMemory: 8,
        timestamp: new Date('2025-01-15T10:00:00Z'),
      };

      // Act
      performanceService.recordMetric(metric);

      // Assert
      const metrics = performanceService['metrics'];
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        userId: 'officer-123',
        sessionId: 'session-abc',
        metricName: 'LCP',
        value: 2000,
        rating: 'good',
      });
    });

    it('should record multiple metrics', () => {
      // Arrange
      const metric1: PerformanceMetricInput = {
        sessionId: 'session-abc',
        metricName: 'LCP',
        value: 2000,
        rating: 'good',
        url: '/dashboard',
        connectionType: '4g',
        deviceMemory: 8,
        timestamp: new Date('2025-01-15T10:00:00Z'),
      };

      const metric2: PerformanceMetricInput = {
        sessionId: 'session-abc',
        metricName: 'FID',
        value: 80,
        rating: 'good',
        url: '/dashboard',
        connectionType: '4g',
        deviceMemory: 8,
        timestamp: new Date('2025-01-15T10:00:05Z'),
      };

      // Act
      performanceService.recordMetric(metric1);
      performanceService.recordMetric(metric2);

      // Assert
      const metrics = performanceService['metrics'];
      expect(metrics).toHaveLength(2);
      expect(metrics[0].metricName).toBe('LCP');
      expect(metrics[1].metricName).toBe('FID');
    });

    it('should enforce 10,000 metric limit', () => {
      // Arrange
      const baseMetric: PerformanceMetricInput = {
        sessionId: 'session-abc',
        metricName: 'LCP',
        value: 2000,
        rating: 'good',
        url: '/dashboard',
        connectionType: '4g',
        deviceMemory: 8,
        timestamp: new Date('2025-01-15T10:00:00Z'),
      };

      // Fill with 10,000 metrics
      for (let i = 0; i < 10000; i++) {
        performanceService.recordMetric({
          ...baseMetric,
          timestamp: new Date(Date.now() + i * 1000),
        });
      }

      // Act - Try to add one more
      performanceService.recordMetric({
        ...baseMetric,
        timestamp: new Date(),
      });

      // Assert - Should still be 10,000 (oldest removed)
      const metrics = performanceService['metrics'];
      expect(metrics).toHaveLength(10000);
    });
  });

  describe('getAggregatedMetrics', () => {
    beforeEach(() => {
      // Setup test data
      const baseDate = new Date('2025-01-15T00:00:00Z');

      // Add metrics for 3 days
      for (let day = 0; day < 3; day++) {
        for (let i = 0; i < 10; i++) {
          const timestamp = new Date(baseDate);
          timestamp.setDate(timestamp.getDate() + day);
          timestamp.setHours(i);

          // LCP metrics
          performanceService.recordMetric({
            userId: `officer-${i}`,
            sessionId: `session-${day}-${i}`,
            metricName: 'LCP',
            value: 2000 + i * 100, // Range: 2000-2900ms
            rating: i < 5 ? 'good' : 'needs-improvement',
            url: '/dashboard',
            connectionType: day === 0 ? '4g' : day === 1 ? '3g' : '2g',
            deviceMemory: i < 3 ? 1 : i < 7 ? 4 : 8, // Low, mid, high-end
            timestamp,
          });

          // FID metrics
          performanceService.recordMetric({
            userId: `officer-${i}`,
            sessionId: `session-${day}-${i}`,
            metricName: 'FID',
            value: 50 + i * 10, // Range: 50-140ms
            rating: i < 7 ? 'good' : 'needs-improvement',
            url: '/dashboard',
            connectionType: day === 0 ? '4g' : day === 1 ? '3g' : '2g',
            deviceMemory: i < 3 ? 1 : i < 7 ? 4 : 8,
            timestamp,
          });
        }
      }
    });

    it('should return aggregated metrics for valid days parameter', async () => {
      // Act
      const result = await performanceService.getAggregatedMetrics(7);

      // Assert
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.avgLCP).toBeGreaterThan(0);
      expect(result.summary.avgFID).toBeGreaterThan(0);
      expect(result.summary.totalSessions).toBeGreaterThan(0);
    });

    it('should aggregate by connection type', async () => {
      // Act
      const result = await performanceService.getAggregatedMetrics(7);

      // Assert
      expect(result.byConnection).toBeDefined();
      expect(result.byConnection.length).toBeGreaterThan(0);

      const conn4g = result.byConnection.find((c) => c.connectionType === '4g');
      const conn3g = result.byConnection.find((c) => c.connectionType === '3g');
      const conn2g = result.byConnection.find((c) => c.connectionType === '2g');

      expect(conn4g).toBeDefined();
      expect(conn3g).toBeDefined();
      expect(conn2g).toBeDefined();
    });

    it('should aggregate by device category', async () => {
      // Act
      const result = await performanceService.getAggregatedMetrics(7);

      // Assert
      expect(result.byDevice).toBeDefined();
      expect(result.byDevice.length).toBe(3); // low-end, mid-range, high-end

      const lowEnd = result.byDevice.find((d) => d.deviceCategory === 'low-end');
      const midRange = result.byDevice.find((d) => d.deviceCategory === 'mid-range');
      const highEnd = result.byDevice.find((d) => d.deviceCategory === 'high-end');

      expect(lowEnd).toBeDefined();
      expect(lowEnd?.memoryRange).toBe('< 2GB');

      expect(midRange).toBeDefined();
      expect(midRange?.memoryRange).toBe('2-4GB');

      expect(highEnd).toBeDefined();
      expect(highEnd?.memoryRange).toBe('> 4GB');
    });

    it('should generate timeline data', async () => {
      // Act
      const result = await performanceService.getAggregatedMetrics(7);

      // Assert
      expect(result.timeline).toBeDefined();
      expect(result.timeline.length).toBeGreaterThan(0);
      expect(result.timeline[0]).toHaveProperty('date');
      expect(result.timeline[0]).toHaveProperty('metrics');
      expect(result.timeline[0]).toHaveProperty('sampleCount');
    });

    it('should calculate Web Vitals aggregations', async () => {
      // Act
      const result = await performanceService.getAggregatedMetrics(7);

      // Assert
      expect(result.webVitals).toBeDefined();
      expect(result.webVitals.length).toBeGreaterThan(0);

      const lcpAgg = result.webVitals.find((wv) => wv.metricName === 'LCP');
      expect(lcpAgg).toBeDefined();
      expect(lcpAgg?.count).toBeGreaterThan(0);
      expect(lcpAgg?.average).toBeGreaterThan(0);
      expect(lcpAgg?.median).toBeGreaterThan(0);
      expect(lcpAgg?.p75).toBeGreaterThan(0);
      expect(lcpAgg?.p95).toBeGreaterThan(0);
      expect(lcpAgg?.p99).toBeGreaterThan(0);
      expect(lcpAgg?.goodCount).toBeGreaterThan(0);
      expect(lcpAgg?.goodPercent).toBeGreaterThanOrEqual(0);
      expect(lcpAgg?.goodPercent).toBeLessThanOrEqual(100);
    });

    it('should filter by metric name', async () => {
      // Act
      const result = await performanceService.getAggregatedMetrics(7, 'LCP');

      // Assert
      expect(result.webVitals).toBeDefined();
      expect(result.webVitals.length).toBe(1);
      expect(result.webVitals[0].metricName).toBe('LCP');
    });

    it('should handle no metrics within date range', async () => {
      // Arrange - Clear all metrics
      performanceService['metrics'] = [];

      // Act
      const result = await performanceService.getAggregatedMetrics(7);

      // Assert
      expect(result.summary.totalSessions).toBe(0);
      expect(result.summary.avgLCP).toBe(0);
      expect(result.byConnection).toHaveLength(0);
      expect(result.byDevice).toHaveLength(0);
      expect(result.timeline).toHaveLength(0);
      expect(result.webVitals).toHaveLength(0);
    });

    it('should calculate percentiles correctly', async () => {
      // Arrange - Add known metrics
      performanceService['metrics'] = [];

      for (let i = 0; i < 100; i++) {
        performanceService.recordMetric({
          sessionId: `session-${i}`,
          metricName: 'LCP',
          value: i * 10, // Values: 0, 10, 20, ..., 990
          rating: 'good',
          url: '/test',
          connectionType: '4g',
          deviceMemory: 8,
          timestamp: new Date('2025-01-15T10:00:00Z'),
        });
      }

      // Act
      const result = await performanceService.getAggregatedMetrics(7);

      // Assert
      const lcpAgg = result.webVitals.find((wv) => wv.metricName === 'LCP');
      expect(lcpAgg).toBeDefined();
      expect(lcpAgg?.median).toBeCloseTo(490, 0); // 50th percentile
      expect(lcpAgg?.p75).toBeCloseTo(740, 0); // 75th percentile
      expect(lcpAgg?.p95).toBeCloseTo(940, 0); // 95th percentile
      expect(lcpAgg?.p99).toBeCloseTo(980, 0); // 99th percentile
    });

    it('should categorize devices by memory correctly', async () => {
      // Arrange
      performanceService['metrics'] = [];

      // Low-end device (< 2GB)
      performanceService.recordMetric({
        sessionId: 'session-low',
        metricName: 'LCP',
        value: 3000,
        rating: 'needs-improvement',
        url: '/dashboard',
        connectionType: '2g',
        deviceMemory: 1,
        timestamp: new Date('2025-01-15T10:00:00Z'),
      });

      // Mid-range device (2-4GB)
      performanceService.recordMetric({
        sessionId: 'session-mid',
        metricName: 'LCP',
        value: 2500,
        rating: 'good',
        url: '/dashboard',
        connectionType: '3g',
        deviceMemory: 4,
        timestamp: new Date('2025-01-15T10:00:00Z'),
      });

      // High-end device (> 4GB)
      performanceService.recordMetric({
        sessionId: 'session-high',
        metricName: 'LCP',
        value: 2000,
        rating: 'good',
        url: '/dashboard',
        connectionType: '4g',
        deviceMemory: 8,
        timestamp: new Date('2025-01-15T10:00:00Z'),
      });

      // Act
      const result = await performanceService.getAggregatedMetrics(7);

      // Assert
      expect(result.byDevice).toHaveLength(3);

      const lowEnd = result.byDevice.find((d) => d.deviceCategory === 'low-end');
      const midRange = result.byDevice.find((d) => d.deviceCategory === 'mid-range');
      const highEnd = result.byDevice.find((d) => d.deviceCategory === 'high-end');

      expect(lowEnd?.metrics.LCP.average).toBe(3000);
      expect(midRange?.metrics.LCP.average).toBe(2500);
      expect(highEnd?.metrics.LCP.average).toBe(2000);
    });
  });
});
