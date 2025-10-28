/**
 * Permission Utilities
 *
 * Helper functions for checking permissions and access control.
 * Used throughout the application to enforce RBAC.
 *
 * Pan-African Design: Flexible permission system for different organizational structures
 */
import { Session } from "next-auth";
import { SessionUser } from "@/lib/auth";
import { ForbiddenError } from "@/src/lib/errors";
import {
  PermissionResource,
  PermissionAction,
  PermissionScope,
} from "@/src/domain/entities/Permission";

/**
 * Check if session user has a specific permission
 */
export function hasPermission(
  session: Session | null,
  resource: PermissionResource,
  action: PermissionAction,
  requiredScope: PermissionScope = "own"
): boolean {
  if (!session?.user) {
    return false;
  }

  const user = session.user;

  // SuperAdmin (level 1) has all permissions
  if (user.roleLevel === 1) {
    return true;
  }

  // Check if user has the specific permission
  const permission = user.permissions.find(
    (p) => p.resource === resource && p.action === action
  );

  if (!permission) {
    return false;
  }

  // Check if permission scope is sufficient
  return isScopeSufficient(permission.scope as PermissionScope, requiredScope);
}

/**
 * Require permission or throw ForbiddenError
 * Use this in API routes and server actions
 */
export function requirePermission(
  session: Session | null,
  resource: PermissionResource,
  action: PermissionAction,
  requiredScope: PermissionScope = "own"
): void {
  if (!hasPermission(session, resource, action, requiredScope)) {
    throw new ForbiddenError(
      `Insufficient permissions: ${resource}.${action} with ${requiredScope} scope required`
    );
  }
}

/**
 * Check if user has ANY of the listed permissions
 */
export function hasAnyPermission(
  session: Session | null,
  permissions: Array<{
    resource: PermissionResource;
    action: PermissionAction;
    scope?: PermissionScope;
  }>
): boolean {
  if (!session?.user) {
    return false;
  }

  // SuperAdmin has all permissions
  if (session.user.roleLevel === 1) {
    return true;
  }

  return permissions.some((p) =>
    hasPermission(session, p.resource, p.action, p.scope || "own")
  );
}

/**
 * Check if user has ALL of the listed permissions
 */
export function hasAllPermissions(
  session: Session | null,
  permissions: Array<{
    resource: PermissionResource;
    action: PermissionAction;
    scope?: PermissionScope;
  }>
): boolean {
  if (!session?.user) {
    return false;
  }

  // SuperAdmin has all permissions
  if (session.user.roleLevel === 1) {
    return true;
  }

  return permissions.every((p) =>
    hasPermission(session, p.resource, p.action, p.scope || "own")
  );
}

/**
 * Check if user has a specific role
 */
export function hasRole(
  session: Session | null,
  roleName: string
): boolean {
  if (!session?.user) {
    return false;
  }

  return session.user.roleName === roleName;
}

/**
 * Check if user has a role level at or below the specified level
 * Lower numbers = higher authority (1 = SuperAdmin, 6 = Viewer)
 */
export function hasRoleLevel(
  session: Session | null,
  maxLevel: number
): boolean {
  if (!session?.user) {
    return false;
  }

  return session.user.roleLevel <= maxLevel;
}

/**
 * Check if user is SuperAdmin
 */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.roleLevel === 1;
}

/**
 * Check if user is Admin or above
 */
export function isAdmin(session: Session | null): boolean {
  return hasRoleLevel(session, 2);
}

/**
 * Check if user is Station Commander or above
 */
export function isStationCommander(session: Session | null): boolean {
  return hasRoleLevel(session, 3);
}

/**
 * Check if one permission scope is sufficient for another
 * Hierarchy: own < station < region < national
 */
export function isScopeSufficient(
  userScope: PermissionScope,
  requiredScope: PermissionScope
): boolean {
  const scopeHierarchy: Record<PermissionScope, number> = {
    own: 1,
    station: 2,
    region: 3,
    national: 4,
  };

  return scopeHierarchy[userScope] >= scopeHierarchy[requiredScope];
}

/**
 * Check if user can access a specific station
 * Based on their permission scope and station assignment
 */
export function canAccessStation(
  session: Session | null,
  stationId: string,
  scope: PermissionScope
): boolean {
  if (!session?.user) {
    return false;
  }

  const user = session.user;

  // SuperAdmin can access all stations
  if (user.roleLevel === 1) {
    return true;
  }

  // National scope can access all stations
  if (scope === "national") {
    return true;
  }

  // Station scope can only access their own station
  if (scope === "station" || scope === "own") {
    return user.stationId === stationId;
  }

  // Region scope - would need region comparison
  // This requires additional data about station regions
  if (scope === "region") {
    // For now, allow if same station
    // TODO: Implement proper region checking when station regions are loaded
    return user.stationId === stationId;
  }

  return false;
}

/**
 * Check if user can access a specific officer's data
 * Based on permission scope and officer relationship
 */
export function canAccessOfficer(
  session: Session | null,
  targetOfficerId: string,
  targetStationId: string,
  scope: PermissionScope
): boolean {
  if (!session?.user) {
    return false;
  }

  const user = session.user;

  // SuperAdmin can access all officers
  if (user.roleLevel === 1) {
    return true;
  }

  // National scope can access all officers
  if (scope === "national") {
    return true;
  }

  // Own scope - can only access their own data
  if (scope === "own") {
    return user.id === targetOfficerId;
  }

  // Station scope - can access officers in their station
  if (scope === "station") {
    return user.stationId === targetStationId;
  }

  // Region scope - would need region comparison
  if (scope === "region") {
    // TODO: Implement proper region checking
    return user.stationId === targetStationId;
  }

  return false;
}

/**
 * Get the effective permission scope for a user on a resource
 * Returns the highest scope they have for the given resource and action
 */
export function getEffectiveScope(
  session: Session | null,
  resource: PermissionResource,
  action: PermissionAction
): PermissionScope | null {
  if (!session?.user) {
    return null;
  }

  const user = session.user;

  // SuperAdmin has national scope on everything
  if (user.roleLevel === 1) {
    return "national";
  }

  // Find the permission
  const permission = user.permissions.find(
    (p) => p.resource === resource && p.action === action
  );

  return permission ? (permission.scope as PermissionScope) : null;
}

/**
 * Build a Prisma where clause based on user's permission scope
 * Useful for filtering query results based on access level
 */
export function buildScopeFilter(
  session: Session | null,
  resource: PermissionResource,
  action: PermissionAction
): any {
  if (!session?.user) {
    return { id: null }; // Return nothing
  }

  const user = session.user;
  const scope = getEffectiveScope(session, resource, action);

  if (!scope) {
    return { id: null }; // No permission - return nothing
  }

  // SuperAdmin or national scope - no filter needed
  if (user.roleLevel === 1 || scope === "national") {
    return {};
  }

  // Station scope - filter by station
  if (scope === "station") {
    return { stationId: user.stationId };
  }

  // Own scope - filter by officer
  if (scope === "own") {
    // For resources owned by officers
    return { officerId: user.id };
  }

  // Region scope - would need region filter
  if (scope === "region") {
    // TODO: Implement region filtering
    return { stationId: user.stationId };
  }

  return { id: null };
}

/**
 * Check if user is active and can perform actions
 */
export function isActiveUser(session: Session | null): boolean {
  return session?.user?.active === true;
}

/**
 * Require active user or throw error
 */
export function requireActiveUser(session: Session | null): void {
  if (!isActiveUser(session)) {
    throw new ForbiddenError("Your account is inactive");
  }
}

/**
 * Get user's station ID
 */
export function getUserStationId(session: Session | null): string | null {
  return session?.user?.stationId || null;
}

/**
 * Get user's role level
 */
export function getUserRoleLevel(session: Session | null): number | null {
  return session?.user?.roleLevel || null;
}

/**
 * Check if user can manage officers
 * Requires admin level (role level <= 2)
 */
export function canManageOfficers(session: Session | null): boolean {
  return isAdmin(session);
}

/**
 * Check if user can manage stations
 * Requires admin level (role level <= 2)
 */
export function canManageStations(session: Session | null): boolean {
  return isAdmin(session);
}

/**
 * Check if user can manage roles and permissions
 * Requires SuperAdmin level (role level === 1)
 */
export function canManageRoles(session: Session | null): boolean {
  return isSuperAdmin(session);
}

/**
 * Check if user can view audit logs
 * Requires Station Commander level or above (role level <= 3)
 */
export function canViewAuditLogs(session: Session | null): boolean {
  return hasRoleLevel(session, 3);
}

/**
 * Check if user can export data
 * Requires specific export permission
 */
export function canExport(
  session: Session | null,
  resource: PermissionResource
): boolean {
  return hasPermission(session, resource, "export", "station");
}
