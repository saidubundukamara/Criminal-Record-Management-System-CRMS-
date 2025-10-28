/**
 * Role Repository Interface
 *
 * Contract for role data access operations.
 * Pan-African Design: Supports customizable role hierarchies for different countries
 */
import { Role } from "@/src/domain/entities/Role";
import { Permission } from "@/src/domain/entities/Permission";

export interface CreateRoleDto {
  name: string;
  description?: string;
  level: number;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  level?: number;
}

export interface IRoleRepository {
  // Queries
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findByLevel(level: number): Promise<Role | null>;
  findAll(): Promise<Role[]>;

  // Get role with permissions
  findByIdWithPermissions(id: string): Promise<{ role: Role; permissions: Permission[] } | null>;

  // Commands
  create(data: CreateRoleDto): Promise<Role>;
  update(id: string, data: UpdateRoleDto): Promise<Role>;
  delete(id: string): Promise<void>;

  // Permission management
  addPermissions(roleId: string, permissionIds: string[]): Promise<void>;
  removePermissions(roleId: string, permissionIds: string[]): Promise<void>;
  getPermissions(roleId: string): Promise<Permission[]>;
}
