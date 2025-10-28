/**
 * Encryption Utilities
 *
 * AES-256 encryption for PII (Personally Identifiable Information).
 * Used to encrypt sensitive data like addresses, phone numbers, emails in the database.
 *
 * Pan-African Design: Strong encryption standards compliant with GDPR and Malabo Convention
 */
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment
 * Must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  if (key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns base64-encoded encrypted data with IV and auth tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return "";
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine IV + encrypted data + auth tag
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, "hex"),
      authTag,
    ]);

    return combined.toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string encrypted with encrypt()
 * Expects base64-encoded data with IV and auth tag
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return "";
  }

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, "base64");

    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash a value using SHA-256 (for fingerprints, biometric data, etc.)
 * One-way hashing - cannot be decrypted
 */
export function hash(value: string): string {
  if (!value) {
    return "";
  }

  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Generate a cryptographically secure random encryption key
 * Use this to generate ENCRYPTION_KEY for .env
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

/**
 * Helper function to encrypt PII fields
 * Returns null if input is null or undefined
 */
export function encryptPII(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return encrypt(value);
}

/**
 * Helper function to decrypt PII fields
 * Returns null if input is null or undefined
 */
export function decryptPII(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return decrypt(value);
}
