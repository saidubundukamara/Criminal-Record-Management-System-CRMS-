/**
 * USSD Rate Limiting & Query Logging
 *
 * Handles rate limiting (50 queries/day default) and comprehensive query logging
 * for USSD operations to prevent abuse and maintain audit trails.
 *
 * Features:
 * - Per-officer daily query limits (configurable)
 * - Query type tracking (wanted, missing, background, vehicle, stats)
 * - Success/failure logging
 * - Result summaries (no PII)
 * - Session tracking
 * - Real-time remaining quota checks
 *
 * Abuse Prevention:
 * - Daily limits reset at midnight (local time)
 * - Suspicious pattern detection (future enhancement)
 * - Admin override capabilities
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date; // When the limit resets (midnight)
}

/**
 * Query log entry data
 */
export interface QueryLogData {
  officerId: string;
  phoneNumber: string;
  queryType: "wanted" | "missing" | "background" | "vehicle" | "stats";
  searchTerm: string;
  resultSummary?: string;
  success: boolean;
  errorMessage?: string;
  sessionId?: string;
}

/**
 * Query statistics for an officer
 */
export interface QueryStatistics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  byType: Record<string, number>;
  successRate: number;
}

/**
 * Check if officer has remaining rate limit quota
 *
 * Process:
 * 1. Get officer's daily limit from database
 * 2. Calculate today's midnight timestamp
 * 3. Count queries since midnight
 * 4. Check if under limit
 * 5. Return remaining quota
 */
export async function checkRateLimit(
  officerId: string
): Promise<RateLimitResult> {
  try {
    // Step 1: Get officer's daily limit
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      select: { ussdDailyLimit: true },
    });

    if (!officer) {
      throw new Error("Officer not found");
    }

    const limit = officer.ussdDailyLimit;

    // Step 2: Calculate today's midnight
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    // Calculate tomorrow's midnight for reset time
    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

    // Step 3: Count queries since midnight
    const count = await prisma.uSSDQueryLog.count({
      where: {
        officerId,
        timestamp: {
          gte: todayMidnight,
        },
      },
    });

    // Step 4 & 5: Check limit and return result
    const remaining = Math.max(0, limit - count);

    return {
      allowed: count < limit,
      remaining,
      limit,
      resetAt: tomorrowMidnight,
    };
  } catch (error) {
    console.error("[USSD Rate Limit Error]", error);
    // Fail closed - deny access on error
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      allowed: false,
      remaining: 0,
      limit: 50,
      resetAt: tomorrow,
    };
  }
}

/**
 * Log a USSD query to database
 *
 * Creates an immutable audit record of every USSD query for:
 * - Accountability and compliance
 * - Rate limiting calculations
 * - Statistics and monitoring
 * - Suspicious activity detection
 */
export async function logQuery(data: QueryLogData): Promise<void> {
  try {
    await prisma.uSSDQueryLog.create({
      data: {
        officerId: data.officerId,
        phoneNumber: data.phoneNumber,
        queryType: data.queryType,
        searchTerm: data.searchTerm,
        resultSummary: data.resultSummary || null,
        success: data.success,
        errorMessage: data.errorMessage || null,
        sessionId: data.sessionId || null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Log error but don't throw - logging failure shouldn't break USSD flow
    console.error("[USSD Query Logging Error]", error);
  }
}

/**
 * Get query statistics for an officer
 */
export async function getQueryStatistics(
  officerId: string
): Promise<QueryStatistics> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count queries
    const [today, thisWeek, thisMonth, total] = await Promise.all([
      prisma.uSSDQueryLog.count({
        where: { officerId, timestamp: { gte: todayStart } },
      }),
      prisma.uSSDQueryLog.count({
        where: { officerId, timestamp: { gte: weekStart } },
      }),
      prisma.uSSDQueryLog.count({
        where: { officerId, timestamp: { gte: monthStart } },
      }),
      prisma.uSSDQueryLog.count({
        where: { officerId },
      }),
    ]);

    // Get queries by type
    const byTypeData = await prisma.uSSDQueryLog.groupBy({
      by: ["queryType"],
      where: { officerId },
      _count: { queryType: true },
    });

    const byType: Record<string, number> = {};
    byTypeData.forEach((item) => {
      byType[item.queryType] = item._count.queryType;
    });

    // Calculate success rate
    const successCount = await prisma.uSSDQueryLog.count({
      where: { officerId, success: true },
    });
    const successRate = total > 0 ? (successCount / total) * 100 : 0;

    return {
      today,
      thisWeek,
      thisMonth,
      total,
      byType,
      successRate,
    };
  } catch (error) {
    console.error("[USSD Statistics Error]", error);
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0,
      byType: {},
      successRate: 0,
    };
  }
}

/**
 * Get station-wide USSD statistics
 */
export async function getStationStatistics(stationId: string): Promise<{
  totalQueries: number;
  queriesToday: number;
  queriesThisWeek: number;
  activeOfficers: number;
  topQueryTypes: Array<{ type: string; count: number }>;
}> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get station officers
    const stationOfficers = await prisma.officer.findMany({
      where: { stationId, ussdEnabled: true },
      select: { id: true },
    });

    const officerIds = stationOfficers.map((o) => o.id);

    if (officerIds.length === 0) {
      return {
        totalQueries: 0,
        queriesToday: 0,
        queriesThisWeek: 0,
        activeOfficers: 0,
        topQueryTypes: [],
      };
    }

    // Count queries
    const [totalQueries, queriesToday, queriesThisWeek] = await Promise.all([
      prisma.uSSDQueryLog.count({
        where: { officerId: { in: officerIds } },
      }),
      prisma.uSSDQueryLog.count({
        where: { officerId: { in: officerIds }, timestamp: { gte: todayStart } },
      }),
      prisma.uSSDQueryLog.count({
        where: { officerId: { in: officerIds }, timestamp: { gte: weekStart } },
      }),
    ]);

    // Get active officers (who made at least 1 query)
    const activeOfficersData = await prisma.uSSDQueryLog.groupBy({
      by: ["officerId"],
      where: { officerId: { in: officerIds } },
    });
    const activeOfficers = activeOfficersData.length;

    // Get top query types
    const topQueryTypesData = await prisma.uSSDQueryLog.groupBy({
      by: ["queryType"],
      where: { officerId: { in: officerIds } },
      _count: { queryType: true },
      orderBy: { _count: { queryType: "desc" } },
      take: 5,
    });

    const topQueryTypes = topQueryTypesData.map((item) => ({
      type: item.queryType,
      count: item._count.queryType,
    }));

    return {
      totalQueries,
      queriesToday,
      queriesThisWeek,
      activeOfficers,
      topQueryTypes,
    };
  } catch (error) {
    console.error("[USSD Station Statistics Error]", error);
    return {
      totalQueries: 0,
      queriesToday: 0,
      queriesThisWeek: 0,
      activeOfficers: 0,
      topQueryTypes: [],
    };
  }
}

/**
 * Get recent queries (for admin monitoring)
 */
export async function getRecentQueries(
  officerId?: string,
  limit: number = 50
): Promise<QueryLogData[]> {
  try {
    const logs = await prisma.uSSDQueryLog.findMany({
      where: officerId ? { officerId } : undefined,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return logs.map((log) => ({
      officerId: log.officerId,
      phoneNumber: log.phoneNumber,
      queryType: log.queryType as
        | "wanted"
        | "missing"
        | "background"
        | "vehicle"
        | "stats",
      searchTerm: log.searchTerm,
      resultSummary: log.resultSummary || undefined,
      success: log.success,
      errorMessage: log.errorMessage || undefined,
      sessionId: log.sessionId || undefined,
    }));
  } catch (error) {
    console.error("[USSD Recent Queries Error]", error);
    return [];
  }
}

/**
 * Detect suspicious query patterns
 * Basic implementation - can be enhanced
 */
export async function detectSuspiciousPatterns(
  officerId: string
): Promise<{
  suspicious: boolean;
  patterns: string[];
  recommendation: string;
}> {
  try {
    const patterns: string[] = [];

    // Check 1: Excessive queries in last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentCount = await prisma.uSSDQueryLog.count({
      where: {
        officerId,
        timestamp: { gte: oneHourAgo },
      },
    });

    if (recentCount > 20) {
      patterns.push(`Excessive queries in last hour (${recentCount})`);
    }

    // Check 2: High failure rate
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayTotal, todayFailed] = await Promise.all([
      prisma.uSSDQueryLog.count({
        where: { officerId, timestamp: { gte: todayStart } },
      }),
      prisma.uSSDQueryLog.count({
        where: { officerId, timestamp: { gte: todayStart }, success: false },
      }),
    ]);

    if (todayTotal > 10 && todayFailed / todayTotal > 0.5) {
      patterns.push(`High failure rate (${Math.round((todayFailed / todayTotal) * 100)}%)`);
    }

    // Check 3: Repeated same searches
    const recentSearches = await prisma.uSSDQueryLog.findMany({
      where: {
        officerId,
        timestamp: { gte: oneHourAgo },
      },
      select: { searchTerm: true },
    });

    const searchCounts: Record<string, number> = {};
    recentSearches.forEach((s) => {
      searchCounts[s.searchTerm] = (searchCounts[s.searchTerm] || 0) + 1;
    });

    for (const [term, count] of Object.entries(searchCounts)) {
      if (count > 5) {
        patterns.push(`Repeated searches for same term (${count} times)`);
        break;
      }
    }

    const suspicious = patterns.length > 0;

    return {
      suspicious,
      patterns,
      recommendation: suspicious
        ? "Review officer activity. May require admin intervention."
        : "No suspicious activity detected",
    };
  } catch (error) {
    console.error("[USSD Suspicious Patterns Error]", error);
    return {
      suspicious: false,
      patterns: [],
      recommendation: "Error checking patterns",
    };
  }
}
