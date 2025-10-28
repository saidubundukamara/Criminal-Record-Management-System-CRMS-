/**
 * Not Found Error (HTTP 404)
 *
 * Thrown when a requested resource doesn't exist.
 * Used by repositories and services when entities are not found.
 */
import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  public readonly entityType?: string;
  public readonly entityId?: string;

  constructor(
    message: string = "Resource not found",
    entityType?: string,
    entityId?: string
  ) {
    super(message, 404, true);
    this.entityType = entityType;
    this.entityId = entityId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      entityType: this.entityType,
      entityId: this.entityId,
    };
  }
}
