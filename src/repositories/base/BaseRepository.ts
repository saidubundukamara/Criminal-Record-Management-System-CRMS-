/**
 * Base Repository
 *
 * Abstract base class for all repositories.
 * Provides common error handling and utility methods.
 *
 * Pan-African Design: Generic error handling that works across all deployments
 */
import { PrismaClient } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/src/lib/errors";

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  /**
   * Handle Prisma errors and convert to domain errors
   * Centralizes error handling across all repositories
   */
  protected handleError(error: any, context?: string): never {
    // Log error for debugging (in production, use proper logging service)
    console.error(`Repository error${context ? ` (${context})` : ""}:`, error);

    // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference
    if (error.code === "P2002") {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || "field";
      throw new ValidationError(
        `A record with this ${field} already exists`,
        field
      );
    }

    if (error.code === "P2025") {
      // Record not found
      throw new NotFoundError("Record not found");
    }

    if (error.code === "P2003") {
      // Foreign key constraint failed
      throw new ValidationError(
        "Invalid reference: related record does not exist"
      );
    }

    if (error.code === "P2014") {
      // Invalid ID
      throw new ValidationError("Invalid ID provided");
    }

    // Rethrow if already a domain error
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    // Generic database error
    throw new Error(
      `Database operation failed: ${error.message || "Unknown error"}`
    );
  }

  /**
   * Execute operation with error handling
   * Wrapper for all repository operations
   */
  protected async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
    }
  }

  /**
   * Build pagination parameters for Prisma queries
   */
  protected buildPagination(page?: number, limit?: number) {
    if (!page || !limit) return {};

    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit,
    };
  }

  /**
   * Calculate total pages from count and limit
   */
  protected calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }
}
