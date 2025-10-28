/**
 * Role Repository Implementation
 *
 * Handles all database operations for roles.
 * Pan-African Design: Supports customizable role hierarchies
 */
import { PrismaClient, Role as PrismaRole } from "@prisma/client";
import {
  IRoleRepository,
  CreateRoleDto,
  UpdateRoleDto,
} from "@/src/domain/interfaces/repositories/IRoleRepository";
import { Role } from "@/src/domain/entities/Role";
import { Permission } from "@/src/domain/entities/Permission";
import { BaseRepository } from "../base/BaseRepository";

export class RoleRepository extends BaseRepository implements IRoleRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<Role | null> {
    return this.execute(async () => {
      const role = await this.prisma.role.findUnique({
        where: { id },
      });

      return role ? this.toDomain(role) : null;
    }, "findById");
  }

  async findByName(name: string): Promise<Role | null> {
    return this.execute(async () => {
      const role = await this.prisma.role.findUnique({
        where: { name },
      });

      return role ? this.toDomain(role) : null;
    }, "findByName");
  }

  async findByLevel(level: number): Promise<Role | null> {
    return this.execute(async () => {
      const role = await this.prisma.role.findUnique({
        where: { level },
      });

      return role ? this.toDomain(role) : null;
    }, "findByLevel");
  }

  async findAll(): Promise<Role[]> {
    return this.execute(async () => {
      const roles = await this.prisma.role.findMany({
        orderBy: { level: "asc" },
      });

      return roles.map((r) => this.toDomain(r));
    }, "findAll");
  }

  async findByIdWithPermissions(id: string): Promise<{ role: Role; permissions: Permission[] } | null> {
    return this.execute(async () => {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: true,
        },
      });

      if (!role) return null;

      return {
        role: this.toDomain(role),
        permissions: role.permissions.map((p) => this.permissionToDomain(p)),
      };
    }, "findByIdWithPermissions");
  }

  async create(data: CreateRoleDto): Promise<Role> {
    return this.execute(async () => {
      const role = await this.prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
          level: data.level,
        },
      });

      return this.toDomain(role);
    }, "create");
  }

  async update(id: string, data: UpdateRoleDto): Promise<Role> {
    return this.execute(async () => {
      const role = await this.prisma.role.update({
        where: { id },
        data,
      });

      return this.toDomain(role);
    }, "update");
  }

  async delete(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.role.delete({ where: { id } });
    }, "delete");
  }

  async addPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    return this.execute(async () => {
      await this.prisma.role.update({
        where: { id: roleId },
        data: {
          permissions: {
            connect: permissionIds.map((id) => ({ id })),
          },
        },
      });
    }, "addPermissions");
  }

  async removePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    return this.execute(async () => {
      await this.prisma.role.update({
        where: { id: roleId },
        data: {
          permissions: {
            disconnect: permissionIds.map((id) => ({ id })),
          },
        },
      });
    }, "removePermissions");
  }

  async getPermissions(roleId: string): Promise<Permission[]> {
    return this.execute(async () => {
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: true,
        },
      });

      return role ? role.permissions.map((p) => this.permissionToDomain(p)) : [];
    }, "getPermissions");
  }

  private toDomain(data: PrismaRole): Role {
    return new Role(
      data.id,
      data.name,
      data.description,
      data.level,
      data.createdAt,
      data.updatedAt
    );
  }

  private permissionToDomain(data: any): Permission {
    return new Permission(
      data.id,
      data.resource,
      data.action,
      data.scope
    );
  }
}
