/**
 * Common Domain Types
 *
 * Shared types used across the domain layer.
 * Pan-African Design: Generic types that work across different countries
 */

export type UUID = string;

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Audit information for entities
 */
export interface AuditInfo {
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

/**
 * Operation result wrapper
 */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Success result helper
 */
export function successResult<T>(data?: T, message?: string): OperationResult<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Error result helper
 */
export function errorResult(error: string, message?: string): OperationResult {
  return {
    success: false,
    error,
    message,
  };
}
