/**
 * Authentication Test Helpers
 *
 * Mock sessions and permissions for testing
 */

// Mock session for authenticated user
export const mockSession = {
  user: {
    id: 'officer-123',
    badge: 'SA-00001',
    name: 'Test Officer',
    email: 'test@crms.gov.sl',
    role: 'Officer',
    roleId: 'role-officer',
    stationId: 'station-hq',
    permissions: [
      { resource: 'cases', action: 'create', scope: 'station' },
      { resource: 'cases', action: 'read', scope: 'station' },
      { resource: 'cases', action: 'update', scope: 'station' },
      { resource: 'persons', action: 'create', scope: 'station' },
      { resource: 'persons', action: 'read', scope: 'station' },
      { resource: 'persons', action: 'update', scope: 'station' },
      { resource: 'evidence', action: 'create', scope: 'station' },
      { resource: 'evidence', action: 'read', scope: 'station' },
      { resource: 'evidence', action: 'update', scope: 'station' },
    ],
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock session for admin user
export const mockAdminSession = {
  user: {
    id: 'admin-123',
    badge: 'SA-ADMIN',
    name: 'Admin Officer',
    email: 'admin@crms.gov.sl',
    role: 'Admin',
    roleId: 'role-admin',
    stationId: 'station-hq',
    permissions: [
      { resource: 'cases', action: 'create', scope: 'national' },
      { resource: 'cases', action: 'read', scope: 'national' },
      { resource: 'cases', action: 'update', scope: 'national' },
      { resource: 'cases', action: 'delete', scope: 'national' },
      { resource: 'persons', action: 'create', scope: 'national' },
      { resource: 'persons', action: 'read', scope: 'national' },
      { resource: 'persons', action: 'update', scope: 'national' },
      { resource: 'persons', action: 'delete', scope: 'national' },
      { resource: 'evidence', action: 'create', scope: 'national' },
      { resource: 'evidence', action: 'read', scope: 'national' },
      { resource: 'evidence', action: 'update', scope: 'national' },
      { resource: 'evidence', action: 'delete', scope: 'national' },
    ],
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock session with limited permissions
export const mockViewerSession = {
  user: {
    id: 'viewer-123',
    badge: 'SA-VIEWER',
    name: 'Viewer Officer',
    email: 'viewer@crms.gov.sl',
    role: 'Viewer',
    roleId: 'role-viewer',
    stationId: 'station-hq',
    permissions: [
      { resource: 'cases', action: 'read', scope: 'station' },
      { resource: 'persons', action: 'read', scope: 'station' },
      { resource: 'evidence', action: 'read', scope: 'station' },
    ],
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// No session (unauthenticated)
export const mockNoSession = null;

// Helper to create custom session
export function createMockSession(overrides: any = {}) {
  return {
    ...mockSession,
    user: {
      ...mockSession.user,
      ...overrides.user,
    },
    ...overrides,
  };
}
