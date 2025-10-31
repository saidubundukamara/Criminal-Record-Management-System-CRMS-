/**
 * Input Sanitization Utility
 *
 * Sanitize and validate user inputs to prevent XSS and injection attacks
 *
 * CRMS - Pan-African Digital Public Good
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 *
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return "";

  return (
    input
      // Remove null bytes
      .replace(/\0/g, "")
      // Trim whitespace
      .trim()
      // Normalize whitespace
      .replace(/\s+/g, " ")
  );
}

/**
 * Sanitize HTML by escaping dangerous characters
 *
 * Prevents XSS attacks by escaping HTML special characters
 *
 * @param input - Input string that may contain HTML
 * @returns Escaped string safe for HTML rendering
 *
 * @example
 * sanitizeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Strip HTML tags from input
 *
 * @param input - Input string with potential HTML tags
 * @returns String with HTML tags removed
 *
 * @example
 * stripHtml('<p>Hello <strong>world</strong></p>')
 * // Returns: 'Hello world'
 */
export function stripHtml(input: string): string {
  if (!input) return "";

  return input.replace(/<[^>]*>/g, "").trim();
}

/**
 * Validate and sanitize National ID (NIN)
 *
 * Pan-African design: Configurable for different national ID formats
 *
 * @param nin - National Identification Number
 * @param countryCode - ISO 3166-1 alpha-3 country code (default: SLE for Sierra Leone)
 * @returns Sanitized NIN or null if invalid
 *
 * @example
 * sanitizeNIN("1234567890", "SLE") // Sierra Leone
 * sanitizeNIN("12345678901", "GHA") // Ghana
 */
export function sanitizeNIN(
  nin: string,
  countryCode: string = process.env.COUNTRY_CODE || "SLE"
): string | null {
  if (!nin) return null;

  // Remove whitespace and convert to uppercase
  const cleaned = nin.replace(/\s+/g, "").toUpperCase();

  // Validation rules by country (extensible for pan-African deployment)
  const validationRules: Record<string, { pattern: RegExp; length?: number }> =
    {
      SLE: { pattern: /^[A-Z0-9]+$/, length: 10 }, // Sierra Leone: 10 alphanumeric
      GHA: { pattern: /^GHA-\d{9}-\d$/ }, // Ghana Card: GHA-XXXXXXXXX-X
      NGA: { pattern: /^\d{11}$/ }, // Nigeria: 11 digits
      KEN: { pattern: /^\d{7,8}$/ }, // Kenya: 7-8 digits
      ZAF: { pattern: /^\d{13}$/ }, // South Africa: 13 digits
      // Add more countries as needed
    };

  const rule = validationRules[countryCode];
  if (!rule) {
    // Unknown country, allow alphanumeric with basic sanitization
    return /^[A-Z0-9-]+$/.test(cleaned) ? cleaned : null;
  }

  // Validate against country-specific pattern
  if (!rule.pattern.test(cleaned)) {
    return null;
  }

  // Validate length if specified
  if (rule.length && cleaned.length !== rule.length) {
    return null;
  }

  return cleaned;
}

/**
 * Validate and sanitize phone number
 *
 * Pan-African design: Supports international format
 *
 * @param phone - Phone number
 * @returns Sanitized phone number in E.164 format or null if invalid
 *
 * @example
 * sanitizePhoneNumber("+23276123456") // Sierra Leone
 * sanitizePhoneNumber("0761234567") // Local format
 */
export function sanitizePhoneNumber(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Ensure it starts with + (E.164 format)
  if (!cleaned.startsWith("+")) {
    // Try to add country code based on configuration
    const countryCode = process.env.COUNTRY_CODE || "SLE";

    // Country code mapping
    const countryPhoneCodes: Record<string, string> = {
      SLE: "+232", // Sierra Leone
      GHA: "+233", // Ghana
      NGA: "+234", // Nigeria
      KEN: "+254", // Kenya
      ZAF: "+27", // South Africa
      // Add more countries
    };

    const phoneCode = countryPhoneCodes[countryCode] || "+232";

    // Remove leading 0 if present (local format)
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    cleaned = phoneCode + cleaned;
  }

  // Validate E.164 format: +[1-9]\d{1,14}
  if (!/^\+[1-9]\d{1,14}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Validate and sanitize email address
 *
 * @param email - Email address
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;

  // Convert to lowercase and trim
  const cleaned = email.toLowerCase().trim();

  // Validate email format (RFC 5322 simplified)
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!emailRegex.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Validate and sanitize file name
 *
 * Prevents directory traversal and dangerous characters
 *
 * @param filename - File name
 * @returns Sanitized file name or null if invalid
 */
export function sanitizeFileName(filename: string): string | null {
  if (!filename) return null;

  // Remove path separators (prevent directory traversal)
  let cleaned = filename.replace(/[/\\]/g, "");

  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, "");

  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1f\x80-\x9f]/g, "");

  // Remove potentially dangerous characters
  cleaned = cleaned.replace(/[<>:"|?*]/g, "");

  // Ensure filename is not empty after sanitization
  if (!cleaned || cleaned.length === 0) {
    return null;
  }

  // Ensure filename has valid extension
  if (!/\.[a-z0-9]+$/i.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Validate file upload
 *
 * @param file - File object
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSizeBytes - Maximum file size in bytes
 * @returns Validation result
 */
export function validateFileUpload(
  file: { name: string; size: number; type: string },
  allowedTypes: string[],
  maxSizeBytes: number
): { valid: boolean; error?: string } {
  // Validate file name
  const sanitizedName = sanitizeFileName(file.name);
  if (!sanitizedName) {
    return { valid: false, error: "Invalid file name" };
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Validate file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize SQL-like input (basic protection)
 *
 * NOTE: This is not a substitute for parameterized queries!
 * Prisma already handles SQL injection prevention.
 * This is for additional defense-in-depth.
 *
 * @param input - Input string
 * @returns Sanitized string
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return "";

  // Remove SQL keywords and special characters
  return input
    .replace(/['";\\]/g, "") // Remove quotes and backslash
    .replace(/--/g, "") // Remove SQL comments
    .replace(/\/\*/g, "") // Remove multi-line comment start
    .replace(/\*\//g, "") // Remove multi-line comment end
    .trim();
}

/**
 * Sanitize JSON input
 *
 * @param input - JSON string
 * @returns Parsed and sanitized JSON object or null if invalid
 */
export function sanitizeJson<T = any>(input: string): T | null {
  if (!input) return null;

  try {
    const parsed = JSON.parse(input);

    // Basic validation: must be object or array
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Sanitize URL
 *
 * Prevents open redirect vulnerabilities
 *
 * @param url - URL string
 * @param allowedDomains - Array of allowed domains (optional)
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(
  url: string,
  allowedDomains?: string[]
): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    // If allowed domains specified, validate domain
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = parsed.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(
        (domain) =>
          hostname === domain.toLowerCase() ||
          hostname.endsWith(`.${domain.toLowerCase()}`)
      );

      if (!isAllowed) {
        return null;
      }
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Rate limit identifier sanitization
 *
 * Ensures rate limit identifiers (IP addresses, user IDs) are valid
 *
 * @param identifier - Rate limit identifier
 * @returns Sanitized identifier or null
 */
export function sanitizeRateLimitIdentifier(
  identifier: string
): string | null {
  if (!identifier) return null;

  // Remove whitespace
  const cleaned = identifier.trim();

  // Validate IPv4 or IPv6 address or UUID
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (
    ipv4Regex.test(cleaned) ||
    ipv6Regex.test(cleaned) ||
    uuidRegex.test(cleaned)
  ) {
    return cleaned;
  }

  // Allow alphanumeric identifiers
  if (/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}
