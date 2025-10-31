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

import { hash, verify } from "argon2";
import { PrismaClient } from "@prisma/client";

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
 * 1. Verify badge + 8-digit PIN via normal auth
 * 2. Check phone not already registered
 * 3. Generate 4-digit Quick PIN
 * 4. Hash Quick PIN with Argon2id
 * 5. Store phone binding
 * 6. Return Quick PIN to officer (one-time display)
 *
 * @param badgeNumber - Officer's badge number
 * @param pin - Officer's 8-digit PIN
 * @param phoneNumber - Phone number to register (E.164 format recommended)
 * @returns Registration result with Quick PIN if successful
 */
export async function registerOfficerPhone(
  badgeNumber: string,
  pin: string,
  phoneNumber: string
): Promise<RegistrationResult> {
  try {
    // 1. Verify badge + PIN via normal auth
    const officer = await prisma.officer.findUnique({
      where: { badge: badgeNumber },
      include: {
        role: true,
        station: true,
      },
    });

    if (!officer) {
      return {
        success: false,
        error: "Invalid badge number",
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

    // Check if officer is active
    if (!officer.active) {
      return {
        success: false,
        error: "Officer account is inactive",
      };
    }

    // 2. Check if phone already registered to another officer
    const existingPhone = await prisma.officer.findFirst({
      where: {
        ussdPhoneNumber: phoneNumber,
        NOT: { id: officer.id }, // Allow re-registration for same officer
      },
    });

    if (existingPhone) {
      return {
        success: false,
        error: "Phone number already registered to another officer",
      };
    }

    // 3. Generate 4-digit Quick PIN (1000-9999)
    const quickPin = Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Hash Quick PIN with Argon2id
    const quickPinHash = await hash(quickPin, {
      type: 2, // Argon2id
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    // 5. Update officer record with phone binding
    await prisma.officer.update({
      where: { id: officer.id },
      data: {
        ussdPhoneNumber: phoneNumber,
        ussdQuickPinHash: quickPinHash,
        ussdRegisteredAt: new Date(),
        ussdEnabled: true, // Auto-enable on registration (admin can disable later)
      },
    });

    // 6. Return success with Quick PIN
    return {
      success: true,
      quickPin, // Officer must save this - won't be shown again
      officer: {
        id: officer.id,
        badge: officer.badge,
        name: officer.name,
        stationName: officer.station.name,
      },
    };
  } catch (error) {
    console.error("USSD registration error:", error);
    return {
      success: false,
      error: "Registration failed. Please try again.",
    };
  }
}

/**
 * Authenticate officer using phone number + 4-digit Quick PIN
 *
 * Security checks:
 * - Phone must be registered
 * - Quick PIN must match hash
 * - Officer must have ussdEnabled = true
 * - Officer account must be active
 *
 * @param phoneNumber - Registered phone number
 * @param quickPin - 4-digit Quick PIN
 * @returns Authentication result with officer data if successful
 */
export async function authenticateQuickPin(
  phoneNumber: string,
  quickPin: string
): Promise<AuthenticationResult> {
  try {
    // Find officer by phone number
    const officer = await prisma.officer.findFirst({
      where: { ussdPhoneNumber: phoneNumber },
      include: {
        role: true,
        station: true,
      },
    });

    if (!officer) {
      return {
        success: false,
        error: "Phone number not registered",
      };
    }

    // Check if USSD access is enabled
    if (!officer.ussdEnabled) {
      return {
        success: false,
        error: "USSD access disabled. Contact your station commander.",
      };
    }

    // Check if officer account is active
    if (!officer.active) {
      return {
        success: false,
        error: "Officer account is inactive",
      };
    }

    // Check if Quick PIN is set
    if (!officer.ussdQuickPinHash) {
      return {
        success: false,
        error: "Quick PIN not set. Please re-register.",
      };
    }

    // Verify Quick PIN
    const pinValid = await verify(officer.ussdQuickPinHash, quickPin);
    if (!pinValid) {
      return {
        success: false,
        error: "Invalid Quick PIN",
      };
    }

    // Update last used timestamp
    await prisma.officer.update({
      where: { id: officer.id },
      data: { ussdLastUsed: new Date() },
    });

    // Return success with officer data
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
    console.error("USSD authentication error:", error);
    return {
      success: false,
      error: "Authentication failed. Please try again.",
    };
  }
}

/**
 * Check if phone number is whitelisted for USSD access
 *
 * Whitelisting criteria:
 * - Phone number is registered to an officer
 * - Officer has ussdEnabled = true
 * - Officer account is active
 *
 * @param phoneNumber - Phone number to check
 * @returns True if whitelisted, false otherwise
 */
export async function isPhoneWhitelisted(
  phoneNumber: string
): Promise<boolean> {
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
    console.error("Whitelist check error:", error);
    return false;
  }
}

/**
 * Reset officer's Quick PIN
 * Requires badge + 8-digit PIN verification
 *
 * @param badgeNumber - Officer's badge number
 * @param pin - Officer's 8-digit PIN
 * @returns New Quick PIN if successful
 */
export async function resetQuickPin(
  badgeNumber: string,
  pin: string
): Promise<RegistrationResult> {
  try {
    // Verify officer
    const officer = await prisma.officer.findUnique({
      where: { badge: badgeNumber },
      include: { station: true },
    });

    if (!officer) {
      return {
        success: false,
        error: "Invalid badge number",
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

    // Check if phone is registered
    if (!officer.ussdPhoneNumber) {
      return {
        success: false,
        error: "No phone registered. Please register first.",
      };
    }

    // Generate new 4-digit Quick PIN
    const quickPin = Math.floor(1000 + Math.random() * 9000).toString();
    const quickPinHash = await hash(quickPin, {
      type: 2,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    // Update Quick PIN hash
    await prisma.officer.update({
      where: { id: officer.id },
      data: { ussdQuickPinHash: quickPinHash },
    });

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
    console.error("Quick PIN reset error:", error);
    return {
      success: false,
      error: "Reset failed. Please try again.",
    };
  }
}

/**
 * Validate Quick PIN format
 * Must be exactly 4 digits
 */
export function isValidQuickPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Validate phone number format
 * Basic E.164 validation: + followed by 7-15 digits
 */
export function isValidPhoneNumber(phone: string): boolean {
  return /^\+\d{7,15}$/.test(phone);
}

/**
 * Format phone number to E.164
 * Adds + prefix if missing and removes spaces/dashes
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");

  // Add + prefix if not present
  if (!phone.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}
