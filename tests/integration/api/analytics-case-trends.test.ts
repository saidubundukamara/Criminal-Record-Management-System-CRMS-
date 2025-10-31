/**
 * Case Trends API Integration Tests
 *
 * Tests /api/analytics/case-trends endpoint
 * Phase 8: Dashboards & Reporting
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/case-trends/route';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock container
jest.mock('@/src/di/container', () => ({
  container: {
    analyticsService: {
      getCaseTrends: jest.fn(),
    },
  },
}));

import { container } from '@/src/di/container';

describe('/api/analytics/case-trends', () => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/case-trends', () => {
    it('should return case trends for authenticated user', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'officer-123',
          badge: 'SA-00001',
          role: 'Officer',
          roleLevel: 4,
          stationId: 'station-hq',
        },
      };

      const mockTrends = {
        dateRange: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        },
        timeline: [
          {
            date: '2025-01-15',
            open: 5,
            investigating: 10,
            charged: 3,
            court: 2,
            closed: 8,
            total: 28,
          },
        ],
        categoryBreakdown: [
          { category: 'theft', count: 15, percentageChange: 10.5 },
          { category: 'assault', count: 10, percentageChange: -5.2 },
        ],
        severityBreakdown: [
          { severity: 'minor', count: 12, percentageChange: 8.0 },
          { severity: 'major', count: 10, percentageChange: 5.5 },
          { severity: 'critical', count: 3, percentageChange: -2.0 },
        ],
        resolutionMetrics: {
          averageResolutionDays: 14.5,
          resolutionRate: 68.2,
          medianResolutionDays: 12.0,
          staleCases: 5,
        },
        topStations: [
          { stationId: 'station-hq', stationName: 'Headquarters', caseCount: 50 },
          { stationId: 'station-east', stationName: 'East District', caseCount: 35 },
        ],
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.analyticsService.getCaseTrends as jest.Mock).mockResolvedValue(mockTrends);

      const request = new NextRequest('http://localhost:3000/api/analytics/case-trends');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.trends).toBeDefined();
      expect(data.trends.timeline).toHaveLength(1);
      expect(data.trends.categoryBreakdown).toHaveLength(2);
      expect(data.trends.resolutionMetrics.resolutionRate).toBe(68.2);
    });

    it('should default to 90-day date range', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'officer-123',
          badge: 'SA-00001',
          role: 'Officer',
          roleLevel: 4,
          stationId: 'station-hq',
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.analyticsService.getCaseTrends as jest.Mock).mockResolvedValue({
        dateRange: { startDate: new Date(), endDate: new Date() },
        timeline: [],
        categoryBreakdown: [],
        severityBreakdown: [],
        resolutionMetrics: {},
        topStations: [],
      });

      const request = new NextRequest('http://localhost:3000/api/analytics/case-trends');

      // Act
      await GET(request);

      // Assert
      expect(container.analyticsService.getCaseTrends).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        'station-hq' // Officer can only see own station
      );
    });

    it('should accept custom date range', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'officer-123',
          badge: 'SA-00001',
          role: 'Officer',
          roleLevel: 4,
          stationId: 'station-hq',
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.analyticsService.getCaseTrends as jest.Mock).mockResolvedValue({
        dateRange: { startDate: new Date(), endDate: new Date() },
        timeline: [],
        categoryBreakdown: [],
        severityBreakdown: [],
        resolutionMetrics: {},
        topStations: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/case-trends?startDate=2025-01-01&endDate=2025-06-30'
      );

      // Act
      await GET(request);

      // Assert
      expect(container.analyticsService.getCaseTrends).toHaveBeenCalledWith(
        new Date('2025-01-01'),
        new Date('2025-06-30'),
        'station-hq'
      );
    });

    it('should allow admins to query all stations', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'admin-123',
          badge: 'ADMIN-001',
          role: 'Admin',
          roleLevel: 2,
          stationId: 'station-hq',
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.analyticsService.getCaseTrends as jest.Mock).mockResolvedValue({
        dateRange: { startDate: new Date(), endDate: new Date() },
        timeline: [],
        categoryBreakdown: [],
        severityBreakdown: [],
        resolutionMetrics: {},
        topStations: [],
      });

      const request = new NextRequest('http://localhost:3000/api/analytics/case-trends');

      // Act
      await GET(request);

      // Assert
      expect(container.analyticsService.getCaseTrends).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        undefined // No station filter for admins
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/analytics/case-trends');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.analyticsService.getCaseTrends).not.toHaveBeenCalled();
    });
  });
});
