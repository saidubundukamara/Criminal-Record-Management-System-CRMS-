/**
 * Vehicle Service
 *
 * Business logic layer for vehicle management
 * Handles validation, stolen vehicle tracking, and audit logging
 *
 * Pan-African Design:
 * - Country-agnostic vehicle registration
 * - Cross-border stolen vehicle tracking
 * - USSD-compatible vehicle checks
 */

import {
  IVehicleRepository,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleFilters,
  PaginationOptions,
  PaginatedVehicles,
} from "@/src/domain/interfaces/repositories/IVehicleRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { Vehicle, VehicleType } from "@/src/domain/entities/Vehicle";
import { ValidationError, NotFoundError } from "@/src/lib/errors";

/**
 * Input for creating a vehicle
 */
export interface CreateVehicleInput {
  licensePlate: string;
  ownerNIN?: string | null;
  ownerName?: string | null;
  vehicleType: VehicleType;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  year?: number | null;
  notes?: string | null;
  stationId: string;
}

/**
 * Input for updating a vehicle
 */
export interface UpdateVehicleInput {
  ownerNIN?: string | null;
  ownerName?: string | null;
  vehicleType?: VehicleType;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  year?: number | null;
  notes?: string | null;
}

/**
 * Input for reporting a stolen vehicle
 */
export interface ReportStolenInput {
  vehicleId?: string;
  licensePlate?: string; // If vehicle doesn't exist yet
  ownerName?: string;
  ownerNIN?: string;
  vehicleType: VehicleType;
  make?: string;
  model?: string;
  color?: string;
  year?: number;
  stolenDate?: string; // ISO string
  notes?: string;
  stationId: string;
  reportedBy: string; // Officer ID
}

/**
 * Vehicle Service
 * Handles all vehicle-related business logic
 */
export class VehicleService {
  constructor(
    private readonly vehicleRepo: IVehicleRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Get vehicle by ID
   */
  async getVehicleById(
    id: string,
    officerId: string
  ): Promise<Vehicle | null> {
    const vehicle = await this.vehicleRepo.findById(id);

    if (vehicle) {
      // Audit log
      await this.auditRepo.create({
        entityType: "vehicle",
        entityId: id,
        officerId,
        action: "read",
        success: true,
        details: { licensePlate: vehicle.licensePlate },
      });
    }

    return vehicle;
  }

  /**
   * Check vehicle by license plate (USSD-friendly method)
   */
  async checkVehicle(
    licensePlate: string,
    officerId: string
  ): Promise<Vehicle | null> {
    const vehicle = await this.vehicleRepo.findByLicensePlate(licensePlate);

    // Audit log (always log, even if not found)
    await this.auditRepo.create({
      entityType: "vehicle",
      entityId: vehicle?.id || "not-found",
      officerId,
      action: "read",
      success: true,
      details: {
        licensePlate,
        found: !!vehicle,
        status: vehicle?.status || "not-found",
        isStolen: vehicle?.isStolen() || false,
      },
    });

    return vehicle;
  }

  /**
   * Search vehicles
   */
  async searchVehicles(
    filters: VehicleFilters,
    pagination?: PaginationOptions,
    officerId?: string
  ): Promise<PaginatedVehicles> {
    const results = await this.vehicleRepo.search(filters, pagination);

    // Audit log for searches
    if (officerId) {
      await this.auditRepo.create({
        entityType: "vehicle",
        entityId: undefined,
        officerId,
        action: "read",
        success: true,
        details: {
          operation: "search",
          filters,
          resultsCount: results.total,
        },
      });
    }

    return results;
  }

  /**
   * Get all stolen vehicles (currently stolen, not recovered)
   */
  async getStolenVehicles(filters?: {
    stationId?: string;
    stolenAfter?: Date;
    stolenBefore?: Date;
  }): Promise<Vehicle[]> {
    return await this.vehicleRepo.findStolen(filters);
  }

  /**
   * Get vehicles by station
   */
  async getVehiclesByStation(stationId: string): Promise<Vehicle[]> {
    return await this.vehicleRepo.findByStation(stationId);
  }

  /**
   * Get impounded vehicles
   */
  async getImpoundedVehicles(stationId?: string): Promise<Vehicle[]> {
    return await this.vehicleRepo.findImpounded(stationId);
  }

  /**
   * Register new vehicle
   */
  async registerVehicle(
    input: CreateVehicleInput,
    officerId: string
  ): Promise<Vehicle> {
    // Validation
    const validation = Vehicle.validate({
      licensePlate: input.licensePlate,
      vehicleType: input.vehicleType,
      year: input.year || null,
    });

    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    // Check if license plate already exists
    const exists = await this.vehicleRepo.existsByLicensePlate(
      input.licensePlate
    );
    if (exists) {
      throw new ValidationError(
        `Vehicle with license plate ${input.licensePlate} already exists`
      );
    }

    // Create vehicle
    const dto: CreateVehicleDto = {
      licensePlate: input.licensePlate,
      ownerNIN: input.ownerNIN || null,
      ownerName: input.ownerName || null,
      vehicleType: input.vehicleType,
      make: input.make || null,
      model: input.model || null,
      color: input.color || null,
      year: input.year || null,
      notes: input.notes || null,
      stationId: input.stationId,
      status: "active",
    };

    const vehicle = await this.vehicleRepo.create(dto);

    // Audit log
    await this.auditRepo.create({
      entityType: "vehicle",
      entityId: vehicle.id,
      officerId,
      action: "create",
      success: true,
      details: {
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
        stationId: vehicle.stationId,
      },
    });

    return vehicle;
  }

  /**
   * Update vehicle information
   */
  async updateVehicle(
    id: string,
    input: UpdateVehicleInput,
    officerId: string
  ): Promise<Vehicle> {
    // Check if vehicle exists
    const existing = await this.vehicleRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }

    // Validation
    if (input.vehicleType || input.year !== undefined) {
      const validation = Vehicle.validate({
        licensePlate: existing.licensePlate,
        vehicleType: input.vehicleType || existing.vehicleType,
        year: input.year ?? existing.year,
      });

      if (!validation.valid) {
        throw new ValidationError(validation.errors.join(", "));
      }
    }

    // Update vehicle
    const dto: UpdateVehicleDto = {
      ownerNIN: input.ownerNIN,
      ownerName: input.ownerName,
      vehicleType: input.vehicleType,
      make: input.make,
      model: input.model,
      color: input.color,
      year: input.year,
      notes: input.notes,
    };

    const vehicle = await this.vehicleRepo.update(id, dto);

    // Audit log
    await this.auditRepo.create({
      entityType: "vehicle",
      entityId: id,
      officerId,
      action: "update",
      success: true,
      details: {
        licensePlate: vehicle.licensePlate,
        changes: input,
      },
    });

    return vehicle;
  }

  /**
   * Report vehicle as stolen
   */
  async reportStolen(
    input: ReportStolenInput,
    officerId: string
  ): Promise<Vehicle> {
    let vehicle: Vehicle;

    // If vehicleId provided, mark existing vehicle as stolen
    if (input.vehicleId) {
      const existing = await this.vehicleRepo.findById(input.vehicleId);
      if (!existing) {
        throw new NotFoundError(`Vehicle with ID ${input.vehicleId} not found`);
      }

      if (!existing.canMarkAsStolen()) {
        throw new ValidationError(
          `Vehicle with status "${existing.status}" cannot be marked as stolen`
        );
      }

      const stolenDate = input.stolenDate
        ? new Date(input.stolenDate)
        : new Date();

      vehicle = await this.vehicleRepo.markAsStolen(
        input.vehicleId,
        input.reportedBy,
        stolenDate
      );
    }
    // Otherwise, create new vehicle record with stolen status
    else {
      if (!input.licensePlate) {
        throw new ValidationError(
          "License plate is required when creating new stolen vehicle record"
        );
      }

      // Check if already exists
      const existing = await this.vehicleRepo.findByLicensePlate(
        input.licensePlate
      );
      if (existing) {
        throw new ValidationError(
          `Vehicle with license plate ${input.licensePlate} already exists. Use vehicleId to mark it as stolen.`
        );
      }

      // Validation
      const validation = Vehicle.validate({
        licensePlate: input.licensePlate,
        vehicleType: input.vehicleType,
        year: input.year || null,
      });

      if (!validation.valid) {
        throw new ValidationError(validation.errors.join(", "));
      }

      const dto: CreateVehicleDto = {
        licensePlate: input.licensePlate,
        ownerNIN: input.ownerNIN || null,
        ownerName: input.ownerName || null,
        vehicleType: input.vehicleType,
        make: input.make || null,
        model: input.model || null,
        color: input.color || null,
        year: input.year || null,
        status: "stolen",
        stolenDate: input.stolenDate ? new Date(input.stolenDate) : new Date(),
        stolenReportedBy: input.reportedBy,
        notes: input.notes || null,
        stationId: input.stationId,
      };

      vehicle = await this.vehicleRepo.create(dto);
    }

    // Audit log
    await this.auditRepo.create({
      entityType: "vehicle",
      entityId: vehicle.id,
      officerId,
      action: "update",
      success: true,
      details: {
        operation: "report-stolen",
        licensePlate: vehicle.licensePlate,
        stolenDate: vehicle.stolenDate?.toISOString(),
        reportedBy: input.reportedBy,
      },
    });

    return vehicle;
  }

  /**
   * Mark stolen vehicle as recovered
   */
  async markAsRecovered(
    id: string,
    recoveredDate: string | undefined,
    officerId: string
  ): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }

    if (!existing.canMarkAsRecovered()) {
      throw new ValidationError(
        `Vehicle with status "${existing.status}" cannot be marked as recovered`
      );
    }

    const dateToUse = recoveredDate ? new Date(recoveredDate) : new Date();
    const vehicle = await this.vehicleRepo.markAsRecovered(id, dateToUse);

    // Audit log
    await this.auditRepo.create({
      entityType: "vehicle",
      entityId: id,
      officerId,
      action: "update",
      success: true,
      details: {
        operation: "mark-recovered",
        licensePlate: vehicle.licensePlate,
        recoveredDate: vehicle.recoveredDate?.toISOString(),
      },
    });

    return vehicle;
  }

  /**
   * Mark vehicle as impounded
   */
  async markAsImpounded(id: string, officerId: string): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }

    if (!existing.canImpound()) {
      throw new ValidationError(
        `Vehicle with status "${existing.status}" cannot be impounded`
      );
    }

    const vehicle = await this.vehicleRepo.markAsImpounded(id);

    // Audit log
    await this.auditRepo.create({
      entityType: "vehicle",
      entityId: id,
      officerId,
      action: "update",
      success: true,
      details: {
        operation: "mark-impounded",
        licensePlate: vehicle.licensePlate,
      },
    });

    return vehicle;
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(id: string, officerId: string): Promise<void> {
    const existing = await this.vehicleRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Vehicle with ID ${id} not found`);
    }

    await this.vehicleRepo.delete(id);

    // Audit log
    await this.auditRepo.create({
      entityType: "vehicle",
      entityId: id,
      officerId,
      action: "delete",
      success: true,
      details: {
        licensePlate: existing.licensePlate,
      },
    });
  }

  /**
   * Get vehicle statistics
   */
  async getStatistics(stationId?: string): Promise<{
    total: number;
    stolen: number;
    recovered: number;
    impounded: number;
    stolenThisMonth: number;
    recoveredThisMonth: number;
  }> {
    return await this.vehicleRepo.getStatistics(stationId);
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
    return await this.vehicleRepo.countByStatus(stationId);
  }
}
