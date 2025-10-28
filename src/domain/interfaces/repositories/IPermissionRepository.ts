/**
 * Permission Repository Interface
 *
 * Contract for permission data access operations.
 */
import { Permission, PermissionResource, PermissionAction, PermissionScope } from "@/src/domain/entities/Permission";

export interface CreatePermissionDto {
  resource: PermissionResource;
  action: PermissionAction;
  scope: PermissionScope;
}

export interface PermissionFilters {
  resource?: PermissionResource;
  action?: PermissionAction;
  scope?: PermissionScope;
}

export interface IPermissionRepository {
  // Queries
  findById(id: string): Promise<Permission | null>;
  findByAttributes(resource: PermissionResource, action: PermissionAction, scope: PermissionScope): Promise<Permission | null>;
  findAll(filters?: PermissionFilters): Promise<Permission[]>;
  findByResource(resource: PermissionResource): Promise<Permission[]>;

  // Commands
  create(data: CreatePermissionDto): Promise<Permission>;
  delete(id: string): Promise<void>;

  // Bulk operations
  createMany(data: CreatePermissionDto[]): Promise<Permission[]>;
}
