/**
 * Officer Productivity API Integration Tests
 *
 * Tests /api/analytics/officer-productivity endpoint
 * Phase 8: Dashboards & Reporting
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/officer-productivity/route';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock container
jest.mock('@/src/di/container', () => ({
  container: {
    analyticsService: {
      getOfficerProductivity: jest.fn(),
    },
  },
}));

import { container } from '@/src/di/container';

describe('/api/analytics/officer-productivity', () => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/officer-productivity', () => {
    it('should return officer productivity metrics for authenticated user', async () => {
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

      const mockMetrics = {
        officerId: 'officer-123',
        officerBadge: 'SA-00001',
        officerName: 'John Doe',
        stationId: 'station-hq',
        stationName: 'Headquarters',
        metrics: {
          totalCases: 25,
          activeCases: 10,
          closedCases: 15,
          casesThisWeek: 5,
          casesThisMonth: 12,
          evidenceCollected: 30,
          backgroundChecksPerformed: 8,
          ussdQueriesThisWeek: 15,
          averageResolutionDays: 14.5,
          casesByCategory: [
            { category: 'theft', count: 10 },
            { category: 'assault', count: 8 },
          ],
          activityTimeline: [
            { date: '2025-01-15', count: 3 },
            { date: '2025-01-16', count: 2 },
          ],
        },
        rankings: {
          stationRank: 3,
          totalOfficersInStation: 20,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.analyticsService.getOfficerProductivity as jest.Mock).mockResolvedValue(mockMetrics);

      const request = new NextRequest('http://localhost:3000/api/analytics/officer-productivity');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.metrics).toBeDefined();
      expect(data.metrics.officerId).toBe('officer-123');
      expect(data.metrics.metrics.totalCases).toBe(25);
      expect(container.analyticsService.getOfficerProductivity).toHaveBeenCalledWith(
        'officer-123',
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should accept custom date range query parameters', async () => {
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
      (container.analyticsService.getOfficerProductivity as jest.Mock).mockResolvedValue({
        officerId: 'officer-123',
        metrics: {},
      });

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/officer-productivity?startDate=2025-01-01&endDate=2025-01-31'
      );

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(container.analyticsService.getOfficerProductivity).toHaveBeenCalledWith(
        'officer-123',
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/analytics/officer-productivity');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.analyticsService.getOfficerProductivity).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
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
      (container.analyticsService.getOfficerProductivity as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/analytics/officer-productivity');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should allow station commanders to query their station officers', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'commander-123',
          badge: 'SC-00001',
          role: 'StationCommander',
          roleLevel: 3,
          stationId: 'station-hq',
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      (container.analyticsService.getOfficerProductivity as jest.Mock).mockResolvedValue({
        officerId: 'officer-456',
        metrics: {},
      });

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/officer-productivity?officerId=officer-456'
      );

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(container.analyticsService.getOfficerProductivity).toHaveBeenCalledWith(
        'officer-456',
        expect.any(Date),
        expect.any(Date)
      );
    });
  });
});
