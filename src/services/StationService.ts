/**
 * Station Service
 *
 * Handles all station management business logic:
 * - Station creation, update, deletion (soft delete)
 * - Station activation/deactivation
 * - Multi-country support
 * - Station filtering and search
 *
 * Pan-African Design: Supports stations across multiple countries with country-specific configurations
 */
import {
  IStationRepository,
  Station,
  CreateStationDto,
  UpdateStationDto,
  StationFilters,
} from "@/src/domain/interfaces/repositories/IStationRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { ValidationError, NotFoundError } from "@/src/lib/errors";

export interface CreateStationInput {
  name: string;
  code: string;
  location: string;
  district?: string;
  region?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateStationInput {
  name?: string;
  code?: string;
  location?: string;
  district?: string;
  region?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  active?: boolean;
}

export class StationService {
  constructor(
    private readonly stationRepo: IStationRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Create a new station
   * Validates input and ensures unique station code
   */
  async createStation(
    data: CreateStationInput,
    createdBy: string,
    ipAddress?: string
  ): Promise<Station> {
    // Validation
    this.validateStationInput(data);

    // Check code uniqueness
    const existingStation = await this.stationRepo.findByCode(data.code);
    if (existingStation) {
      throw new ValidationError(
        `Station code ${data.code} is already in use`
      );
    }

    // Get active country from environment
    const countryCode = process.env.COUNTRY_CODE || "SLE";

    // Create station
    const stationData: CreateStationDto = {
      name: data.name.trim(),
      code: data.code.toUpperCase().trim(),
      location: data.location.trim(),
      district: data.district?.trim(),
      region: data.region?.trim(),
      countryCode, // Use deployment's country code
      phone: data.phone?.trim(),
      email: data.email?.toLowerCase().trim(),
      latitude: data.latitude,
      longitude: data.longitude,
    };

    const newStation = await this.stationRepo.create(stationData);

    // Audit log
    await this.auditRepo.create({
      entityType: "station",
      entityId: newStation.id,
      officerId: createdBy,
      action: "create",
      success: true,
      details: {
        code: newStation.code,
        name: newStation.name,
        location: newStation.location,
        countryCode: newStation.countryCode,
      },
      ipAddress,
    });

    return newStation;
  }

  /**
   * Get station by ID
   */
  async getStation(id: string): Promise<Station> {
    const station = await this.stationRepo.findById(id);

    if (!station) {
      throw new NotFoundError(`Station with ID ${id} not found`);
    }

    return station;
  }

  /**
   * Get station by code
   */
  async getStationByCode(code: string): Promise<Station> {
    const station = await this.stationRepo.findByCode(
      code.toUpperCase().trim()
    );

    if (!station) {
      throw new NotFoundError(`Station with code ${code} not found`);
    }

    return station;
  }

  /**
   * List stations with filters
   */
  async listStations(filters?: StationFilters): Promise<Station[]> {
    return await this.stationRepo.findAll(filters);
  }

  /**
   * List stations by country
   */
  async listStationsByCountry(countryCode: string): Promise<Station[]> {
    return await this.stationRepo.findByCountryCode(
      countryCode.toUpperCase().trim()
    );
  }

  /**
   * Update station
   * Validates input and logs changes
   */
  async updateStation(
    id: string,
    data: UpdateStationInput,
    updatedBy: string,
    ipAddress?: string
  ): Promise<Station> {
    // Check station exists
    const existingStation = await this.getStation(id);

    // Check code uniqueness if code is being changed
    if (data.code && data.code.toUpperCase() !== existingStation.code) {
      const stationWithCode = await this.stationRepo.findByCode(data.code);
      if (stationWithCode) {
        throw new ValidationError(
          `Station code ${data.code} is already in use`
        );
      }
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new ValidationError("Invalid email format");
    }

    // Validate coordinates if provided
    if (data.latitude !== undefined || data.longitude !== undefined) {
      this.validateCoordinates(data.latitude, data.longitude);
    }

    // Prepare update data
    const updateData: UpdateStationDto = {
      ...data,
      name: data.name?.trim(),
      code: data.code?.toUpperCase().trim(),
      location: data.location?.trim(),
      district: data.district?.trim(),
      region: data.region?.trim(),
      phone: data.phone?.trim(),
      email: data.email?.toLowerCase().trim(),
    };

    // Update station
    const updatedStation = await this.stationRepo.update(id, updateData);

    // Audit log
    await this.auditRepo.create({
      entityType: "station",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        code: existingStation.code,
        changes: data,
      },
      ipAddress,
    });

    return updatedStation;
  }

  /**
   * Soft delete station
   * Sets active = false instead of deleting the record
   */
  async deleteStation(
    id: string,
    deletedBy: string,
    ipAddress?: string
  ): Promise<void> {
    // Check station exists
    const station = await this.getStation(id);

    // TODO: Check if station has active officers
    // For now, allow deletion (will be enforced at DB level with cascade rules)

    // Soft delete (set active = false)
    await this.stationRepo.update(id, { active: false });

    // Audit log
    await this.auditRepo.create({
      entityType: "station",
      entityId: id,
      officerId: deletedBy,
      action: "delete",
      success: true,
      details: {
        code: station.code,
        name: station.name,
        location: station.location,
      },
      ipAddress,
    });
  }

  /**
   * Activate station
   */
  async activateStation(
    id: string,
    activatedBy: string,
    ipAddress?: string
  ): Promise<Station> {
    const station = await this.getStation(id);

    if (station.active) {
      throw new ValidationError("Station is already active");
    }

    const updatedStation = await this.stationRepo.update(id, {
      active: true,
    });

    // Audit log
    await this.auditRepo.create({
      entityType: "station",
      entityId: id,
      officerId: activatedBy,
      action: "activate",
      success: true,
      details: {
        code: station.code,
        name: station.name,
      },
      ipAddress,
    });

    return updatedStation;
  }

  /**
   * Deactivate station
   */
  async deactivateStation(
    id: string,
    deactivatedBy: string,
    ipAddress?: string
  ): Promise<Station> {
    const station = await this.getStation(id);

    if (!station.active) {
      throw new ValidationError("Station is already inactive");
    }

    const updatedStation = await this.stationRepo.update(id, {
      active: false,
    });

    // Audit log
    await this.auditRepo.create({
      entityType: "station",
      entityId: id,
      officerId: deactivatedBy,
      action: "deactivate",
      success: true,
      details: {
        code: station.code,
        name: station.name,
      },
      ipAddress,
    });

    return updatedStation;
  }

  /**
   * Get station statistics
   */
  async getStats(filters?: {
    region?: string;
  }): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRegion: Record<string, number>;
    byDistrict: Record<string, number>;
  }> {
    const allStations = await this.stationRepo.findAll(filters);

    const stats = {
      total: allStations.length,
      active: allStations.filter((s) => s.active).length,
      inactive: allStations.filter((s) => !s.active).length,
      byRegion: {} as Record<string, number>,
      byDistrict: {} as Record<string, number>,
    };

    // Count by region and district
    allStations.forEach((station) => {
      if (station.region) {
        stats.byRegion[station.region] =
          (stats.byRegion[station.region] || 0) + 1;
      }

      if (station.district) {
        stats.byDistrict[station.district] =
          (stats.byDistrict[station.district] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Validate station input
   */
  private validateStationInput(data: CreateStationInput): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError("Station name must be at least 2 characters");
    }

    if (!data.code || data.code.trim().length === 0) {
      throw new ValidationError("Station code is required");
    }

    // Station code format validation (2-4 uppercase letters)
    if (!/^[A-Z]{2,4}$/.test(data.code.toUpperCase().trim())) {
      throw new ValidationError(
        "Invalid station code format. Expected 2-4 uppercase letters (e.g., HQ, BO, KEN)"
      );
    }

    if (!data.location || data.location.trim().length < 2) {
      throw new ValidationError("Location must be at least 2 characters");
    }

    // Country code is automatically set from environment, no need to validate user input

    if (data.email && !this.isValidEmail(data.email)) {
      throw new ValidationError("Invalid email format");
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new ValidationError("Invalid phone format");
    }

    if (data.latitude !== undefined || data.longitude !== undefined) {
      this.validateCoordinates(data.latitude, data.longitude);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  private isValidPhone(phone: string): boolean {
    // Basic phone validation (can be customized per country)
    const phoneRegex = /^\+?[\d\s\-()]{8,20}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate coordinates
   */
  private validateCoordinates(
    latitude?: number,
    longitude?: number
  ): void {
    if (latitude !== undefined) {
      if (latitude < -90 || latitude > 90) {
        throw new ValidationError("Latitude must be between -90 and 90");
      }
    }

    if (longitude !== undefined) {
      if (longitude < -180 || longitude > 180) {
        throw new ValidationError("Longitude must be between -180 and 180");
      }
    }
  }
}
