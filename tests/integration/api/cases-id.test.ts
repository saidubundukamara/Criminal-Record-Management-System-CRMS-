/**
 * Individual Case API Integration Tests
 *
 * Tests the Next.js API routes for individual case operations
 */
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/cases/[id]/route';
import { getServerSession } from 'next-auth';
import { container } from '@/src/di/container';
import { mockSession } from '../../helpers/auth.helper';
import { mockCase } from '../../fixtures/test-data';
import { NotFoundError, ForbiddenError, ValidationError } from '@/src/lib/errors';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock DI container
jest.mock('@/src/di/container', () => ({
  container: {
    caseService: {
      getCaseById: jest.fn(),
      updateCase: jest.fn(),
      deleteCase: jest.fn(),
    },
  },
}));

describe('Individual Case API Routes', () => {
  const mockContext = {
    params: Promise.resolve({ id: 'case-123' }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cases/[id]', () => {
    it('should return case by ID', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.getCaseById as jest.Mock).mockResolvedValue(mockCase);

      const request = new NextRequest('http://localhost:3000/api/cases/case-123');

      // Act
      const response = await GET(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.case).toBeDefined();
      expect(data.case.id).toBe(mockCase.id);
      expect(data.case.caseNumber).toBe(mockCase.caseNumber);
      expect(data.case.title).toBe(mockCase.title);
      expect(container.caseService.getCaseById).toHaveBeenCalledWith(
        'case-123',
        'officer-123',
        true
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cases/case-123');

      // Act
      const response = await GET(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.caseService.getCaseById).not.toHaveBeenCalled();
    });

    it('should return 404 when case not found', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.getCaseById as jest.Mock).mockRejectedValue(
        new NotFoundError('Case not found')
      );

      const request = new NextRequest('http://localhost:3000/api/cases/invalid-id');

      // Act
      const response = await GET(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('Case not found');
    });

    it('should return 500 on internal error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.getCaseById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/cases/case-123');

      // Act
      const response = await GET(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PATCH /api/cases/[id]', () => {
    it('should update case successfully', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      const updatedCase = { ...mockCase, title: 'Updated Title' };
      (container.caseService.updateCase as jest.Mock).mockResolvedValue(updatedCase);

      const requestBody = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const request = new NextRequest('http://localhost:3000/api/cases/case-123', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await PATCH(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.case.title).toBe('Updated Title');
      expect(container.caseService.updateCase).toHaveBeenCalledWith(
        'case-123',
        expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated description',
        }),
        'officer-123',
        undefined
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cases/case-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Test' }),
      });

      // Act
      const response = await PATCH(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.caseService.updateCase).not.toHaveBeenCalled();
    });

    it('should return 404 when case not found', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.updateCase as jest.Mock).mockRejectedValue(
        new NotFoundError('Case not found')
      );

      const request = new NextRequest('http://localhost:3000/api/cases/invalid-id', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Test' }),
      });

      // Act
      const response = await PATCH(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('Case not found');
    });

    it('should return 400 on validation error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.updateCase as jest.Mock).mockRejectedValue(
        new ValidationError('Case title must be at least 5 characters')
      );

      const request = new NextRequest('http://localhost:3000/api/cases/case-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'abc' }),
      });

      // Act
      const response = await PATCH(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Case title must be at least 5 characters');
    });

    it('should return 403 when forbidden', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.updateCase as jest.Mock).mockRejectedValue(
        new ForbiddenError('Cannot update a closed case')
      );

      const request = new NextRequest('http://localhost:3000/api/cases/case-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Test' }),
      });

      // Act
      const response = await PATCH(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe('Cannot update a closed case');
    });

    it('should return 500 on internal error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.updateCase as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/cases/case-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Test' }),
      });

      // Act
      const response = await PATCH(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/cases/[id]', () => {
    it('should delete case successfully', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.deleteCase as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/cases/case-123', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Case deleted successfully');
      expect(container.caseService.deleteCase).toHaveBeenCalledWith(
        'case-123',
        'officer-123',
        undefined,
        undefined
      );
    });

    it('should delete case with reason', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.deleteCase as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/cases/case-123?reason=Duplicate+entry',
        {
          method: 'DELETE',
        }
      );

      // Act
      const response = await DELETE(request, mockContext);
      await response.json();

      // Assert
      expect(container.caseService.deleteCase).toHaveBeenCalledWith(
        'case-123',
        'officer-123',
        'Duplicate entry',
        undefined
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cases/case-123', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.caseService.deleteCase).not.toHaveBeenCalled();
    });

    it('should return 404 when case not found', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.deleteCase as jest.Mock).mockRejectedValue(
        new NotFoundError('Case not found')
      );

      const request = new NextRequest('http://localhost:3000/api/cases/invalid-id', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('Case not found');
    });

    it('should return 403 when forbidden', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.deleteCase as jest.Mock).mockRejectedValue(
        new ForbiddenError('Cannot delete case in court status')
      );

      const request = new NextRequest('http://localhost:3000/api/cases/case-123', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe('Cannot delete case in court status');
    });

    it('should return 500 on internal error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.caseService.deleteCase as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/cases/case-123', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
