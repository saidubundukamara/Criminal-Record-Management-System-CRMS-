/**
 * Station Repository Implementation
 *
 * Handles all database operations for police stations.
 * Pan-African Design: Supports different country codes and regional structures
 */
import { PrismaClient, Station as PrismaStation } from "@prisma/client";
import {
  IStationRepository,
  Station,
  CreateStationDto,
  UpdateStationDto,
  StationFilters,
} from "@/src/domain/interfaces/repositories/IStationRepository";
import { BaseRepository } from "../base/BaseRepository";

export class StationRepository extends BaseRepository implements IStationRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<Station | null> {
    return this.execute(async () => {
      const station = await this.prisma.station.findUnique({
        where: { id },
      });

      return station ? this.toDomain(station) : null;
    }, "findById");
  }

  async findByCode(code: string): Promise<Station | null> {
    return this.execute(async () => {
      const station = await this.prisma.station.findUnique({
        where: { code },
      });

      return station ? this.toDomain(station) : null;
    }, "findByCode");
  }

  async findByRegion(region: string): Promise<Station[]> {
    return this.execute(async () => {
      const stations = await this.prisma.station.findMany({
        where: { region },
        orderBy: { name: "asc" },
      });

      return stations.map((s) => this.toDomain(s));
    }, "findByRegion");
  }

  async findByCountryCode(countryCode: string): Promise<Station[]> {
    return this.execute(async () => {
      const stations = await this.prisma.station.findMany({
        where: { countryCode },
        orderBy: { name: "asc" },
      });

      return stations.map((s) => this.toDomain(s));
    }, "findByCountryCode");
  }

  async findAll(filters?: StationFilters): Promise<Station[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      const stations = await this.prisma.station.findMany({
        where,
        orderBy: { name: "asc" },
      });

      return stations.map((s) => this.toDomain(s));
    }, "findAll");
  }

  async count(filters?: StationFilters): Promise<number> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);
      return await this.prisma.station.count({ where });
    }, "count");
  }

  async create(data: CreateStationDto): Promise<Station> {
    return this.execute(async () => {
      const station = await this.prisma.station.create({
        data: {
          name: data.name,
          code: data.code,
          location: data.location,
          district: data.district,
          region: data.region,
          countryCode: data.countryCode || "SLE", // Default to Sierra Leone
          phone: data.phone,
          email: data.email,
          latitude: data.latitude,
          longitude: data.longitude,
          active: true,
        },
      });

      return this.toDomain(station);
    }, "create");
  }

  async update(id: string, data: UpdateStationDto): Promise<Station> {
    return this.execute(async () => {
      const station = await this.prisma.station.update({
        where: { id },
        data,
      });

      return this.toDomain(station);
    }, "update");
  }

  async delete(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.station.delete({ where: { id } });
    }, "delete");
  }

  async activate(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.station.update({
        where: { id },
        data: { active: true },
      });
    }, "activate");
  }

  async deactivate(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.station.update({
        where: { id },
        data: { active: false },
      });
    }, "deactivate");
  }

  private buildWhereClause(filters?: StationFilters): any {
    if (!filters) return {};

    const where: any = {};

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    if (filters.region) {
      where.region = filters.region;
    }

    if (filters.district) {
      where.district = filters.district;
    }

    if (filters.countryCode) {
      where.countryCode = filters.countryCode;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private toDomain(data: PrismaStation): Station {
    return {
      id: data.id,
      name: data.name,
      code: data.code,
      location: data.location,
      district: data.district,
      region: data.region,
      countryCode: data.countryCode,
      phone: data.phone,
      email: data.email,
      latitude: data.latitude,
      longitude: data.longitude,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
