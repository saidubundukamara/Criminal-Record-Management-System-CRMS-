/**
 * Station Repository Interface
 *
 * Contract for station data access operations.
 * Pan-African Design: Supports different country codes and regional structures
 */

export interface Station {
  id: string;
  name: string;
  code: string; // Country-specific format
  location: string;
  district: string | null;
  region: string | null;
  countryCode: string; // ISO 3166-1 alpha-3
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStationDto {
  name: string;
  code: string;
  location: string;
  district?: string;
  region?: string;
  countryCode?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateStationDto {
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

export interface StationFilters {
  active?: boolean;
  region?: string;
  district?: string;
  countryCode?: string;
  search?: string; // Search by name, code, location
}

export interface IStationRepository {
  // Queries
  findById(id: string): Promise<Station | null>;
  findByCode(code: string): Promise<Station | null>;
  findByRegion(region: string): Promise<Station[]>;
  findByCountryCode(countryCode: string): Promise<Station[]>;
  findAll(filters?: StationFilters): Promise<Station[]>;
  count(filters?: StationFilters): Promise<number>;

  // Commands
  create(data: CreateStationDto): Promise<Station>;
  update(id: string, data: UpdateStationDto): Promise<Station>;
  delete(id: string): Promise<void>;

  // Specific operations
  activate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
}
