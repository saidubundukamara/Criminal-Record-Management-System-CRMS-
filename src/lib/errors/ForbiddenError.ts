/**
 * Forbidden Error (HTTP 403)
 *
 * Thrown when user is authenticated but lacks permission for the action.
 * Used for RBAC permission checks.
 */
import { AppError } from "./AppError";

export class ForbiddenError extends AppError {
  public readonly requiredPermission?: string;

  constructor(message: string = "Forbidden", requiredPermission?: string) {
    super(message, 403, true);
    this.requiredPermission = requiredPermission;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      requiredPermission: this.requiredPermission,
    };
  }
}
