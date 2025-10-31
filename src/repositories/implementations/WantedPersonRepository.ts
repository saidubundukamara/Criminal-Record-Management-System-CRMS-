/**
 * WantedPerson Repository Implementation
 *
 * Implements IWantedPersonRepository with Prisma ORM
 * Handles wanted persons storage, warrant management, and regional alerts
 *
 * Pan-African Design: Country-agnostic wanted persons with cross-border support
 */

import { BaseRepository } from "../base/BaseRepository";
import {
  IWantedPersonRepository,
  CreateWantedPersonDto,
  UpdateWantedPersonDto,
  WantedPersonFilters,
  WantedPersonStatistics,
  WantedPersonWithPerson,
} from "@/src/domain/interfaces/repositories/IWantedPersonRepository";
import {
  WantedPerson,
  WantedPersonStatus,
  DangerLevel,
  CriminalCharge,
} from "@/src/domain/entities/WantedPerson";
import { Prisma } from "@prisma/client";

/**
 * Type for Prisma WantedPerson with Person relations
 */
type PrismaWantedPersonWithPerson = Prisma.WantedPersonGetPayload<{
  include: {
    person: true;
  };
}>;

/**
 * WantedPersonRepository implementation using Prisma
 */
export class WantedPersonRepository
  extends BaseRepository
  implements IWantedPersonRepository
{
  /**
   * Map Prisma WantedPerson to domain entity
   */
  private toDomain(data: any): WantedPerson {
    return new WantedPerson(
      data.id,
      data.personId,
      data.personName,
      data.nin,
      data.charges as CriminalCharge[],
      data.dangerLevel as DangerLevel,
      data.status as WantedPersonStatus,
      data.warrantNumber,
      new Date(data.createdAt),
      data.expiresAt ? new Date(data.expiresAt) : null,
      data.lastSeenLocation,
      data.lastSeenDate ? new Date(data.lastSeenDate) : null,
      data.physicalDescription,
      data.photoUrl,
      data.reward,
      data.contactPhone,
      data.isRegionalAlert,
      data.createdById,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  /**
   * Map Prisma WantedPerson with Person to domain entity with person details
   */
  private toWithPerson(
    data: PrismaWantedPersonWithPerson
  ): WantedPersonWithPerson {
    const wantedPerson = this.toDomain(data);

    if (!data.person) {
      throw new Error("Person data is required for WantedPersonWithPerson");
    }

    return {
      wantedPerson,
      person: {
        id: data.person.id,
        firstName: data.person.firstName,
        lastName: data.person.lastName,
        middleName: data.person.middleName,
        nin: data.person.nationalId,
        dateOfBirth: data.person.dob
          ? new Date(data.person.dob)
          : null,
        gender: data.person.gender,
        nationality: data.person.nationality,
      },
    };
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(
    filters?: WantedPersonFilters
  ): Prisma.WantedPersonWhereInput {
    if (!filters) return {};

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dangerLevel) {
      where.dangerLevel = filters.dangerLevel;
    }

    if (filters.personId) {
      where.personId = filters.personId;
    }

    if (filters.nin) {
      where.nin = filters.nin;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.isRegionalAlert !== undefined) {
      where.isRegionalAlert = filters.isRegionalAlert;
    }

    if (filters.warrantNumber) {
      where.warrantNumber = filters.warrantNumber;
    }

    if (filters.hasReward !== undefined) {
      if (filters.hasReward) {
        where.reward = { not: null, gt: 0 };
      } else {
        where.OR = [{ reward: null }, { reward: 0 }];
      }
    }

    if (filters.minReward !== undefined) {
      where.reward = { gte: filters.minReward };
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

    if (filters.chargeCategory) {
      where.charges = {
        array_contains: [{ category: filters.chargeCategory }],
      };
    }

    if (filters.chargeSeverity) {
      where.charges = {
        array_contains: [{ severity: filters.chargeSeverity }],
      };
    }

    return where;
  }

  /**
   * Find Wanted Person by ID
   */
  async findById(id: string): Promise<WantedPerson | null> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findUnique({
        where: { id },
      });

      return data ? this.toDomain(data) : null;
    }, "findById");
  }

  /**
   * Find Wanted Person with Person details
   */
  async findByIdWithPerson(id: string): Promise<WantedPersonWithPerson | null> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findUnique({
        where: { id },
        include: {
          person: true,
        },
      });

      return data ? this.toWithPerson(data) : null;
    }, "findByIdWithPerson");
  }

  /**
   * Find all Wanted Persons matching filters
   */
  async findAll(
    filters?: WantedPersonFilters,
    limit = 100,
    offset = 0
  ): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      const data = await this.prisma.wantedPerson.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findAll");
  }

  /**
   * Find active wanted persons (status = active, not expired)
   */
  async findActive(limit = 100): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const now = new Date();

      const data = await this.prisma.wantedPerson.findMany({
        where: {
          status: "active",
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findActive");
  }

  /**
   * Find by status
   */
  async findByStatus(
    status: WantedPersonStatus,
    limit = 100,
    offset = 0
  ): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findMany({
        where: { status },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByStatus");
  }

  /**
   * Find by danger level
   */
  async findByDangerLevel(
    dangerLevel: DangerLevel,
    limit = 100
  ): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findMany({
        where: { dangerLevel },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByDangerLevel");
  }

  /**
   * Find by Person ID
   */
  async findByPersonId(personId: string): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findMany({
        where: { personId },
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByPersonId");
  }

  /**
   * Find by NIN
   */
  async findByNIN(nin: string): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findMany({
        where: {
          person: {
            nationalId: nin,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findByNIN");
  }

  /**
   * Find by warrant number
   */
  async findByWarrantNumber(warrantNumber: string): Promise<WantedPerson | null> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findUnique({
        where: { warrantNumber },
      });

      return data ? this.toDomain(data) : null;
    }, "findByWarrantNumber");
  }

  /**
   * Find regional alerts (cross-border)
   */
  async findRegionalAlerts(limit = 100): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findMany({
        where: {
          regionalAlert: true,
          status: "active",
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findRegionalAlerts");
  }

  /**
   * Find wanted persons with rewards
   */
  async findWithRewards(limit = 100): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findMany({
        where: {
          reward: { not: null, gt: 0 },
          status: "active",
        },
        take: limit,
        orderBy: { reward: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findWithRewards");
  }

  /**
   * Find expired wanted persons (by status)
   */
  async findExpired(limit = 100): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findMany({
        where: {
          status: "expired",
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findExpired");
  }

  /**
   * Find wanted persons expiring soon (within days)
   * Note: WantedPerson doesn't have expiration, so this returns empty
   */
  async findExpiringSoon(
    withinDays = 30,
    limit = 100
  ): Promise<WantedPerson[]> {
    // Wanted persons don't expire automatically - they must be manually updated to "expired" status
    return []
  }

  /**
   * Find recently captured (within days)
   */
  async findRecentlyCaptured(
    withinDays = 30,
    limit = 100
  ): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - withinDays);

      const data = await this.prisma.wantedPerson.findMany({
        where: {
          status: "captured",
          updatedAt: { gte: cutoffDate },
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findRecentlyCaptured");
  }

  /**
   * Find high priority (sorted by priority score)
   * Note: This uses domain entity method for sorting, not database
   */
  async findHighPriority(limit = 50): Promise<WantedPerson[]> {
    return this.execute(async () => {
      // Fetch active wanted persons
      const data = await this.prisma.wantedPerson.findMany({
        where: { status: "active" },
        take: limit * 2, // Fetch more to sort
      });

      // Convert to domain entities and sort by priority score
      const wantedPersons = data.map((d) => this.toDomain(d));
      wantedPersons.sort((a, b) => b.getPriorityScore() - a.getPriorityScore());

      return wantedPersons.slice(0, limit);
    }, "findHighPriority");
  }

  /**
   * Search by name (fuzzy search)
   */
  async searchByName(name: string, limit = 50): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const data = await this.prisma.wantedPerson.findMany({
        where: {
          name: { contains: name, mode: "insensitive" },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "searchByName");
  }

  /**
   * Create new Wanted Person
   */
  async create(data: CreateWantedPersonDto): Promise<WantedPerson> {
    return this.execute(async () => {
      const created = await this.prisma.wantedPerson.create({
        data: {
          personId: data.personId,
          name: data.personName,
          aliases: [],
          charges: data.charges as any,
          dangerLevel: data.dangerLevel,
          status: data.status || "active",
          warrantNumber: data.warrantNumber || null,
          lastSeenLocation: data.lastSeenLocation || null,
          lastSeenDate: data.lastSeenDate || null,
          description: data.physicalDescription || null,
          photoUrl: data.photoUrl || null,
          reward: data.rewardAmount || null,
          regionalAlert: data.isRegionalAlert || false,
          priority: 50,
          publishedAt: new Date(),
          createdById: data.createdById,
        },
      });

      return this.toDomain(created);
    }, "create");
  }

  /**
   * Update Wanted Person
   */
  async update(
    id: string,
    data: UpdateWantedPersonDto
  ): Promise<WantedPerson> {
    return this.execute(async () => {
      const updated = await this.prisma.wantedPerson.update({
        where: { id },
        data: {
          ...(data.charges && { charges: data.charges as any }),
          ...(data.dangerLevel && { dangerLevel: data.dangerLevel }),
          ...(data.lastSeenLocation !== undefined && {
            lastSeenLocation: data.lastSeenLocation,
          }),
          ...(data.lastSeenDate !== undefined && {
            lastSeenDate: data.lastSeenDate,
          }),
          ...(data.physicalDescription && {
            description: data.physicalDescription,
          }),
          ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
          ...(data.rewardAmount !== undefined && {
            reward: data.rewardAmount,
          }),
          ...(data.isRegionalAlert !== undefined && {
            regionalAlert: data.isRegionalAlert,
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
    status: WantedPersonStatus
  ): Promise<WantedPerson> {
    return this.execute(async () => {
      const updated = await this.prisma.wantedPerson.update({
        where: { id },
        data: { status },
      });

      return this.toDomain(updated);
    }, "updateStatus");
  }

  /**
   * Mark as captured
   */
  async markCaptured(id: string): Promise<WantedPerson> {
    return this.execute(async () => {
      const updated = await this.prisma.wantedPerson.update({
        where: { id },
        data: { status: "captured" },
      });

      return this.toDomain(updated);
    }, "markCaptured");
  }

  /**
   * Expire warrant
   */
  async expireWarrant(id: string): Promise<WantedPerson> {
    return this.execute(async () => {
      const updated = await this.prisma.wantedPerson.update({
        where: { id },
        data: { status: "expired" },
      });

      return this.toDomain(updated);
    }, "expireWarrant");
  }

  /**
   * Update last seen information
   */
  async updateLastSeen(
    id: string,
    location: string,
    date: Date
  ): Promise<WantedPerson> {
    return this.execute(async () => {
      const updated = await this.prisma.wantedPerson.update({
        where: { id },
        data: {
          lastSeenLocation: location,
          lastSeenDate: date,
        },
      });

      return this.toDomain(updated);
    }, "updateLastSeen");
  }

  /**
   * Delete Wanted Person
   */
  async delete(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.wantedPerson.delete({
        where: { id },
      });
    }, "delete");
  }

  /**
   * Count wanted persons matching filters
   */
  async count(filters?: WantedPersonFilters): Promise<number> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      return await this.prisma.wantedPerson.count({ where });
    }, "count");
  }

  /**
   * Get statistics
   */
  async getStatistics(
    fromDate?: Date,
    toDate?: Date
  ): Promise<WantedPersonStatistics> {
    return this.execute(async () => {
      const where: any = {};

      if (fromDate) {
        where.createdAt = { gte: fromDate };
      }

      if (toDate) {
        where.createdAt = { ...where.createdAt, lte: toDate };
      }

      // Get total and counts by status
      const [total, active, captured, expired] = await Promise.all([
        this.prisma.wantedPerson.count({ where }),
        this.prisma.wantedPerson.count({ where: { ...where, status: "active" } }),
        this.prisma.wantedPerson.count({
          where: { ...where, status: "captured" },
        }),
        this.prisma.wantedPerson.count({
          where: { ...where, status: "expired" },
        }),
      ]);

      // Count by danger level
      const [extreme, high, medium, low] = await Promise.all([
        this.prisma.wantedPerson.count({
          where: { ...where, dangerLevel: "extreme" },
        }),
        this.prisma.wantedPerson.count({
          where: { ...where, dangerLevel: "high" },
        }),
        this.prisma.wantedPerson.count({
          where: { ...where, dangerLevel: "medium" },
        }),
        this.prisma.wantedPerson.count({
          where: { ...where, dangerLevel: "low" },
        }),
      ]);

      // Count with rewards and regional alerts
      const [withRewards, regionalAlerts] = await Promise.all([
        this.prisma.wantedPerson.count({
          where: { ...where, reward: { not: null, gt: 0 } },
        }),
        this.prisma.wantedPerson.count({
          where: { ...where, isRegionalAlert: true },
        }),
      ]);

      // Count last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const last30Days = await this.prisma.wantedPerson.count({
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Calculate average days to capture
      const capturedPersons = await this.prisma.wantedPerson.findMany({
        where: { ...where, status: "captured" },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      });

      let averageDaysToCapture: number | null = null;

      if (capturedPersons.length > 0) {
        const totalDays = capturedPersons.reduce((sum, wp) => {
          const days =
            (wp.updatedAt.getTime() - wp.createdAt.getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);

        averageDaysToCapture = Math.round(totalDays / capturedPersons.length);
      }

      // Calculate total reward amount
      const rewardSum = await this.prisma.wantedPerson.aggregate({
        where: { ...where, reward: { not: null } },
        _sum: {
          reward: true,
        },
      });

      return {
        total,
        active,
        captured,
        expired,
        byDangerLevel: {
          extreme,
          high,
          medium,
          low,
        },
        withRewards,
        regionalAlerts,
        last30Days,
        averageDaysToCapture,
        totalRewardAmount: rewardSum._sum.reward ? Number(rewardSum._sum.reward) : 0,
      };
    }, "getStatistics");
  }

  /**
   * Get wanted persons that should be auto-expired
   */
  async findShouldAutoExpire(maxDaysActive = 365): Promise<WantedPerson[]> {
    return this.execute(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxDaysActive);

      const data = await this.prisma.wantedPerson.findMany({
        where: {
          status: "active",
          createdAt: { lte: cutoffDate },
        },
        orderBy: { createdAt: "asc" },
      });

      return data.map((d) => this.toDomain(d));
    }, "findShouldAutoExpire");
  }

  /**
   * Bulk expire warrants
   */
  async bulkExpire(ids: string[]): Promise<number> {
    return this.execute(async () => {
      const result = await this.prisma.wantedPerson.updateMany({
        where: { id: { in: ids } },
        data: { status: "expired" },
      });

      return result.count;
    }, "bulkExpire");
  }

  /**
   * Check if person is wanted (by Person ID)
   */
  async isPersonWanted(personId: string): Promise<boolean> {
    return this.execute(async () => {
      const count = await this.prisma.wantedPerson.count({
        where: {
          personId,
          status: "active",
        },
      });

      return count > 0;
    }, "isPersonWanted");
  }

  /**
   * Get active wanted count for Person
   */
  async getActiveWantedCount(personId: string): Promise<number> {
    return this.execute(async () => {
      return await this.prisma.wantedPerson.count({
        where: {
          personId,
          status: "active",
        },
      });
    }, "getActiveWantedCount");
  }
}
