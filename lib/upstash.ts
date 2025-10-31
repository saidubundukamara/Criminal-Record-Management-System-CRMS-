/**
 * Upstash Redis Client Configuration
 *
 * CRMS - Pan-African Digital Public Good
 * Upstash Redis is used for distributed rate limiting and caching
 * across multiple server instances.
 *
 * Documentation: https://upstash.com/docs/redis/overall/getstarted
 */

import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client instance
 *
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL: Your Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis REST token
 *
 * To get these credentials:
 * 1. Sign up at https://upstash.com/
 * 2. Create a new Redis database
 * 3. Copy the REST URL and REST token from the dashboard
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/**
 * Check if Upstash Redis is properly configured
 *
 * @returns true if both URL and token are provided
 */
export function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Test Redis connection
 *
 * @returns Promise<boolean> true if connection successful
 */
export async function testRedisConnection(): Promise<boolean> {
  if (!isRedisConfigured()) {
    console.warn("Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.");
    return false;
  }

  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error("Failed to connect to Upstash Redis:", error);
    return false;
  }
}

/**
 * Redis key prefixes for different features
 * Helps organize keys and avoid collisions across deployments
 */
export const REDIS_KEYS = {
  RATE_LIMIT: "rate_limit",      // Rate limiting counters
  SESSION: "session",             // Session data (optional)
  CACHE: "cache",                 // General caching
  LOCK: "lock",                   // Distributed locks
} as const;

/**
 * Generate a namespaced Redis key
 *
 * @param prefix - Key prefix from REDIS_KEYS
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @returns Namespaced key string
 *
 * @example
 * getRedisKey(REDIS_KEYS.RATE_LIMIT, "login:192.168.1.1")
 * // Returns: "rate_limit:login:192.168.1.1"
 */
export function getRedisKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}
