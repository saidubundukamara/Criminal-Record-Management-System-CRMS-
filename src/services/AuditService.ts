/**
 * Audit Service
 *
 * Provides convenient methods for creating audit logs throughout the application.
 * Wraps AuditLogRepository with business-friendly methods.
 *
 * Pan-African Design: Comprehensive audit trail for accountability across all countries
 */
import {
  IAuditLogRepository,
  AuditLog,
  CreateAuditLogDto,
  AuditLogFilters,
} from "@/src/domain/interfaces/repositories/IAuditLogRepository";

export interface LogActionParams {
  entityType: string;
  entityId?: string;
  officerId?: string;
  action: string;
  success?: boolean;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  stationId?: string;
}

export class AuditService {
  constructor(private readonly auditRepo: IAuditLogRepository) {}

  /**
   * Generic method to log any action
   * Most flexible - use for custom scenarios
   */
  async logAction(params: LogActionParams): Promise<AuditLog> {
    return await this.auditRepo.create({
      entityType: params.entityType,
      entityId: params.entityId,
      officerId: params.officerId,
      action: params.action,
      success: params.success ?? true,
      details: params.details ?? {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      stationId: params.stationId,
    });
  }

  /**
   * Log a successful login
   */
  async logLogin(
    officerId: string,
    badge: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType: "officer",
      entityId: officerId,
      officerId,
      action: "login",
      success: true,
      details: { badge },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a failed login attempt
   */
  async logLoginFailure(
    officerId: string | null,
    badge: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType: "officer",
      entityId: officerId || undefined,
      officerId: officerId || undefined,
      action: "login",
      success: false,
      details: { badge, reason },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a logout
   */
  async logLogout(
    officerId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType: "officer",
      entityId: officerId,
      officerId,
      action: "logout",
      success: true,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a CREATE operation
   */
  async logCreate(
    entityType: string,
    entityId: string,
    officerId: string,
    details?: Record<string, any>,
    stationId?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType,
      entityId,
      officerId,
      action: "create",
      success: true,
      details,
      stationId,
    });
  }

  /**
   * Log an UPDATE operation
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    officerId: string,
    details?: Record<string, any>,
    stationId?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType,
      entityId,
      officerId,
      action: "update",
      success: true,
      details,
      stationId,
    });
  }

  /**
   * Log a DELETE operation
   */
  async logDelete(
    entityType: string,
    entityId: string,
    officerId: string,
    details?: Record<string, any>,
    stationId?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType,
      entityId,
      officerId,
      action: "delete",
      success: true,
      details,
      stationId,
    });
  }

  /**
   * Log a READ operation (for sensitive data access)
   */
  async logRead(
    entityType: string,
    entityId: string,
    officerId: string,
    details?: Record<string, any>,
    stationId?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType,
      entityId,
      officerId,
      action: "read",
      success: true,
      details,
      stationId,
    });
  }

  /**
   * Log an EXPORT operation
   */
  async logExport(
    entityType: string,
    officerId: string,
    details?: Record<string, any>,
    stationId?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType,
      officerId,
      action: "export",
      success: true,
      details,
      stationId,
    });
  }

  /**
   * Log a permission change
   */
  async logPermissionChange(
    targetOfficerId: string,
    adminId: string,
    action: string,
    details: Record<string, any>
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType: "officer",
      entityId: targetOfficerId,
      officerId: adminId,
      action,
      success: true,
      details,
    });
  }

  /**
   * Log a PIN change
   */
  async logPinChange(
    officerId: string,
    success: boolean,
    reason?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType: "officer",
      entityId: officerId,
      officerId,
      action: "pin_change",
      success,
      details: reason ? { reason } : {},
    });
  }

  /**
   * Log a PIN reset (admin-initiated)
   */
  async logPinReset(
    targetOfficerId: string,
    adminId: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType: "officer",
      entityId: targetOfficerId,
      officerId: adminId,
      action: "pin_reset",
      success: true,
      details: { targetOfficerId },
    });
  }

  /**
   * Log an account lock
   */
  async logAccountLock(
    officerId: string,
    badge: string,
    failedAttempts: number,
    lockedUntil: Date,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return await this.logAction({
      entityType: "officer",
      entityId: officerId,
      officerId,
      action: "account_locked",
      success: true,
      details: {
        badge,
        failedAttempts,
        lockedUntil: lockedUntil.toISOString(),
        reason: "Too many failed login attempts",
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a failed operation with error details
   */
  async logFailure(
    entityType: string,
    entityId: string | undefined,
    officerId: string | undefined,
    action: string,
    error: Error | string,
    details?: Record<string, any>
  ): Promise<AuditLog> {
    const errorMessage = typeof error === "string" ? error : error.message;

    return await this.logAction({
      entityType,
      entityId,
      officerId,
      action,
      success: false,
      details: {
        ...details,
        error: errorMessage,
      },
    });
  }

  /**
   * Get audit logs by entity
   */
  async getByEntity(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    return await this.auditRepo.findByEntityId(entityType, entityId);
  }

  /**
   * Get audit logs by officer
   */
  async getByOfficer(
    officerId: string,
    filters?: AuditLogFilters
  ): Promise<AuditLog[]> {
    return await this.auditRepo.findByOfficerId(officerId, filters);
  }

  /**
   * Get recent audit logs with optional filters
   */
  async getRecent(
    filters?: AuditLogFilters,
    limit: number = 100
  ): Promise<AuditLog[]> {
    return await this.auditRepo.findAll(filters, limit);
  }

  /**
   * Count audit logs matching filters
   */
  async count(filters?: AuditLogFilters): Promise<number> {
    return await this.auditRepo.count(filters);
  }

  /**
   * Get audit logs for a specific action
   */
  async getByAction(
    action: string,
    filters?: Omit<AuditLogFilters, "action">,
    limit: number = 100
  ): Promise<AuditLog[]> {
    return await this.auditRepo.findAll({ ...filters, action }, limit);
  }

  /**
   * Get failed operations for analysis
   */
  async getFailedOperations(
    filters?: Omit<AuditLogFilters, "success">,
    limit: number = 100
  ): Promise<AuditLog[]> {
    return await this.auditRepo.findAll({ ...filters, success: false }, limit);
  }

  /**
   * Get audit trail for a date range
   */
  async getByDateRange(
    fromDate: Date,
    toDate: Date,
    filters?: Omit<AuditLogFilters, "fromDate" | "toDate">,
    limit: number = 100
  ): Promise<AuditLog[]> {
    return await this.auditRepo.findAll(
      { ...filters, fromDate, toDate },
      limit
    );
  }

  /**
   * Get login history for an officer
   */
  async getLoginHistory(
    officerId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    return await this.auditRepo.findByOfficerId(officerId, {
      action: "login",
    });
  }

  /**
   * Get security events (logins, lockouts, PIN changes)
   */
  async getSecurityEvents(
    officerId?: string,
    limit: number = 100
  ): Promise<AuditLog[]> {
    const securityActions = [
      "login",
      "logout",
      "pin_change",
      "pin_reset",
      "account_locked",
      "mfa_enabled",
      "mfa_disabled",
    ];

    if (officerId) {
      const allEvents: AuditLog[] = [];
      for (const action of securityActions) {
        const events = await this.auditRepo.findByOfficerId(officerId, {
          action,
        });
        allEvents.push(...events);
      }
      // Sort by date descending
      allEvents.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      return allEvents.slice(0, limit);
    } else {
      // Get all security events across system
      const allEvents: AuditLog[] = [];
      for (const action of securityActions) {
        const events = await this.auditRepo.findAll({ action }, limit);
        allEvents.push(...events);
      }
      // Sort by date descending
      allEvents.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      return allEvents.slice(0, limit);
    }
  }

  /**
   * Create multiple audit logs at once
   * Useful for batch operations
   */
  async logMany(params: LogActionParams[]): Promise<AuditLog[]> {
    const dtos: CreateAuditLogDto[] = params.map((p) => ({
      entityType: p.entityType,
      entityId: p.entityId,
      officerId: p.officerId,
      action: p.action,
      success: p.success ?? true,
      details: p.details ?? {},
      ipAddress: p.ipAddress,
      userAgent: p.userAgent,
      stationId: p.stationId,
    }));

    return await this.auditRepo.createMany(dtos);
  }
}
