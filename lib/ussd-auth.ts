/**
 * USSD Authentication Library
 *
 * Handles officer phone registration, Quick PIN authentication, and whitelisting
 * for USSD access to criminal records system
 *
 * Security Features:
 * - Phone number binding to officer accounts
 * - 4-digit Quick PIN (hashed with Argon2id)
 * - Admin-controlled whitelisting (ussdEnabled flag)
 * - Rate limiting integration
 * - Full audit logging
 */

import { PrismaClient } from "@prisma/client";
import { hash, verify } from "argon2";

const prisma = new PrismaClient();

/**
 * Result of officer phone registration
 */
export interface RegistrationResult {
  success: boolean;
  quickPin?: string; // Only returned on successful registration
  officer?: {
    id: string;
    badge: string;
    name: string;
    stationName: string;
  };
  error?: string;
}

/**
 * Result of Quick PIN authentication
 */
export interface AuthenticationResult {
  success: boolean;
  officer?: {
    id: string;
    badge: string;
    name: string;
    stationId: string;
    stationName: string;
    stationCode: string;
    roleLevel: number;
    ussdDailyLimit: number;
  };
  error?: string;
}

/**
 * Register officer's phone number for USSD access
 *
 * Process:
 * 1. Verify officer exists with badge and 8-digit PIN
 * 2. Check phone not already registered to another officer
 * 3. Generate random 4-digit Quick PIN
 * 4. Hash Quick PIN with Argon2id
 * 5. Store phone binding and auto-enable USSD access
 * 6. Return Quick PIN (shown once only)
 */
export async function registerOfficerPhone(
  badge: string,
  phoneNumber: string,
  pin: string
): Promise<RegistrationResult> {
  try {
    // Validate phone number format (E.164)
    if (!isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format. Use E.164 format (e.g., +2327812345678)",
      };
    }

    // Step 1: Find officer by badge and verify PIN
    const officer = await prisma.officer.findUnique({
      where: { badge },
      include: {
        station: true,
        role: true,
      },
    });

    if (!officer) {
      return {
        success: false,
        error: "Invalid badge number",
      };
    }

    if (!officer.active) {
      return {
        success: false,
        error: "Officer account is inactive",
      };
    }

    // Verify 8-digit PIN
    const pinValid = await verify(officer.pinHash, pin);
    if (!pinValid) {
      return {
        success: false,
        error: "Invalid PIN",
      };
    }

    // Step 2: Check if phone is already registered to another officer
    const existingPhone = await prisma.officer.findFirst({
      where: {
        ussdPhoneNumber: phoneNumber,
        NOT: {
          id: officer.id, // Allow re-registration by same officer
        },
      },
    });

    if (existingPhone) {
      return {
        success: false,
        error: "Phone number already registered to another officer",
      };
    }

    // Step 3: Generate random 4-digit Quick PIN
    const quickPin = Math.floor(1000 + Math.random() * 9000).toString();

    // Step 4: Hash Quick PIN
    const quickPinHash = await hash(quickPin);

    // Step 5: Update officer record
    await prisma.officer.update({
      where: { id: officer.id },
      data: {
        ussdPhoneNumber: phoneNumber,
        ussdQuickPinHash: quickPinHash,
        ussdEnabled: true, // Auto-enable on registration
        ussdRegisteredAt: new Date(),
      },
    });

    // Step 6: Return success with Quick PIN
    return {
      success: true,
      quickPin,
      officer: {
        id: officer.id,
        badge: officer.badge,
        name: officer.name,
        stationName: officer.station.name,
      },
    };
  } catch (error) {
    console.error("[USSD Registration Error]", error);
    return {
      success: false,
      error: "Registration failed. Please try again.",
    };
  }
}

/**
 * Authenticate officer using phone number and Quick PIN
 *
 * Process:
 * 1. Find officer by phone number
 * 2. Verify USSD is enabled (whitelist check)
 * 3. Verify account is active
 * 4. Verify Quick PIN
 * 5. Update last used timestamp
 * 6. Return officer data for session
 */
export async function authenticateQuickPin(
  phoneNumber: string,
  quickPin: string
): Promise<AuthenticationResult> {
  try {
    // Validate Quick PIN format
    if (!isValidQuickPin(quickPin)) {
      return {
        success: false,
        error: "Invalid Quick PIN format. Must be 4 digits.",
      };
    }

    // Step 1: Find officer by phone number
    const officer = await prisma.officer.findFirst({
      where: { ussdPhoneNumber: phoneNumber },
      include: {
        station: true,
        role: true,
      },
    });

    if (!officer) {
      return {
        success: false,
        error: "Phone number not registered",
      };
    }

    // Step 2: Check if USSD is enabled (whitelist check)
    if (!officer.ussdEnabled) {
      return {
        success: false,
        error: "USSD access disabled. Contact your station commander.",
      };
    }

    // Step 3: Check if account is active
    if (!officer.active) {
      return {
        success: false,
        error: "Officer account is inactive",
      };
    }

    // Ensure Quick PIN hash exists
    if (!officer.ussdQuickPinHash) {
      return {
        success: false,
        error: "USSD not properly configured. Please re-register.",
      };
    }

    // Step 4: Verify Quick PIN
    const pinValid = await verify(officer.ussdQuickPinHash, quickPin);
    if (!pinValid) {
      return {
        success: false,
        error: "Invalid Quick PIN",
      };
    }

    // Step 5: Update last used timestamp
    await prisma.officer.update({
      where: { id: officer.id },
      data: {
        ussdLastUsed: new Date(),
      },
    });

    // Step 6: Return officer data
    return {
      success: true,
      officer: {
        id: officer.id,
        badge: officer.badge,
        name: officer.name,
        stationId: officer.stationId,
        stationName: officer.station.name,
        stationCode: officer.station.code,
        roleLevel: officer.role.level,
        ussdDailyLimit: officer.ussdDailyLimit,
      },
    };
  } catch (error) {
    console.error("[USSD Authentication Error]", error);
    return {
      success: false,
      error: "Authentication failed. Please try again.",
    };
  }
}

/**
 * Check if phone number is whitelisted for USSD access
 *
 * Three-layer verification:
 * 1. Phone number is registered (ussdPhoneNumber exists)
 * 2. USSD access is enabled (ussdEnabled = true)
 * 3. Officer account is active (active = true)
 *
 * Returns false on error (fail-closed security)
 */
export async function isPhoneWhitelisted(phoneNumber: string): Promise<boolean> {
  try {
    const officer = await prisma.officer.findFirst({
      where: {
        ussdPhoneNumber: phoneNumber,
        ussdEnabled: true,
        active: true,
      },
    });

    return !!officer;
  } catch (error) {
    console.error("[USSD Whitelist Check Error]", error);
    return false; // Fail closed on error
  }
}

/**
 * Reset officer's Quick PIN (admin action)
 *
 * Process:
 * 1. Verify officer exists and has USSD configured
 * 2. Validate new Quick PIN format
 * 3. Hash new Quick PIN
 * 4. Update officer record
 * 5. Log admin action (for audit trail)
 *
 * Note: If newPin is empty, generate a random one
 */
export async function resetQuickPin(
  officerId: string,
  adminId: string,
  newPin?: string
): Promise<{ success: boolean; quickPin?: string; error?: string }> {
  try {
    // Step 1: Verify officer exists
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
    });

    if (!officer) {
      return {
        success: false,
        error: "Officer not found",
      };
    }

    if (!officer.ussdPhoneNumber) {
      return {
        success: false,
        error: "Officer does not have USSD configured",
      };
    }

    // Step 2: Generate or validate new Quick PIN
    let quickPin: string;
    if (newPin) {
      if (!isValidQuickPin(newPin)) {
        return {
          success: false,
          error: "Invalid Quick PIN format. Must be 4 digits.",
        };
      }
      quickPin = newPin;
    } else {
      // Generate random 4-digit PIN
      quickPin = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Step 3: Hash new Quick PIN
    const quickPinHash = await hash(quickPin);

    // Step 4: Update officer record
    await prisma.officer.update({
      where: { id: officerId },
      data: {
        ussdQuickPinHash: quickPinHash,
      },
    });

    // Step 5: Log admin action (optional - could add to AuditLog)
    console.log(
      `[USSD] Admin ${adminId} reset Quick PIN for officer ${officer.badge}`
    );

    return {
      success: true,
      quickPin, // Return the new PIN
    };
  } catch (error) {
    console.error("[USSD Reset PIN Error]", error);
    return {
      success: false,
      error: "Failed to reset Quick PIN. Please try again.",
    };
  }
}

/**
 * Validate Quick PIN format (4 digits)
 */
export function isValidQuickPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Validate phone number format (E.164 format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("232")) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith("0")) {
    return `+232${cleaned.slice(1)}`;
  }
  return `+${cleaned}`;
}
