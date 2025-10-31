/**
 * AmberAlert Repository Implementation
 *
 * Implements IAmberAlertRepository with Prisma ORM
 * Handles missing children alert storage, status management, and broadcasting
 *
 * Pan-African Design: Country-agnostic alert management for all African children
 */

import { BaseRepository } from "../base/BaseRepository";
import {
  IAmberAlertRepository,
  CreateAmberAlertDto,
  UpdateAmberAlertDto,
  AmberAlertFilters,
  AmberAlertStatistics,
} from "@/src/domain/interfaces/repositories/IAmberAlertRepository";
import {
  AmberAlert,
  AmberAlertStatus,
  Gender,
} from "@/src/domain/entities/AmberAlert";
import { Prisma } from "@prisma/client";

/**
 * AmberAlertRepository implementation using Prisma
 */
export class AmberAlertRepository
  extends BaseRepository
  implements IAmberAlertRepository
{
  /**
   * Map Prisma AmberAlert to domain entity
   */
  private toDomain(data: any): AmberAlert {
    return new AmberAlert(
      data.id,
      data.personName,
      data.age,
      data.gender as Gender | null,
      data.description,
      data.photoUrl,
      data.lastSeenLocation,
      data.lastSeenDate ? new Date(data.lastSeenDate) : null,
      data.contactPhone,
      data.status as AmberAlertStatus,
      data.publishedAt ? new Date(data.publishedAt) : null,
      data.expiresAt ? new Date(data.expiresAt) : null,
      data.createdById,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(
    filters?: AmberAlertFilters
  ): Prisma.AmberAlertWhereInput {
    if (!filters) return {};

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.gender !== undefined) {
      where.gender = filters.gender;
    }

    if (filters.minAge !== undefined) {
      where.age = { gte: filters.minAge };
    }

    if (filters.maxAge !== undefined) {
      where.age = { ...where.age, lte: filters.maxAge };
    }

    if (filters.fromDate) {
      where.createdAt = { gte: filters.fromDate };
    }

    if (filters.toDate) {
      where.createdAt = { ...where.createdAt, lte: filters.toDate };
    }

    if (filters.isActive !== undefined) {
      if (filters.isActive) {
        const now = new Date();
        where.status = "active";
        where.OR = [{ expiresAt: null }, { expiresAt: { gte: now } }];
      } else {
        where.status = { not: "active" };
      }
    }

    if (filters.isExpired !== undefined) {
      const now = new Date();
      if (filters.isExpired) {
        where.expiresAt = { lt: now };
      } else {
        where.OR = [{ expiresAt: null }, { expiresAt: { gte: now } }];
      }
    }

    if (filters.urgencyLevel) {
      // Filter by urgency level based on days missing
      const now = new Date();

      if (filters.urgencyLevel === "critical") {
        // 0-2 days missing
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        where.lastSeenDate = { gte: twoDaysAgo };
      } else if (filters.urgencyLevel === "high") {
        // 3-7 days missing
        const sevenDaysAgo = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        where.lastSeenDate = { gte: sevenDaysAgo, lt: twoDaysAgo };
      } else if (filters.urgencyLevel === "medium") {
        // 8+ days missing
        const sevenDaysAgo = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        where.lastSeenDate = { lt: sevenDaysAgo };
      }
    }

    return where;
  }

  /**
   * Find Amber Alert by ID
   */
  async findById(id: string): Promise<AmberAlert | null> {
    return this.execute(async () => {
      const data = await this.prisma.amberAlert.findUnique({
        where: { id },
      });

      return data ? this.toDomain(data) : null;
    }, "findById");
  }

  /**
   * Find all Amber Alerts matching filters
   */
  async findAll(
    filters?: AmberAlertFilters,
    limit = 100,
    offset = 0
  ): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      const data = await this.prisma.amberAlert.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findAll");
  }

  /**
   * Find active alerts (not expired, status = active)
   */
  async findActive(limit = 100): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const now = new Date();

      const data = await this.prisma.amberAlert.findMany({
        where: {
          status: "active",
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        },
        take: limit,
        orderBy: { publishedAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findActive");
  }

  /**
   * Find alerts by status
   */
  async findByStatus(
    status: AmberAlertStatus,
    limit = 100,
    offset = 0
  ): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const data = await this.prisma.amberAlert.findMany({
        where: { status },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByStatus");
  }

  /**
   * Find alerts created by officer
   */
  async findByOfficer(
    officerId: string,
    limit = 100,
    offset = 0
  ): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const data = await this.prisma.amberAlert.findMany({
        where: { createdById: officerId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByOfficer");
  }

  /**
   * Find expired alerts
   */
  async findExpired(limit = 100): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const now = new Date();

      const data = await this.prisma.amberAlert.findMany({
        where: {
          expiresAt: { lt: now },
          status: "active",
        },
        take: limit,
        orderBy: { expiresAt: "asc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findExpired");
  }

  /**
   * Find alerts expiring soon (within days)
   */
  async findExpiringSoon(
    withinDays = 3,
    limit = 100
  ): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + withinDays);

      const data = await this.prisma.amberAlert.findMany({
        where: {
          expiresAt: {
            gte: now,
            lte: futureDate,
          },
          status: "active",
        },
        take: limit,
        orderBy: { expiresAt: "asc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findExpiringSoon");
  }

  /**
   * Find critical/urgent alerts (first 48 hours)
   */
  async findCritical(limit = 50): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const data = await this.prisma.amberAlert.findMany({
        where: {
          status: "active",
          lastSeenDate: { gte: twoDaysAgo },
        },
        take: limit,
        orderBy: { lastSeenDate: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findCritical");
  }

  /**
   * Find recently resolved alerts (found in last N days)
   */
  async findRecentlyResolved(
    withinDays = 30,
    limit = 100
  ): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - withinDays);

      const data = await this.prisma.amberAlert.findMany({
        where: {
          status: "found",
          updatedAt: { gte: cutoffDate },
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findRecentlyResolved");
  }

  /**
   * Search alerts by name (fuzzy search)
   */
  async searchByName(name: string, limit = 50): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const data = await this.prisma.amberAlert.findMany({
        where: {
          personName: { contains: name, mode: "insensitive" },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "searchByName");
  }

  /**
   * Create new Amber Alert
   */
  async create(data: CreateAmberAlertDto): Promise<AmberAlert> {
    return this.execute(async () => {
      const created = await this.prisma.amberAlert.create({
        data: {
          personName: data.personName,
          age: data.age,
          gender: data.gender,
          description: data.description,
          photoUrl: data.photoUrl || null,
          lastSeenLocation: data.lastSeenLocation || null,
          lastSeenDate: data.lastSeenDate || null,
          contactPhone: data.contactPhone,
          status: data.status || "active",
          publishedAt: data.publishedAt || null,
          expiresAt: data.expiresAt || null,
          createdById: data.createdById,
        },
      });

      return this.toDomain(created);
    }, "create");
  }

  /**
   * Update Amber Alert
   */
  async update(id: string, data: UpdateAmberAlertDto): Promise<AmberAlert> {
    return this.execute(async () => {
      const updated = await this.prisma.amberAlert.update({
        where: { id },
        data: {
          ...(data.personName && { personName: data.personName }),
          ...(data.age !== undefined && { age: data.age }),
          ...(data.gender !== undefined && { gender: data.gender }),
          ...(data.description && { description: data.description }),
          ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
          ...(data.lastSeenLocation !== undefined && {
            lastSeenLocation: data.lastSeenLocation,
          }),
          ...(data.lastSeenDate !== undefined && {
            lastSeenDate: data.lastSeenDate,
          }),
          ...(data.contactPhone && { contactPhone: data.contactPhone }),
        },
      });

      return this.toDomain(updated);
    }, "update");
  }

  /**
   * Update alert status
   */
  async updateStatus(
    id: string,
    status: AmberAlertStatus
  ): Promise<AmberAlert> {
    return this.execute(async () => {
      const updated = await this.prisma.amberAlert.update({
        where: { id },
        data: { status },
      });

      return this.toDomain(updated);
    }, "updateStatus");
  }

  /**
   * Publish/activate an alert
   */
  async publishAlert(id: string): Promise<AmberAlert> {
    return this.execute(async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const updated = await this.prisma.amberAlert.update({
        where: { id },
        data: {
          status: "active",
          publishedAt: now,
          expiresAt,
        },
      });

      return this.toDomain(updated);
    }, "publishAlert");
  }

  /**
   * Resolve alert (mark as found)
   */
  async resolveAlert(id: string): Promise<AmberAlert> {
    return this.execute(async () => {
      const updated = await this.prisma.amberAlert.update({
        where: { id },
        data: { status: "found" },
      });

      return this.toDomain(updated);
    }, "resolveAlert");
  }

  /**
   * Expire alert
   */
  async expireAlert(id: string): Promise<AmberAlert> {
    return this.execute(async () => {
      const updated = await this.prisma.amberAlert.update({
        where: { id },
        data: { status: "expired" },
      });

      return this.toDomain(updated);
    }, "expireAlert");
  }

  /**
   * Delete Amber Alert
   */
  async delete(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.amberAlert.delete({
        where: { id },
      });
    }, "delete");
  }

  /**
   * Count alerts matching filters
   */
  async count(filters?: AmberAlertFilters): Promise<number> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      return await this.prisma.amberAlert.count({ where });
    }, "count");
  }

  /**
   * Get statistics
   */
  async getStatistics(
    fromDate?: Date,
    toDate?: Date
  ): Promise<AmberAlertStatistics> {
    return this.execute(async () => {
      const where: any = {};

      if (fromDate) {
        where.createdAt = { gte: fromDate };
      }

      if (toDate) {
        where.createdAt = { ...where.createdAt, lte: toDate };
      }

      // Get total and counts by status
      const [total, active, found, expired] = await Promise.all([
        this.prisma.amberAlert.count({ where }),
        this.prisma.amberAlert.count({ where: { ...where, status: "active" } }),
        this.prisma.amberAlert.count({ where: { ...where, status: "found" } }),
        this.prisma.amberAlert.count({
          where: { ...where, status: "expired" },
        }),
      ]);

      // Count last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const last30Days = await this.prisma.amberAlert.count({
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Count by urgency (based on last seen date)
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [critical, high, medium] = await Promise.all([
        this.prisma.amberAlert.count({
          where: { ...where, lastSeenDate: { gte: twoDaysAgo } },
        }),
        this.prisma.amberAlert.count({
          where: {
            ...where,
            lastSeenDate: { gte: sevenDaysAgo, lt: twoDaysAgo },
          },
        }),
        this.prisma.amberAlert.count({
          where: { ...where, lastSeenDate: { lt: sevenDaysAgo } },
        }),
      ]);

      // Calculate average days to resolution for found alerts
      const foundAlerts = await this.prisma.amberAlert.findMany({
        where: { ...where, status: "found" },
        select: {
          publishedAt: true,
          updatedAt: true,
        },
      });

      let averageDaysToResolution: number | null = null;

      if (foundAlerts.length > 0) {
        const totalDays = foundAlerts.reduce((sum, alert) => {
          if (alert.publishedAt) {
            const days =
              (alert.updatedAt.getTime() - alert.publishedAt.getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + days;
          }
          return sum;
        }, 0);

        averageDaysToResolution = Math.round(totalDays / foundAlerts.length);
      }

      return {
        total,
        active,
        found,
        expired,
        last30Days,
        byUrgency: {
          critical,
          high,
          medium,
        },
        averageDaysToResolution,
      };
    }, "getStatistics");
  }

  /**
   * Get alerts that should be auto-expired
   */
  async findShouldAutoExpire(maxDaysActive = 30): Promise<AmberAlert[]> {
    return this.execute(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxDaysActive);

      const data = await this.prisma.amberAlert.findMany({
        where: {
          status: "active",
          publishedAt: { lte: cutoffDate },
        },
        orderBy: { publishedAt: "asc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findShouldAutoExpire");
  }

  /**
   * Bulk expire alerts
   */
  async bulkExpire(ids: string[]): Promise<number> {
    return this.execute(async () => {
      const result = await this.prisma.amberAlert.updateMany({
        where: { id: { in: ids } },
        data: { status: "expired" },
      });

      return result.count;
    }, "bulkExpire");
  }
}
