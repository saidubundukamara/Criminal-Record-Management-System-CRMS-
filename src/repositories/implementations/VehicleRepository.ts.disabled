/**
 * Vehicle Repository Implementation
 *
 * Implements IVehicleRepository with Prisma ORM
 * Handles vehicle storage, stolen vehicle tracking, and impoundment records
 *
 * Pan-African Design: Country-agnostic vehicle registration with cross-border support
 */

import { BaseRepository } from "../base/BaseRepository";
import {
  IVehicleRepository,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleFilters,
  PaginationOptions,
  PaginatedVehicles,
} from "@/src/domain/interfaces/repositories/IVehicleRepository";
import { Vehicle, VehicleStatus } from "@/src/domain/entities/Vehicle";
import { Prisma } from "@prisma/client";

/**
 * VehicleRepository implementation using Prisma
 */
export class VehicleRepository
  extends BaseRepository
  implements IVehicleRepository
{
  /**
   * Map Prisma Vehicle to domain entity
   */
  private toDomain(data: any): Vehicle {
    return new Vehicle(
      data.id,
      data.licensePlate,
      data.ownerNIN,
      data.ownerName,
      data.vehicleType,
      data.make,
      data.model,
      data.color,
      data.year,
      data.status as VehicleStatus,
      data.stolenDate ? new Date(data.stolenDate) : null,
      data.stolenReportedBy,
      data.recoveredDate ? new Date(data.recoveredDate) : null,
      data.notes,
      data.stationId,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  /**
   * Find vehicle by ID
   */
  async findById(id: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    return vehicle ? this.toDomain(vehicle) : null;
  }

  /**
   * Find vehicle by license plate (case-insensitive)
   */
  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    // Normalize plate for search
    const normalizedPlate = Vehicle.normalizeLicensePlate(licensePlate);

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        licensePlate: {
          equals: normalizedPlate,
          mode: "insensitive",
        },
      },
    });

    return vehicle ? this.toDomain(vehicle) : null;
  }

  /**
   * Find all vehicles owned by a person (by NIN)
   */
  async findByOwnerNIN(ownerNIN: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { ownerNIN },
      orderBy: { createdAt: "desc" },
    });

    return vehicles.map((v) => this.toDomain(v));
  }

  /**
   * Find all stolen vehicles (currently stolen, not recovered)
   */
  async findStolen(filters?: {
    stationId?: string;
    stolenAfter?: Date;
    stolenBefore?: Date;
  }): Promise<Vehicle[]> {
    const where: Prisma.VehicleWhereInput = {
      status: "stolen",
      recoveredDate: null, // Not yet recovered
    };

    if (filters?.stationId) {
      where.stationId = filters.stationId;
    }

    if (filters?.stolenAfter || filters?.stolenBefore) {
      where.stolenDate = {};
      if (filters.stolenAfter) {
        where.stolenDate.gte = filters.stolenAfter;
      }
      if (filters.stolenBefore) {
        where.stolenDate.lte = filters.stolenBefore;
      }
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      orderBy: { stolenDate: "desc" },
    });

    return vehicles.map((v) => this.toDomain(v));
  }

  /**
   * Find all vehicles at a station
   */
  async findByStation(stationId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
    });

    return vehicles.map((v) => this.toDomain(v));
  }

  /**
   * Find all impounded vehicles
   */
  async findImpounded(stationId?: string): Promise<Vehicle[]> {
    const where: Prisma.VehicleWhereInput = {
      status: "impounded",
    };

    if (stationId) {
      where.stationId = stationId;
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return vehicles.map((v) => this.toDomain(v));
  }

  /**
   * Search vehicles with filters and pagination
   */
  async search(
    filters: VehicleFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedVehicles> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.VehicleWhereInput = {};

    if (filters.search) {
      where.OR = [
        { licensePlate: { contains: filters.search, mode: "insensitive" } },
        { ownerName: { contains: filters.search, mode: "insensitive" } },
        { make: { contains: filters.search, mode: "insensitive" } },
        { model: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.licensePlate) {
      where.licensePlate = {
        contains: filters.licensePlate,
        mode: "insensitive",
      };
    }

    if (filters.ownerNIN) {
      where.ownerNIN = filters.ownerNIN;
    }

    if (filters.vehicleType) {
      where.vehicleType = filters.vehicleType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.make) {
      where.make = { contains: filters.make, mode: "insensitive" };
    }

    if (filters.model) {
      where.model = { contains: filters.model, mode: "insensitive" };
    }

    if (filters.color) {
      where.color = { contains: filters.color, mode: "insensitive" };
    }

    if (filters.stationId) {
      where.stationId = filters.stationId;
    }

    if (filters.isStolen !== undefined) {
      if (filters.isStolen) {
        where.status = "stolen";
        where.recoveredDate = null;
      } else {
        where.status = { not: "stolen" };
      }
    }

    if (filters.stolenAfter || filters.stolenBefore) {
      where.stolenDate = {};
      if (filters.stolenAfter) {
        where.stolenDate.gte = filters.stolenAfter;
      }
      if (filters.stolenBefore) {
        where.stolenDate.lte = filters.stolenBefore;
      }
    }

    // Execute query with pagination
    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [pagination?.orderBy || "createdAt"]:
            pagination?.orderDirection || "desc",
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      vehicles: vehicles.map((v) => this.toDomain(v)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create new vehicle record
   */
  async create(data: CreateVehicleDto): Promise<Vehicle> {
    // Normalize license plate
    const normalizedPlate = Vehicle.normalizeLicensePlate(data.licensePlate);

    const vehicle = await this.prisma.vehicle.create({
      data: {
        licensePlate: normalizedPlate,
        ownerNIN: data.ownerNIN || null,
        ownerName: data.ownerName || null,
        vehicleType: data.vehicleType,
        make: data.make || null,
        model: data.model || null,
        color: data.color || null,
        year: data.year || null,
        status: data.status || "active",
        stolenDate: data.stolenDate || null,
        stolenReportedBy: data.stolenReportedBy || null,
        notes: data.notes || null,
        stationId: data.stationId,
      },
    });

    return this.toDomain(vehicle);
  }

  /**
   * Update existing vehicle
   */
  async update(id: string, data: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        ownerNIN: data.ownerNIN,
        ownerName: data.ownerName,
        vehicleType: data.vehicleType,
        make: data.make,
        model: data.model,
        color: data.color,
        year: data.year,
        status: data.status,
        notes: data.notes,
      },
    });

    return this.toDomain(vehicle);
  }

  /**
   * Mark vehicle as stolen
   */
  async markAsStolen(
    id: string,
    reportedBy: string,
    stolenDate?: Date
  ): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        status: "stolen",
        stolenDate: stolenDate || new Date(),
        stolenReportedBy: reportedBy,
        recoveredDate: null, // Clear any previous recovery date
      },
    });

    return this.toDomain(vehicle);
  }

  /**
   * Mark stolen vehicle as recovered
   */
  async markAsRecovered(id: string, recoveredDate?: Date): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        recoveredDate: recoveredDate || new Date(),
        // Note: We keep status as "stolen" to maintain history
        // UI can show "recovered" based on recoveredDate presence
      },
    });

    return this.toDomain(vehicle);
  }

  /**
   * Mark vehicle as impounded
   */
  async markAsImpounded(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        status: "impounded",
      },
    });

    return this.toDomain(vehicle);
  }

  /**
   * Delete vehicle record
   */
  async delete(id: string): Promise<void> {
    await this.prisma.vehicle.delete({
      where: { id },
    });
  }

  /**
   * Count vehicles by status
   */
  async countByStatus(
    stationId?: string
  ): Promise<{
    active: number;
    stolen: number;
    impounded: number;
    recovered: number;
  }> {
    const where: Prisma.VehicleWhereInput = {};
    if (stationId) {
      where.stationId = stationId;
    }

    const [active, stolen, impounded, recovered] = await Promise.all([
      this.prisma.vehicle.count({
        where: { ...where, status: "active" },
      }),
      this.prisma.vehicle.count({
        where: { ...where, status: "stolen", recoveredDate: null },
      }),
      this.prisma.vehicle.count({
        where: { ...where, status: "impounded" },
      }),
      this.prisma.vehicle.count({
        where: { ...where, status: "stolen", recoveredDate: { not: null } },
      }),
    ]);

    return { active, stolen, impounded, recovered };
  }

  /**
   * Get statistics for dashboard
   */
  async getStatistics(
    stationId?: string
  ): Promise<{
    total: number;
    stolen: number;
    recovered: number;
    impounded: number;
    stolenThisMonth: number;
    recoveredThisMonth: number;
  }> {
    const where: Prisma.VehicleWhereInput = {};
    if (stationId) {
      where.stationId = stationId;
    }

    // Calculate month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, stolen, impounded, recovered, stolenThisMonth, recoveredThisMonth] =
      await Promise.all([
        this.prisma.vehicle.count({ where }),
        this.prisma.vehicle.count({
          where: { ...where, status: "stolen", recoveredDate: null },
        }),
        this.prisma.vehicle.count({
          where: { ...where, status: "impounded" },
        }),
        this.prisma.vehicle.count({
          where: { ...where, status: "stolen", recoveredDate: { not: null } },
        }),
        this.prisma.vehicle.count({
          where: {
            ...where,
            stolenDate: { gte: monthStart },
          },
        }),
        this.prisma.vehicle.count({
          where: {
            ...where,
            recoveredDate: { gte: monthStart },
          },
        }),
      ]);

    return {
      total,
      stolen,
      recovered,
      impounded,
      stolenThisMonth,
      recoveredThisMonth,
    };
  }

  /**
   * Check if license plate already exists
   */
  async existsByLicensePlate(licensePlate: string): Promise<boolean> {
    const normalizedPlate = Vehicle.normalizeLicensePlate(licensePlate);

    const count = await this.prisma.vehicle.count({
      where: {
        licensePlate: {
          equals: normalizedPlate,
          mode: "insensitive",
        },
      },
    });

    return count > 0;
  }
}
