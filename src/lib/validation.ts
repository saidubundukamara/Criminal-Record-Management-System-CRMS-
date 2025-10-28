/**
 * Validation Schemas
 *
 * Zod schemas for input validation across the application.
 * Pan-African Design: Flexible validation that adapts to different countries
 */
import { z } from "zod";

/**
 * Officer validation schemas
 */
export const officerBadgeSchema = z
  .string()
  .min(3, "Badge number must be at least 3 characters")
  .max(20, "Badge number must not exceed 20 characters")
  .regex(/^[A-Z0-9-]+$/, "Badge must contain only uppercase letters, numbers, and hyphens");

export const officerPINSchema = z
  .string()
  .length(8, "PIN must be exactly 8 digits")
  .regex(/^\d+$/, "PIN must contain only digits")
  .refine((pin) => !/^(\d)\1+$/.test(pin), "PIN cannot be all the same digit")
  .refine(
    (pin) => !["12345678", "87654321", "11111111", "00000000"].includes(pin),
    "PIN is too common"
  );

export const createOfficerSchema = z.object({
  badge: officerBadgeSchema,
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional()
    .nullable(),
  pin: officerPINSchema,
  roleId: z.string().uuid("Invalid role ID"),
  stationId: z.string().uuid("Invalid station ID"),
});

export const updateOfficerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .nullable(),
  roleId: z.string().uuid().optional(),
  stationId: z.string().uuid().optional(),
  active: z.boolean().optional(),
  mfaEnabled: z.boolean().optional(),
});

/**
 * Authentication validation schemas
 */
export const loginSchema = z.object({
  badge: officerBadgeSchema,
  pin: officerPINSchema,
});

export const changePINSchema = z.object({
  oldPin: officerPINSchema,
  newPin: officerPINSchema,
});

export const resetPINSchema = z.object({
  officerId: z.string().uuid("Invalid officer ID"),
  newPin: officerPINSchema,
});

/**
 * Station validation schemas
 * Pan-African Design: Station codes adapt to different country formats
 */
export const stationCodeSchema = z
  .string()
  .min(3, "Station code must be at least 3 characters")
  .max(20, "Station code must not exceed 20 characters")
  .regex(/^[A-Z0-9-]+$/, "Station code must contain only uppercase letters, numbers, and hyphens");

export const createStationSchema = z.object({
  name: z.string().min(3, "Station name must be at least 3 characters").max(100),
  code: stationCodeSchema,
  location: z.string().min(3).max(200),
  district: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  countryCode: z.string().length(3, "Country code must be 3 characters (ISO 3166-1 alpha-3)").optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional()
    .nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

/**
 * Role validation schemas
 */
export const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters").max(50),
  description: z.string().max(500).optional().nullable(),
  level: z.number().int().min(1).max(10),
});

/**
 * Permission validation schemas
 */
export const permissionResourceSchema = z.enum([
  "cases",
  "persons",
  "evidence",
  "officers",
  "stations",
  "alerts",
  "bgcheck",
  "reports",
]);

export const permissionActionSchema = z.enum([
  "create",
  "read",
  "update",
  "delete",
  "export",
]);

export const permissionScopeSchema = z.enum([
  "own",
  "station",
  "region",
  "national",
]);

export const createPermissionSchema = z.object({
  resource: permissionResourceSchema,
  action: permissionActionSchema,
  scope: permissionScopeSchema,
});

/**
 * General validation helpers
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

export const dateSchema = z.coerce.date();

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * National ID validation
 * Pan-African Design: Flexible to support different national ID formats
 */
export function createNationalIdSchema(countryCode: string = "SLE") {
  // Different countries have different ID formats
  // This can be extended based on country configuration
  const formats: Record<string, RegExp> = {
    SLE: /^NIN-\d{9}$/, // Sierra Leone NIN
    GHA: /^GHA-\d{9}-\d$/, // Ghana Card
    NGA: /^\d{11}$/, // Nigerian NIN
    KEN: /^\d{8}$/, // Kenyan Huduma Namba
    ZAF: /^\d{13}$/, // South African ID
  };

  const format = formats[countryCode] || /.+/; // Default to any non-empty string

  return z
    .string()
    .min(5, "National ID must be at least 5 characters")
    .max(20, "National ID must not exceed 20 characters")
    .regex(format, `Invalid ${countryCode} national ID format`);
}

/**
 * Validate and parse input with Zod schema
 * Throws ValidationError if validation fails
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.flatten();
    throw new Error(
      `Validation failed: ${JSON.stringify(errors.fieldErrors)}`
    );
  }

  return result.data;
}
