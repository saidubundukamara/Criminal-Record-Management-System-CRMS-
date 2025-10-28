/**
 * Unauthorized Error (HTTP 401)
 *
 * Thrown when authentication fails or is required but not provided.
 * Used for invalid credentials, expired tokens, etc.
 */
import { AppError } from "./AppError";

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, true);
  }
}
