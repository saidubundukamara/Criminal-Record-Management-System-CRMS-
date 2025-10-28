/**
 * Authentication Domain Types
 *
 * Types specific to authentication and authorization.
 */
import { PermissionResource, PermissionAction, PermissionScope } from "../entities/Permission";

/**
 * User session information
 * Extended by NextAuth to include CRMS-specific fields
 */
export interface UserSession {
  id: string;
  badge: string;
  name: string;
  email: string | null;
  role: string;
  roleLevel: number;
  stationId: string;
  stationName: string;
  permissions: SessionPermission[];
}

/**
 * Permission information stored in session
 */
export interface SessionPermission {
  resource: PermissionResource;
  action: PermissionAction;
  scope: PermissionScope;
}

/**
 * Authentication credentials
 */
export interface AuthCredentials {
  badge: string;
  pin: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  officer?: {
    id: string;
    badge: string;
    name: string;
    role: string;
    stationId: string;
  };
  error?: string;
  requiresMFA?: boolean;
}

/**
 * MFA verification request
 */
export interface MFAVerification {
  officerId: string;
  code: string;
}

/**
 * PIN change request
 */
export interface PINChangeRequest {
  officerId: string;
  oldPin: string;
  newPin: string;
}

/**
 * PIN reset request (admin-initiated)
 */
export interface PINResetRequest {
  officerId: string;
  newPin: string;
  resetById: string; // Admin who performed reset
}
