/**
 * Audit Log Repository Implementation
 *
 * Handles all database operations for audit logs.
 * Audit logs are immutable - no update or delete operations.
 *
 * Pan-African Design: Comprehensive audit trail for accountability across all countries
 */
import { PrismaClient, AuditLog as PrismaAuditLog } from "@prisma/client";
import {
  IAuditLogRepository,
  AuditLog,
  CreateAuditLogDto,
  AuditLogFilters,
} from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { BaseRepository } from "../base/BaseRepository";

export class AuditLogRepository extends BaseRepository implements IAuditLogRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.execute(async () => {
      const log = await this.prisma.auditLog.findUnique({
        where: { id },
      });

      return log ? this.toDomain(log) : null;
    }, "findById");
  }

  async findByEntityId(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.execute(async () => {
      const logs = await this.prisma.auditLog.findMany({
        where: {
          entityType,
          entityId,
        },
        orderBy: { createdAt: "desc" },
      });

      return logs.map((log) => this.toDomain(log));
    }, "findByEntityId");
  }

  async findByOfficerId(officerId: string, filters?: AuditLogFilters): Promise<AuditLog[]> {
    return this.execute(async () => {
      const where = {
        officerId,
        ...this.buildWhereClause(filters),
      };

      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100, // Limit for performance
      });

      return logs.map((log) => this.toDomain(log));
    }, "findByOfficerId");
  }

  async findAll(filters?: AuditLogFilters, limit: number = 100): Promise<AuditLog[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return logs.map((log) => this.toDomain(log));
    }, "findAll");
  }

  async count(filters?: AuditLogFilters): Promise<number> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);
      return await this.prisma.auditLog.count({ where });
    }, "count");
  }

  async create(data: CreateAuditLogDto): Promise<AuditLog> {
    return this.execute(async () => {
      const log = await this.prisma.auditLog.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          officerId: data.officerId,
          action: data.action,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          stationId: data.stationId,
          success: data.success ?? true,
        },
      });

      return this.toDomain(log);
    }, "create");
  }

  async createMany(data: CreateAuditLogDto[]): Promise<AuditLog[]> {
    return this.execute(async () => {
      const logs: AuditLog[] = [];

      for (const item of data) {
        const log = await this.create(item);
        logs.push(log);
      }

      return logs;
    }, "createMany");
  }

  private buildWhereClause(filters?: AuditLogFilters): any {
    if (!filters) return {};

    const where: any = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.officerId) {
      where.officerId = filters.officerId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.success !== undefined) {
      where.success = filters.success;
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    return where;
  }

  private toDomain(data: PrismaAuditLog): AuditLog {
    return {
      id: data.id,
      entityType: data.entityType,
      entityId: data.entityId,
      officerId: data.officerId,
      action: data.action,
      details: data.details as Record<string, any>,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      stationId: data.stationId,
      success: data.success,
      createdAt: data.createdAt,
    };
  }
}
