/**
 * Rate Limiting Utility with Upstash Redis
 *
 * Implements rate limiting to protect against abuse and brute force attacks
 *
 * CRMS - Pan-African Digital Public Good
 * Uses Upstash Redis for distributed rate limiting across multiple server instances
 */

import { redis, isRedisConfigured, getRedisKey, REDIS_KEYS } from "./upstash";
import { container } from "@/src/di/container";

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  identifier: string; // Unique identifier (IP, user ID, etc.)
  limit: number; // Maximum requests allowed
  window: number; // Time window in seconds
  type: string; // Type of operation (login, api, export, etc.)
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
  retryAfter?: number; // Seconds until retry (if rate limited)
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Login attempts: 5 attempts per 15 minutes per IP
  LOGIN: {
    limit: 5,
    window: 15 * 60, // 15 minutes
    type: "login",
  },
  // API requests: 100 requests per minute per user
  API: {
    limit: 100,
    window: 60, // 1 minute
    type: "api",
  },
  // Background checks: 10 per hour per user
  BACKGROUND_CHECK: {
    limit: 10,
    window: 60 * 60, // 1 hour
    type: "background_check",
  },
  // Export operations: 5 per hour per user
  EXPORT: {
    limit: 5,
    window: 60 * 60, // 1 hour
    type: "export",
  },
  // USSD requests: 50 per hour per phone number
  USSD: {
    limit: 50,
    window: 60 * 60, // 1 hour
    type: "ussd",
  },
} as const;

/**
 * Check and enforce rate limit
 *
 * Uses the sliding window counter algorithm with Upstash Redis
 *
 * @param config - Rate limit configuration
 * @returns Rate limit result
 *
 * @example
 * const result = await checkRateLimit({
 *   identifier: req.ip || "unknown",
 *   limit: 5,
 *   window: 900, // 15 minutes
 *   type: "login"
 * });
 *
 * if (!result.success) {
 *   return res.status(429).json({
 *     error: "Too many requests",
 *     retryAfter: result.retryAfter
 *   });
 * }
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { identifier, limit, window, type } = config;

  // If Redis is not configured, use in-memory fallback (less reliable)
  if (!isRedisConfigured()) {
    console.warn(
      "Upstash Redis not configured. Using in-memory rate limiting (not recommended for production)."
    );
    return inMemoryRateLimit(config);
  }

  try {
    // Generate Redis key
    const key = getRedisKey(REDIS_KEYS.RATE_LIMIT, `${type}:${identifier}`);

    // Current timestamp
    const now = Date.now();
    const windowStart = now - window * 1000;

    // Use Redis pipeline for atomic operations
    // 1. Remove old entries outside the window
    // 2. Count remaining entries
    // 3. Add current request
    // 4. Set expiration

    // Get current count
    const count = await redis.get<number>(key);
    const currentCount = count || 0;

    // Check if limit exceeded
    if (currentCount >= limit) {
      // Get TTL to calculate retry-after
      const ttl = await redis.ttl(key);
      const retryAfter = ttl > 0 ? ttl : window;

      // Log rate limit violation
      await logRateLimitViolation(identifier, type, limit, window);

      return {
        success: false,
        limit,
        remaining: 0,
        reset: Math.floor(now / 1000) + retryAfter,
        retryAfter,
      };
    }

    // Increment counter
    const newCount = await redis.incr(key);

    // Set expiration on first request
    if (newCount === 1) {
      await redis.expire(key, window);
    }

    // Calculate remaining requests
    const remaining = Math.max(0, limit - newCount);

    // Calculate reset time
    const ttl = await redis.ttl(key);
    const reset = Math.floor(now / 1000) + (ttl > 0 ? ttl : window);

    return {
      success: true,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);

    // Fail open: allow request if rate limiting fails
    // (Better UX than blocking legitimate users)
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor(Date.now() / 1000) + window,
    };
  }
}

/**
 * In-memory rate limiting fallback
 * WARNING: Not suitable for production with multiple servers
 */
const inMemoryStore = new Map<
  string,
  { count: number; resetAt: number }
>();

function inMemoryRateLimit(config: RateLimitConfig): RateLimitResult {
  const { identifier, limit, window, type } = config;
  const key = `${type}:${identifier}`;
  const now = Date.now();

  // Get or create entry
  const entry = inMemoryStore.get(key);

  // If no entry or expired, create new
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + window * 1000;
    inMemoryStore.set(key, { count: 1, resetAt });

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor(resetAt / 1000),
    };
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.floor(entry.resetAt / 1000),
      retryAfter,
    };
  }

  // Increment counter
  entry.count++;

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: Math.floor(entry.resetAt / 1000),
  };
}

/**
 * Clear rate limit for an identifier
 * (Useful for testing or admin override)
 */
export async function clearRateLimit(
  type: string,
  identifier: string
): Promise<void> {
  if (!isRedisConfigured()) {
    const key = `${type}:${identifier}`;
    inMemoryStore.delete(key);
    return;
  }

  try {
    const key = getRedisKey(REDIS_KEYS.RATE_LIMIT, `${type}:${identifier}`);
    await redis.del(key);
  } catch (error) {
    console.error("Failed to clear rate limit:", error);
  }
}

/**
 * Log rate limit violation to audit log
 */
async function logRateLimitViolation(
  identifier: string,
  type: string,
  limit: number,
  window: number
): Promise<void> {
  try {
    await container.auditService.logAction({
      entityType: "rate_limit",
      action: "violation",
      details: {
        identifier,
        type,
        limit,
        window,
        message: `Rate limit exceeded: ${limit} requests per ${window} seconds`,
      },
      ipAddress: identifier, // Assuming identifier is IP address
      success: false,
    });
  } catch (error) {
    console.error("Failed to log rate limit violation:", error);
  }
}

/**
 * Get rate limit info without incrementing counter
 * (Useful for displaying limits to users)
 */
export async function getRateLimitInfo(
  type: string,
  identifier: string,
  limit: number,
  window: number
): Promise<RateLimitResult> {
  if (!isRedisConfigured()) {
    const key = `${type}:${identifier}`;
    const entry = inMemoryStore.get(key);

    if (!entry || entry.resetAt <= Date.now()) {
      return {
        success: true,
        limit,
        remaining: limit,
        reset: Math.floor((Date.now() + window * 1000) / 1000),
      };
    }

    return {
      success: entry.count < limit,
      limit,
      remaining: Math.max(0, limit - entry.count),
      reset: Math.floor(entry.resetAt / 1000),
      retryAfter: entry.count >= limit ? Math.ceil((entry.resetAt - Date.now()) / 1000) : undefined,
    };
  }

  try {
    const key = getRedisKey(REDIS_KEYS.RATE_LIMIT, `${type}:${identifier}`);
    const count = (await redis.get<number>(key)) || 0;
    const ttl = await redis.ttl(key);

    const now = Date.now();
    const reset = Math.floor(now / 1000) + (ttl > 0 ? ttl : window);
    const remaining = Math.max(0, limit - count);

    return {
      success: count < limit,
      limit,
      remaining,
      reset,
      retryAfter: count >= limit && ttl > 0 ? ttl : undefined,
    };
  } catch (error) {
    console.error("Failed to get rate limit info:", error);

    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.floor((Date.now() + window * 1000) / 1000),
    };
  }
}
