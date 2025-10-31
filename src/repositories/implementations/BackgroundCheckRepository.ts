/**
 * BackgroundCheck Repository Implementation
 *
 * Implements IBackgroundCheckRepository with Prisma ORM
 * Handles background check storage, NIN lookups, and certificate management
 *
 * Pan-African Design: Country-agnostic NIN field works with any national ID system
 */

import { BaseRepository } from "../base/BaseRepository";
import {
  IBackgroundCheckRepository,
  CreateBackgroundCheckDto,
  UpdateBackgroundCheckDto,
  BackgroundCheckFilters,
  BackgroundCheckStatistics,
} from "@/src/domain/interfaces/repositories/IBackgroundCheckRepository";
import {
  BackgroundCheck,
  BackgroundCheckStatus,
  BackgroundCheckRequestType,
  BackgroundCheckResult,
} from "@/src/domain/entities/BackgroundCheck";
import { Prisma } from "@prisma/client";

/**
 * BackgroundCheckRepository implementation using Prisma
 */
export class BackgroundCheckRepository
  extends BaseRepository
  implements IBackgroundCheckRepository
{
  /**
   * Map Prisma BackgroundCheck to domain entity
   */
  private toDomain(data: any): BackgroundCheck {
    return new BackgroundCheck(
      data.id,
      data.nin,
      data.requestedById,
      data.requestType as BackgroundCheckRequestType,
      data.result as BackgroundCheckResult,
      data.status as BackgroundCheckStatus,
      data.issuedAt ? new Date(data.issuedAt) : null,
      data.expiresAt ? new Date(data.expiresAt) : null,
      data.certificateUrl,
      data.phoneNumber,
      data.ipAddress,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(
    filters?: BackgroundCheckFilters
  ): Prisma.BackgroundCheckWhereInput {
    if (!filters) return {};

    const where: any = {};

    if (filters.nin) {
      where.nin = filters.nin;
    }

    if (filters.requestedById !== undefined) {
      where.requestedById = filters.requestedById;
    }

    if (filters.requestType) {
      where.requestType = filters.requestType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.phoneNumber) {
      where.phoneNumber = filters.phoneNumber;
    }

    if (filters.hasRecord !== undefined) {
      where.result = {
        path: ["status"],
        equals: filters.hasRecord ? "record_found" : "clear",
      };
    }

    if (filters.fromDate) {
      where.createdAt = { gte: filters.fromDate };
    }

    if (filters.toDate) {
      where.createdAt = { ...where.createdAt, lte: filters.toDate };
    }

    if (filters.isExpired !== undefined) {
      const now = new Date();
      if (filters.isExpired) {
        where.expiresAt = { lt: now };
      } else {
        where.OR = [{ expiresAt: null }, { expiresAt: { gte: now } }];
      }
    }

    return where;
  }

  /**
   * Find background check by ID
   */
  async findById(id: string): Promise<BackgroundCheck | null> {
    return this.execute(async () => {
      const data = await this.prisma.backgroundCheck.findUnique({
        where: { id },
      });

      return data ? this.toDomain(data) : null;
    }, "findById");
  }

  /**
   * Find all background checks matching filters
   */
  async findAll(
    filters?: BackgroundCheckFilters,
    limit = 100,
    offset = 0
  ): Promise<BackgroundCheck[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      const data = await this.prisma.backgroundCheck.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findAll");
  }

  /**
   * Find background checks by NIN
   */
  async findByNIN(nin: string, limit = 50): Promise<BackgroundCheck[]> {
    return this.execute(async () => {
      const data = await this.prisma.backgroundCheck.findMany({
        where: { nin },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByNIN");
  }

  /**
   * Find most recent background check for a NIN
   */
  async findMostRecentByNIN(nin: string): Promise<BackgroundCheck | null> {
    return this.execute(async () => {
      const data = await this.prisma.backgroundCheck.findFirst({
        where: { nin },
        orderBy: { createdAt: "desc" },
      });

      return data ? this.toDomain(data) : null;
    }, "findMostRecentByNIN");
  }

  /**
   * Find background checks requested by officer
   */
  async findByOfficer(
    officerId: string,
    limit = 100,
    offset = 0
  ): Promise<BackgroundCheck[]> {
    return this.execute(async () => {
      const data = await this.prisma.backgroundCheck.findMany({
        where: { requestedById: officerId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByOfficer");
  }

  /**
   * Find background checks by phone number (USSD requests)
   */
  async findByPhoneNumber(
    phoneNumber: string,
    limit = 50
  ): Promise<BackgroundCheck[]> {
    return this.execute(async () => {
      const data = await this.prisma.backgroundCheck.findMany({
        where: { phoneNumber },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByPhoneNumber");
  }

  /**
   * Find expired background checks
   */
  async findExpired(limit = 100): Promise<BackgroundCheck[]> {
    return this.execute(async () => {
      const now = new Date();

      const data = await this.prisma.backgroundCheck.findMany({
        where: {
          expiresAt: { lt: now },
          status: "completed",
        },
        take: limit,
        orderBy: { expiresAt: "asc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findExpired");
  }

  /**
   * Find background checks expiring soon (within days)
   */
  async findExpiringSoon(
    withinDays = 7,
    limit = 100
  ): Promise<BackgroundCheck[]> {
    return this.execute(async () => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + withinDays);

      const data = await this.prisma.backgroundCheck.findMany({
        where: {
          expiresAt: {
            gte: now,
            lte: futureDate,
          },
          status: "completed",
        },
        take: limit,
        orderBy: { expiresAt: "asc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findExpiringSoon");
  }

  /**
   * Find background checks with criminal records
   */
  async findWithRecords(
    limit = 100,
    offset = 0
  ): Promise<BackgroundCheck[]> {
    return this.execute(async () => {
      const data = await this.prisma.backgroundCheck.findMany({
        where: {
          result: {
            path: ["status"],
            equals: "record_found",
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findWithRecords");
  }

  /**
   * Create new background check
   */
  async create(data: CreateBackgroundCheckDto): Promise<BackgroundCheck> {
    return this.execute(async () => {
      const created = await this.prisma.backgroundCheck.create({
        data: {
          nin: data.nin,
          requestedById: data.requestedById,
          requestType: data.requestType,
          result: data.result as any,
          status: data.status,
          issuedAt: data.issuedAt || null,
          expiresAt: data.expiresAt || null,
          certificateUrl: data.certificateUrl || null,
          phoneNumber: data.phoneNumber || null,
          ipAddress: data.ipAddress || null,
        },
      });

      return this.toDomain(created);
    }, "create");
  }

  /**
   * Update background check
   */
  async update(
    id: string,
    data: UpdateBackgroundCheckDto
  ): Promise<BackgroundCheck> {
    return this.execute(async () => {
      const updated = await this.prisma.backgroundCheck.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.result && { result: data.result as any }),
          ...(data.issuedAt !== undefined && { issuedAt: data.issuedAt }),
          ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
          ...(data.certificateUrl !== undefined && {
            certificateUrl: data.certificateUrl,
          }),
        },
      });

      return this.toDomain(updated);
    }, "update");
  }

  /**
   * Update status
   */
  async updateStatus(
    id: string,
    status: BackgroundCheckStatus
  ): Promise<BackgroundCheck> {
    return this.execute(async () => {
      const updated = await this.prisma.backgroundCheck.update({
        where: { id },
        data: { status },
      });

      return this.toDomain(updated);
    }, "updateStatus");
  }

  /**
   * Update certificate URL
   */
  async updateCertificate(
    id: string,
    certificateUrl: string
  ): Promise<BackgroundCheck> {
    return this.execute(async () => {
      const updated = await this.prisma.backgroundCheck.update({
        where: { id },
        data: {
          certificateUrl,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      });

      return this.toDomain(updated);
    }, "updateCertificate");
  }

  /**
   * Delete background check
   */
  async delete(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.backgroundCheck.delete({
        where: { id },
      });
    }, "delete");
  }

  /**
   * Count background checks matching filters
   */
  async count(filters?: BackgroundCheckFilters): Promise<number> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      return await this.prisma.backgroundCheck.count({ where });
    }, "count");
  }

  /**
   * Get statistics
   */
  async getStatistics(
    fromDate?: Date,
    toDate?: Date
  ): Promise<BackgroundCheckStatistics> {
    return this.execute(async () => {
      const where: any = {};

      if (fromDate) {
        where.createdAt = { gte: fromDate };
      }

      if (toDate) {
        where.createdAt = { ...where.createdAt, lte: toDate };
      }

      // Get total and counts by status
      const [total, byStatus, byRequestType] = await Promise.all([
        this.prisma.backgroundCheck.count({ where }),
        this.prisma.backgroundCheck.groupBy({
          by: ["status"],
          where,
          _count: true,
        }),
        this.prisma.backgroundCheck.groupBy({
          by: ["requestType"],
          where,
          _count: true,
        }),
      ]);

      // Count with records vs clear
      const withRecords = await this.prisma.backgroundCheck.count({
        where: {
          ...where,
          result: {
            path: ["status"],
            equals: "record_found",
          },
        },
      });

      const clear = await this.prisma.backgroundCheck.count({
        where: {
          ...where,
          result: {
            path: ["status"],
            equals: "clear",
          },
        },
      });

      // Count expired
      const now = new Date();
      const expired = await this.prisma.backgroundCheck.count({
        where: {
          ...where,
          expiresAt: { lt: now },
        },
      });

      // Count last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const last30Days = await this.prisma.backgroundCheck.count({
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Build status counts
      const statusCounts: Record<BackgroundCheckStatus, number> = {
        pending: 0,
        completed: 0,
        failed: 0,
      };

      byStatus.forEach((item) => {
        statusCounts[item.status as BackgroundCheckStatus] = item._count;
      });

      // Build request type counts
      const requestTypeCounts: Record<BackgroundCheckRequestType, number> = {
        officer: 0,
        citizen: 0,
        employer: 0,
        visa: 0,
      };

      byRequestType.forEach((item) => {
        requestTypeCounts[item.requestType as BackgroundCheckRequestType] =
          item._count;
      });

      return {
        total,
        byStatus: statusCounts,
        byRequestType: requestTypeCounts,
        withRecords,
        clear,
        pending: statusCounts.pending,
        failed: statusCounts.failed,
        expired,
        last30Days,
      };
    }, "getStatistics");
  }

  /**
   * Check if NIN has been checked recently (within hours)
   */
  async hasRecentCheck(nin: string, withinHours = 24): Promise<boolean> {
    return this.execute(async () => {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - withinHours);

      const count = await this.prisma.backgroundCheck.count({
        where: {
          nin,
          status: "completed",
          createdAt: { gte: cutoffDate },
        },
      });

      return count > 0;
    }, "hasRecentCheck");
  }

  /**
   * Get check history for a NIN (for audit trail)
   */
  async getCheckHistory(nin: string, limit = 50): Promise<BackgroundCheck[]> {
    return this.execute(async () => {
      const data = await this.prisma.backgroundCheck.findMany({
        where: { nin },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "getCheckHistory");
  }
}
