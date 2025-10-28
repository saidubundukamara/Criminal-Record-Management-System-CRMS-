/**
 * Audit Log Repository Interface
 *
 * Contract for audit log data access operations.
 * Audit logs are immutable - no update or delete operations.
 */

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string | null;
  officerId: string | null;
  action: string;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  stationId: string | null;
  success: boolean;
  createdAt: Date;
}

export interface CreateAuditLogDto {
  entityType: string;
  entityId?: string;
  officerId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  stationId?: string;
  success?: boolean;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  officerId?: string;
  action?: string;
  success?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

export interface IAuditLogRepository {
  // Queries
  findById(id: string): Promise<AuditLog | null>;
  findByEntityId(entityType: string, entityId: string): Promise<AuditLog[]>;
  findByOfficerId(officerId: string, filters?: AuditLogFilters): Promise<AuditLog[]>;
  findAll(filters?: AuditLogFilters, limit?: number): Promise<AuditLog[]>;
  count(filters?: AuditLogFilters): Promise<number>;

  // Commands (create only - logs are immutable)
  create(data: CreateAuditLogDto): Promise<AuditLog>;

  // Bulk operations
  createMany(data: CreateAuditLogDto[]): Promise<AuditLog[]>;
}
