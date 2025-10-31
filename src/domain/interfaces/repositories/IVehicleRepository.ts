/**
 * Vehicle Repository Interface
 *
 * Defines the contract for Vehicle data access operations
 * Implementations will handle Prisma operations and entity mapping
 */

import { Vehicle, VehicleType, VehicleStatus } from "@/src/domain/entities/Vehicle";

/**
 * DTO for creating new vehicle
 */
export interface CreateVehicleDto {
  licensePlate: string;
  ownerNIN?: string | null;
  ownerName?: string | null;
  vehicleType: VehicleType;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  year?: number | null;
  status?: VehicleStatus;
  stolenDate?: Date | null;
  stolenReportedBy?: string | null;
  notes?: string | null;
  stationId: string;
}

/**
 * DTO for updating vehicle
 */
export interface UpdateVehicleDto {
  ownerNIN?: string | null;
  ownerName?: string | null;
  vehicleType?: VehicleType;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  year?: number | null;
  status?: VehicleStatus;
  notes?: string | null;
}

/**
 * Filters for searching vehicles
 */
export interface VehicleFilters {
  search?: string; // Search by license plate, owner name, make/model
  licensePlate?: string;
  ownerNIN?: string;
  vehicleType?: VehicleType;
  status?: VehicleStatus;
  make?: string;
  model?: string;
  color?: string;
  stationId?: string;
  isStolen?: boolean; // Filter for currently stolen vehicles
  stolenAfter?: Date;
  stolenBefore?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

/**
 * Paginated vehicle results
 */
export interface PaginatedVehicles {
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Vehicle Repository Interface
 * Provides methods for vehicle CRUD operations and queries
 */
export interface IVehicleRepository {
  /**
   * Find vehicle by ID
   */
  findById(id: string): Promise<Vehicle | null>;

  /**
   * Find vehicle by license plate (exact match, case-insensitive)
   */
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;

  /**
   * Find all vehicles owned by a person (by NIN)
   */
  findByOwnerNIN(ownerNIN: string): Promise<Vehicle[]>;

  /**
   * Find all stolen vehicles (currently stolen, not recovered)
   */
  findStolen(filters?: {
    stationId?: string;
    stolenAfter?: Date;
    stolenBefore?: Date;
  }): Promise<Vehicle[]>;

  /**
   * Find all vehicles at a station
   */
  findByStation(stationId: string): Promise<Vehicle[]>;

  /**
   * Find all impounded vehicles
   */
  findImpounded(stationId?: string): Promise<Vehicle[]>;

  /**
   * Search vehicles with filters and pagination
   */
  search(
    filters: VehicleFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedVehicles>;

  /**
   * Create new vehicle record
   */
  create(data: CreateVehicleDto): Promise<Vehicle>;

  /**
   * Update existing vehicle
   */
  update(id: string, data: UpdateVehicleDto): Promise<Vehicle>;

  /**
   * Mark vehicle as stolen
   */
  markAsStolen(
    id: string,
    reportedBy: string,
    stolenDate?: Date
  ): Promise<Vehicle>;

  /**
   * Mark stolen vehicle as recovered
   */
  markAsRecovered(id: string, recoveredDate?: Date): Promise<Vehicle>;

  /**
   * Mark vehicle as impounded
   */
  markAsImpounded(id: string): Promise<Vehicle>;

  /**
   * Delete vehicle record (soft delete recommended)
   */
  delete(id: string): Promise<void>;

  /**
   * Count vehicles by status
   */
  countByStatus(stationId?: string): Promise<{
    active: number;
    stolen: number;
    impounded: number;
    recovered: number;
  }>;

  /**
   * Get statistics for dashboard
   */
  getStatistics(stationId?: string): Promise<{
    total: number;
    stolen: number;
    recovered: number;
    impounded: number;
    stolenThisMonth: number;
    recoveredThisMonth: number;
  }>;

  /**
   * Check if license plate already exists
   */
  existsByLicensePlate(licensePlate: string): Promise<boolean>;
}
