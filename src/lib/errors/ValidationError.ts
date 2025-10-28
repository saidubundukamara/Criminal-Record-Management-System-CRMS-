/**
 * Validation Error (HTTP 400)
 *
 * Thrown when input validation fails.
 * Used by services to indicate invalid data from the user.
 */
import { AppError } from "./AppError";

export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string,
    field?: string,
    validationErrors?: Record<string, string[]>
  ) {
    super(message, 400, true);
    this.field = field;
    this.validationErrors = validationErrors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      validationErrors: this.validationErrors,
    };
  }
}
