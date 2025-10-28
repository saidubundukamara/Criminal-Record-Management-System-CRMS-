/**
 * Cases API Integration Tests
 *
 * Tests the Next.js API routes for case management
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cases/route';
import { getServerSession } from 'next-auth';
import { container } from '@/src/di/container';
import { mockSession } from '../../helpers/auth.helper';
import { mockCase } from '../../fixtures/test-data';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock DI container
jest.mock('@/src/di/container', () => ({
  container: {
    caseService: {
      listCases: jest.fn(),
      createCase: jest.fn(),
    },
  },
}));

describe('Cases API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cases', () => {
    it('should return cases for authenticated user', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.listCases as jest.Mock).mockResolvedValue([mockCase]);

      const request = new NextRequest('http://localhost:3000/api/cases');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.cases).toHaveLength(1);
      expect(data.count).toBe(1);
      expect(container.caseService.listCases).toHaveBeenCalledWith(
        expect.objectContaining({
          stationId: 'station-hq',
        }),
        'officer-123'
      );
    });

    it('should filter cases by status', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.listCases as jest.Mock).mockResolvedValue([mockCase]);

      const request = new NextRequest('http://localhost:3000/api/cases?status=open');

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      expect(container.caseService.listCases).toHaveBeenCalledWith(
        expect.objectContaining({
          stationId: 'station-hq',
          status: 'open',
        }),
        'officer-123'
      );
    });

    it('should filter cases by search term', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.listCases as jest.Mock).mockResolvedValue([mockCase]);

      const request = new NextRequest('http://localhost:3000/api/cases?search=theft');

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      expect(container.caseService.listCases).toHaveBeenCalledWith(
        expect.objectContaining({
          stationId: 'station-hq',
          search: 'theft',
        }),
        'officer-123'
      );
    });

    it('should apply pagination', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.listCases as jest.Mock).mockResolvedValue([mockCase]);

      const request = new NextRequest('http://localhost:3000/api/cases?limit=10&offset=20');

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      expect(container.caseService.listCases).toHaveBeenCalledWith(
        expect.objectContaining({
          stationId: 'station-hq',
          limit: 10,
          offset: 20,
        }),
        'officer-123'
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cases');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.caseService.listCases).not.toHaveBeenCalled();
    });

    it('should return 500 on internal error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.listCases as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/cases');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/cases', () => {
    it('should create a case for authenticated user', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.createCase as jest.Mock).mockResolvedValue(mockCase);

      const requestBody = {
        title: 'New Theft Case',
        description: 'A laptop was stolen',
        category: 'theft',
        severity: 'minor',
        incidentDate: '2025-01-20T10:00:00Z',
        location: 'Freetown',
      };

      const request = new NextRequest('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.case).toBeDefined();
      expect(data.case.id).toBe(mockCase.id);
      expect(data.case.caseNumber).toBe(mockCase.caseNumber);
      expect(data.case.title).toBe(mockCase.title);
      expect(container.caseService.createCase).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Theft Case',
          description: 'A laptop was stolen',
          category: 'theft',
          severity: 'minor',
          stationId: 'station-hq',
          officerId: 'officer-123',
        }),
        'officer-123',
        undefined
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.caseService.createCase).not.toHaveBeenCalled();
    });

    it('should return 400 on validation error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const ValidationError = require('@/src/lib/errors').ValidationError;
      (container.caseService.createCase as jest.Mock).mockRejectedValue(
        new ValidationError('Case title must be at least 5 characters')
      );

      const request = new NextRequest('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({ title: 'abc' }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Case title must be at least 5 characters');
    });

    it('should return 500 on internal error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.createCase as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Case' }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
