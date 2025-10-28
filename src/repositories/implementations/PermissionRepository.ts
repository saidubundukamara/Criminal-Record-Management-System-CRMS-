/**
 * Permission Repository Implementation
 *
 * Handles all database operations for permissions.
 * Pan-African Design: Flexible permission system for different organizational structures
 */
import { PrismaClient, Permission as PrismaPermission } from "@prisma/client";
import {
  IPermissionRepository,
  CreatePermissionDto,
  PermissionFilters,
} from "@/src/domain/interfaces/repositories/IPermissionRepository";
import {
  Permission,
  PermissionResource,
  PermissionAction,
  PermissionScope,
} from "@/src/domain/entities/Permission";
import { BaseRepository } from "../base/BaseRepository";

export class PermissionRepository extends BaseRepository implements IPermissionRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<Permission | null> {
    return this.execute(async () => {
      const permission = await this.prisma.permission.findUnique({
        where: { id },
      });

      return permission ? this.toDomain(permission) : null;
    }, "findById");
  }

  async findByAttributes(
    resource: PermissionResource,
    action: PermissionAction,
    scope: PermissionScope
  ): Promise<Permission | null> {
    return this.execute(async () => {
      const permission = await this.prisma.permission.findUnique({
        where: {
          resource_action_scope: {
            resource,
            action,
            scope,
          },
        },
      });

      return permission ? this.toDomain(permission) : null;
    }, "findByAttributes");
  }

  async findAll(filters?: PermissionFilters): Promise<Permission[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);

      const permissions = await this.prisma.permission.findMany({
        where,
        orderBy: [
          { resource: "asc" },
          { action: "asc" },
          { scope: "asc" },
        ],
      });

      return permissions.map((p) => this.toDomain(p));
    }, "findAll");
  }

  async findByResource(resource: PermissionResource): Promise<Permission[]> {
    return this.execute(async () => {
      const permissions = await this.prisma.permission.findMany({
        where: { resource },
        orderBy: [
          { action: "asc" },
          { scope: "asc" },
        ],
      });

      return permissions.map((p) => this.toDomain(p));
    }, "findByResource");
  }

  async create(data: CreatePermissionDto): Promise<Permission> {
    return this.execute(async () => {
      const permission = await this.prisma.permission.create({
        data: {
          resource: data.resource,
          action: data.action,
          scope: data.scope,
        },
      });

      return this.toDomain(permission);
    }, "create");
  }

  async delete(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.permission.delete({ where: { id } });
    }, "delete");
  }

  async createMany(data: CreatePermissionDto[]): Promise<Permission[]> {
    return this.execute(async () => {
      // Use upsert to avoid duplicates
      const permissions: Permission[] = [];

      for (const item of data) {
        const permission = await this.prisma.permission.upsert({
          where: {
            resource_action_scope: {
              resource: item.resource,
              action: item.action,
              scope: item.scope,
            },
          },
          update: {},
          create: item,
        });

        permissions.push(this.toDomain(permission));
      }

      return permissions;
    }, "createMany");
  }

  private buildWhereClause(filters?: PermissionFilters): any {
    if (!filters) return {};

    const where: any = {};

    if (filters.resource) {
      where.resource = filters.resource;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.scope) {
      where.scope = filters.scope;
    }

    return where;
  }

  private toDomain(data: PrismaPermission): Permission {
    return new Permission(
      data.id,
      data.resource as PermissionResource,
      data.action as PermissionAction,
      data.scope as PermissionScope
    );
  }
}
