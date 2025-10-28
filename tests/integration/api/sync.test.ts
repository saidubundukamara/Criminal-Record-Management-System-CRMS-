/**
 * Sync API Integration Tests
 *
 * Tests the Next.js API routes for offline sync operations
 */
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/sync/route';
import { getServerSession } from 'next-auth';
import { container } from '@/src/di/container';
import { mockSession, mockAdminSession, mockViewerSession } from '../../helpers/auth.helper';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock DI container
jest.mock('@/src/di/container', () => ({
  container: {
    syncService: {
      processPendingSync: jest.fn(),
      retryFailedSync: jest.fn(),
      getSyncStats: jest.fn(),
      cleanupOldEntries: jest.fn(),
    },
  },
}));

describe('Sync API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sync', () => {
    it('should process pending sync entries', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.syncService.processPendingSync as jest.Mock).mockResolvedValue({
        success: true,
        synced: 5,
        failed: 0,
        errors: [],
      });

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.synced).toBe(5);
      expect(data.failed).toBe(0);
      expect(data.message).toBe('Successfully synced 5 entries');
      expect(container.syncService.processPendingSync).toHaveBeenCalledWith(undefined);
    });

    it('should process pending sync with limit', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.syncService.processPendingSync as jest.Mock).mockResolvedValue({
        success: true,
        synced: 10,
        failed: 0,
        errors: [],
      });

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'POST',
        body: JSON.stringify({ limit: 10 }),
      });

      // Act
      const response = await POST(request);
      await response.json();

      // Assert
      expect(container.syncService.processPendingSync).toHaveBeenCalledWith(10);
    });

    it('should retry failed sync entries when requested', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.syncService.retryFailedSync as jest.Mock).mockResolvedValue({
        success: true,
        synced: 3,
        failed: 0,
        errors: [],
      });

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'POST',
        body: JSON.stringify({ retryFailed: true }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.synced).toBe(3);
      expect(container.syncService.retryFailedSync).toHaveBeenCalledWith(undefined);
      expect(container.syncService.processPendingSync).not.toHaveBeenCalled();
    });

    it('should return partial success when some entries fail', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.syncService.processPendingSync as jest.Mock).mockResolvedValue({
        success: false,
        synced: 3,
        failed: 2,
        errors: [
          { entryId: 'sync-1', error: 'Invalid payload' },
          { entryId: 'sync-2', error: 'Network error' },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.synced).toBe(3);
      expect(data.failed).toBe(2);
      expect(data.errors).toHaveLength(2);
      expect(data.message).toBe('Synced 3 entries with 2 failures');
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.syncService.processPendingSync).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks permissions', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockViewerSession);

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
      expect(container.syncService.processPendingSync).not.toHaveBeenCalled();
    });

    it('should handle malformed request body gracefully', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.syncService.processPendingSync as jest.Mock).mockResolvedValue({
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      });

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'POST',
        body: 'invalid-json',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(container.syncService.processPendingSync).toHaveBeenCalled();
    });

    it('should return 500 on internal error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.syncService.processPendingSync as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Database connection failed');
    });
  });

  describe('GET /api/sync', () => {
    it('should return sync statistics', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.syncService.getSyncStats as jest.Mock).mockResolvedValue({
        pending: 10,
        failed: 2,
        lastSyncAt: new Date('2025-01-20T10:00:00Z'),
      });

      const request = new NextRequest('http://localhost:3000/api/sync');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.stats.pending).toBe(10);
      expect(data.stats.failed).toBe(2);
      expect(data.stats.lastSyncAt).toBe('2025-01-20T10:00:00.000Z');
      expect(data.stats.isOnline).toBe(true);
      expect(container.syncService.getSyncStats).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/sync');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.syncService.getSyncStats).not.toHaveBeenCalled();
    });

    it('should return 500 on internal error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (container.syncService.getSyncStats as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/sync');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/sync', () => {
    it('should cleanup old sync entries', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (container.syncService.cleanupOldEntries as jest.Mock).mockResolvedValue(15);

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Cleaned up 15 old sync entries');
      expect(data.deletedCount).toBe(15);
      expect(container.syncService.cleanupOldEntries).toHaveBeenCalledWith(7);
    });

    it('should cleanup with custom days parameter', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (container.syncService.cleanupOldEntries as jest.Mock).mockResolvedValue(20);

      const request = new NextRequest(
        'http://localhost:3000/api/sync?olderThanDays=30',
        {
          method: 'DELETE',
        }
      );

      // Act
      const response = await DELETE(request);
      await response.json();

      // Assert
      expect(container.syncService.cleanupOldEntries).toHaveBeenCalledWith(30);
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(container.syncService.cleanupOldEntries).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockSession); // Regular officer

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
      expect(container.syncService.cleanupOldEntries).not.toHaveBeenCalled();
    });

    it('should return 500 on internal error', async () => {
      // Arrange
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      (container.syncService.cleanupOldEntries as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/sync', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
