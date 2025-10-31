/**
 * Performance API Integration Tests
 *
 * Tests /api/performance endpoint (GET and POST)
 * Phase 9: PWA Optimization
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/performance/route';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock container
jest.mock('@/src/di/container', () => ({
  container: {
    performanceService: {
      recordMetric: jest.fn(),
      getAggregatedMetrics: jest.fn(),
    },
    auditLogRepository: {
      create: jest.fn(),
    },
  },
}));

import { container } from '@/src/di/container';

describe('/api/performance', () => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/performance', () => {
    it('should record performance metric without authentication', async () => {
      // Arrange
      const metricData = {
        sessionId: 'session-abc-123',
        metricName: 'LCP',
        value: 2000,
        rating: 'good',
        url: '/dashboard',
        connectionType: '4g',
        deviceMemory: 8,
        timestamp: new Date('2025-01-15T10:00:00Z').toISOString(),
      };

      mockGetServerSession.mockResolvedValue(null);
      (container.performanceService.recordMetric as jest.Mock).mockReturnValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(container.performanceService.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-abc-123',
          metricName: 'LCP',
          value: 2000,
          rating: 'good',
        })
      );
    });

    it('should record metric with user ID for authenticated users', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'officer-123',
          badge: 'SA-00001',
        },
      };

      const metricData = {
        sessionId: 'session-abc-123',
        metricName: 'FID',
        value: 80,
        rating: 'good',
        url: '/cases',
        connectionType: '3g',
        deviceMemory: 4,
        timestamp: new Date('2025-01-15T10:00:00Z').toISOString(),
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.performanceService.recordMetric as jest.Mock).mockReturnValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricData),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
      expect(container.performanceService.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'officer-123',
          sessionId: 'session-abc-123',
          metricName: 'FID',
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const invalidData = {
        sessionId: 'session-abc-123',
        // Missing metricName, value, rating, etc.
      };

      const request = new NextRequest('http://localhost:3000/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle all Web Vitals metrics', async () => {
      // Arrange
      const metrics = ['LCP', 'FID', 'CLS', 'TTFB', 'FCP', 'INP'];

      mockGetServerSession.mockResolvedValue(null);
      (container.performanceService.recordMetric as jest.Mock).mockReturnValue(undefined);

      // Act & Assert
      for (const metricName of metrics) {
        const metricData = {
          sessionId: 'session-abc-123',
          metricName,
          value: 100,
          rating: 'good',
          url: '/dashboard',
          connectionType: '4g',
          deviceMemory: 8,
          timestamp: new Date().toISOString(),
        };

        const request = new NextRequest('http://localhost:3000/api/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metricData),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }

      expect(container.performanceService.recordMetric).toHaveBeenCalledTimes(6);
    });
  });

  describe('GET /api/performance', () => {
    it('should return aggregated metrics for admin users', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-123',
          badge: 'ADMIN-001',
          role: 'Admin',
          roleLevel: 2,
        },
      };

      const mockAggregatedData = {
        summary: {
          avgLCP: 2200,
          avgFID: 85,
          avgCLS: 0.05,
          avgTTFB: 650,
          avgFCP: 1800,
          avgINP: 180,
          totalSessions: 500,
        },
        byConnection: [
          { connectionType: '4g', metrics: { LCP: { average: 2000, median: 1900, count: 200 } } },
          { connectionType: '3g', metrics: { LCP: { average: 2500, median: 2400, count: 200 } } },
          { connectionType: '2g', metrics: { LCP: { average: 3500, median: 3300, count: 100 } } },
        ],
        byDevice: [
          {
            deviceCategory: 'low-end',
            memoryRange: '< 2GB',
            metrics: { LCP: { average: 3000, median: 2900, count: 100 } },
          },
          {
            deviceCategory: 'mid-range',
            memoryRange: '2-4GB',
            metrics: { LCP: { average: 2500, median: 2400, count: 200 } },
          },
          {
            deviceCategory: 'high-end',
            memoryRange: '> 4GB',
            metrics: { LCP: { average: 2000, median: 1900, count: 200 } },
          },
        ],
        timeline: [
          { date: '2025-01-15', metrics: { LCP: 2200, FID: 85 }, sampleCount: 100 },
          { date: '2025-01-16', metrics: { LCP: 2100, FID: 80 }, sampleCount: 120 },
        ],
        webVitals: [
          {
            metricName: 'LCP',
            count: 500,
            average: 2200,
            median: 2100,
            p75: 2500,
            p95: 3000,
            p99: 3500,
            goodCount: 350,
            needsImprovementCount: 100,
            poorCount: 50,
            goodPercent: 70.0,
          },
        ],
        sync: {
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
        },
        cache: {
          totalCaches: 0,
          totalSize: 0,
          hitRate: 0,
          cacheBreakdown: [],
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.performanceService.getAggregatedMetrics as jest.Mock).mockResolvedValue(
        mockAggregatedData
      );

      const request = new NextRequest('http://localhost:3000/api/performance');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.metrics).toBeDefined();
      expect(data.metrics.summary.avgLCP).toBe(2200);
      expect(data.metrics.byConnection).toHaveLength(3);
      expect(data.metrics.byDevice).toHaveLength(3);
      expect(data.metrics.timeline).toHaveLength(2);
      expect(container.performanceService.getAggregatedMetrics).toHaveBeenCalledWith(7, undefined);
    });

    it('should accept days query parameter', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-123',
          badge: 'ADMIN-001',
          role: 'Admin',
          roleLevel: 2,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.performanceService.getAggregatedMetrics as jest.Mock).mockResolvedValue({
        summary: {},
        byConnection: [],
        byDevice: [],
        timeline: [],
        webVitals: [],
        sync: {},
        cache: {},
      });

      const request = new NextRequest('http://localhost:3000/api/performance?days=30');

      // Act
      await GET(request);

      // Assert
      expect(container.performanceService.getAggregatedMetrics).toHaveBeenCalledWith(30, undefined);
    });

    it('should accept metric filter query parameter', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-123',
          badge: 'ADMIN-001',
          role: 'Admin',
          roleLevel: 2,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.performanceService.getAggregatedMetrics as jest.Mock).mockResolvedValue({
        summary: {},
        byConnection: [],
        byDevice: [],
        timeline: [],
        webVitals: [],
        sync: {},
        cache: {},
      });

      const request = new NextRequest('http://localhost:3000/api/performance?metric=LCP');

      // Act
      await GET(request);

      // Assert
      expect(container.performanceService.getAggregatedMetrics).toHaveBeenCalledWith(7, 'LCP');
    });

    it('should return 401 for unauthenticated users', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/performance');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.performanceService.getAggregatedMetrics).not.toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'officer-123',
          badge: 'SA-00001',
          role: 'Officer',
          roleLevel: 4,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/performance');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
      expect(container.performanceService.getAggregatedMetrics).not.toHaveBeenCalled();
    });
  });
});
