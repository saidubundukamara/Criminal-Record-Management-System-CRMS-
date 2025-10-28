/**
 * Officer Repository Implementation
 *
 * Handles all database operations for officers.
 * Maps Prisma models to Officer domain entities.
 *
 * Pan-African Design: Country-agnostic data access layer
 */
import { PrismaClient, Officer as PrismaOfficer } from "@prisma/client";
import {
  IOfficerRepository,
  CreateOfficerDto,
  UpdateOfficerDto,
  OfficerFilters,
} from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { Officer } from "@/src/domain/entities/Officer";
import { BaseRepository } from "../base/BaseRepository";

export class OfficerRepository extends BaseRepository implements IOfficerRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<Officer | null> {
    return this.execute(async () => {
      const officer = await this.prisma.officer.findUnique({
        where: { id },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return officer ? this.toDomain(officer) : null;
    }, "findById");
  }

  async findByBadge(badge: string): Promise<Officer | null> {
    return this.execute(async () => {
      const officer = await this.prisma.officer.findUnique({
        where: { badge },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return officer ? this.toDomain(officer) : null;
    }, "findByBadge");
  }

  async findByEmail(email: string): Promise<Officer | null> {
    return this.execute(async () => {
      const officer = await this.prisma.officer.findUnique({
        where: { email },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return officer ? this.toDomain(officer) : null;
    }, "findByEmail");
  }

  async findByStationId(stationId: string): Promise<Officer[]> {
    return this.execute(async () => {
      const officers = await this.prisma.officer.findMany({
        where: { stationId },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
        orderBy: { name: "asc" },
      });

      return officers.map((o) => this.toDomain(o));
    }, "findByStationId");
  }

  async findAll(filters?: OfficerFilters): Promise<Officer[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      const officers = await this.prisma.officer.findMany({
        where,
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
        orderBy: { name: "asc" },
      });

      return officers.map((o) => this.toDomain(o));
    }, "findAll");
  }

  async count(filters?: OfficerFilters): Promise<number> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);
      return await this.prisma.officer.count({ where });
    }, "count");
  }

  async create(data: CreateOfficerDto): Promise<Officer> {
    return this.execute(async () => {
      const officer = await this.prisma.officer.create({
        data: {
          badge: data.badge,
          name: data.name,
          email: data.email,
          phone: data.phone,
          pinHash: data.pinHash,
          roleId: data.roleId,
          stationId: data.stationId,
          active: true,
          failedAttempts: 0,
          mfaEnabled: false,
        },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return this.toDomain(officer);
    }, "create");
  }

  async update(id: string, data: UpdateOfficerDto): Promise<Officer> {
    return this.execute(async () => {
      const officer = await this.prisma.officer.update({
        where: { id },
        data,
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return this.toDomain(officer);
    }, "update");
  }

  async delete(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.officer.delete({ where: { id } });
    }, "delete");
  }

  async incrementFailedAttempts(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.officer.update({
        where: { id },
        data: { failedAttempts: { increment: 1 } },
      });
    }, "incrementFailedAttempts");
  }

  async resetFailedAttempts(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.officer.update({
        where: { id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }, "resetFailedAttempts");
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    return this.execute(async () => {
      await this.prisma.officer.update({
        where: { id },
        data: { lockedUntil: until },
      });
    }, "lockAccount");
  }

  async updateLastLogin(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.officer.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    }, "updateLastLogin");
  }

  async updatePinHash(id: string, pinHash: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.officer.update({
        where: { id },
        data: { pinHash, pinChangedAt: new Date() },
      });
    }, "updatePinHash");
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters?: OfficerFilters): any {
    if (!filters) return {};

    const where: any = {};

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    if (filters.roleId) {
      where.roleId = filters.roleId;
    }

    if (filters.stationId) {
      where.stationId = filters.stationId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { badge: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /**
   * Map Prisma model to Domain entity
   * This ensures the repository layer returns domain entities, not Prisma models
   */
  private toDomain(data: PrismaOfficer & { role?: any; station?: any }): Officer {
    return new Officer(
      data.id,
      data.badge,
      data.name,
      data.email,
      data.phone,
      data.roleId,
      data.stationId,
      data.active,
      data.lastLogin,
      data.pinChangedAt,
      data.failedAttempts,
      data.lockedUntil,
      data.mfaEnabled,
      data.createdAt,
      data.updatedAt
    );
  }
}
