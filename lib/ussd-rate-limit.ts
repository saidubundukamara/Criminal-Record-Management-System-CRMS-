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
  searchTerm: string; // NIN or license plate
  resultSummary?: string | null; // Brief result (e.g., "WANTED", "NOT FOUND", "STOLEN")
  success?: boolean;
  errorMessage?: string | null;
  sessionId?: string | null;
}

/**
 * Officer query statistics
 */
export interface QueryStatistics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  byType: {
    wanted: number;
    missing: number;
    background: number;
    vehicle: number;
    stats: number;
  };
  lastQuery: Date | null;
}

/**
 * Check if officer has exceeded daily rate limit
 *
 * @param officerId - Officer's ID
 * @returns Rate limit check result with remaining quota
 */
export async function checkRateLimit(
  officerId: string
): Promise<RateLimitResult> {
  try {
    // Get officer's daily limit (default: 50)
    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      select: { ussdDailyLimit: true },
    });

    const limit = officer?.ussdDailyLimit || 50;

    // Calculate today's boundary (midnight to midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count today's queries
    const count = await prisma.uSSDQueryLog.count({
      where: {
        officerId,
        timestamp: {
          gte: today,
        },
      },
    });

    // Calculate reset time (tomorrow at midnight)
    const resetAt = new Date(today);
    resetAt.setDate(resetAt.getDate() + 1);

    return {
      allowed: count < limit,
      remaining: Math.max(0, limit - count),
      limit,
      resetAt,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open: Allow query if there's an error (but log it)
    return {
      allowed: true,
      remaining: 0,
      limit: 50,
      resetAt: new Date(),
    };
  }
}

/**
 * Log USSD query to database
 *
 * IMPORTANT: Always call this after processing a query (success or failure)
 * to maintain accurate rate limits and audit trails.
 *
 * @param data - Query log data
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
        success: data.success !== false, // Default to true if not specified
        errorMessage: data.errorMessage || null,
        sessionId: data.sessionId || null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Query logging error:", error);
    // Don't throw - logging failures shouldn't break the user flow
  }
}

/**
 * Get officer's query statistics
 *
 * @param officerId - Officer's ID
 * @returns Query statistics broken down by time period and type
 */
export async function getQueryStatistics(
  officerId: string
): Promise<QueryStatistics> {
  try {
    const now = new Date();

    // Calculate time boundaries
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Parallel queries for efficiency
    const [todayCount, weekCount, monthCount, allTimeCount, byType, lastQuery] =
      await Promise.all([
        // Today
        prisma.uSSDQueryLog.count({
          where: {
            officerId,
            timestamp: { gte: today },
          },
        }),

        // This week
        prisma.uSSDQueryLog.count({
          where: {
            officerId,
            timestamp: { gte: weekStart },
          },
        }),

        // This month
        prisma.uSSDQueryLog.count({
          where: {
            officerId,
            timestamp: { gte: monthStart },
          },
        }),

        // All time
        prisma.uSSDQueryLog.count({
          where: { officerId },
        }),

        // By type
        prisma.uSSDQueryLog.groupBy({
          by: ["queryType"],
          where: { officerId },
          _count: { queryType: true },
        }),

        // Last query
        prisma.uSSDQueryLog.findFirst({
          where: { officerId },
          orderBy: { timestamp: "desc" },
          select: { timestamp: true },
        }),
      ]);

    // Map query types to counts
    const byTypeMap: QueryStatistics["byType"] = {
      wanted: 0,
      missing: 0,
      background: 0,
      vehicle: 0,
      stats: 0,
    };

    byType.forEach((item) => {
      if (item.queryType in byTypeMap) {
        byTypeMap[item.queryType as keyof typeof byTypeMap] =
          item._count.queryType;
      }
    });

    return {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      allTime: allTimeCount,
      byType: byTypeMap,
      lastQuery: lastQuery?.timestamp || null,
    };
  } catch (error) {
    console.error("Statistics retrieval error:", error);
    // Return empty stats on error
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      allTime: 0,
      byType: {
        wanted: 0,
        missing: 0,
        background: 0,
        vehicle: 0,
        stats: 0,
      },
      lastQuery: null,
    };
  }
}

/**
 * Get station-wide query statistics (for commanders/admins)
 *
 * @param stationId - Station ID
 * @returns Aggregated statistics for all officers at the station
 */
export async function getStationStatistics(stationId: string): Promise<{
  today: number;
  thisWeek: number;
  thisMonth: number;
  topOfficers: Array<{
    officerId: string;
    badge: string;
    name: string;
    queryCount: number;
  }>;
}> {
  try {
    const now = new Date();

    // Calculate time boundaries
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Get officers at station
    const officers = await prisma.officer.findMany({
      where: { stationId },
      select: { id: true, badge: true, name: true },
    });

    const officerIds = officers.map((o) => o.id);

    // Parallel queries
    const [todayCount, weekCount, monthCount, topOfficersData] =
      await Promise.all([
        // Today
        prisma.uSSDQueryLog.count({
          where: {
            officerId: { in: officerIds },
            timestamp: { gte: today },
          },
        }),

        // This week
        prisma.uSSDQueryLog.count({
          where: {
            officerId: { in: officerIds },
            timestamp: { gte: weekStart },
          },
        }),

        // This month
        prisma.uSSDQueryLog.count({
          where: {
            officerId: { in: officerIds },
            timestamp: { gte: monthStart },
          },
        }),

        // Top officers (this month)
        prisma.uSSDQueryLog.groupBy({
          by: ["officerId"],
          where: {
            officerId: { in: officerIds },
            timestamp: { gte: monthStart },
          },
          _count: { officerId: true },
          orderBy: { _count: { officerId: "desc" } },
          take: 10,
        }),
      ]);

    // Map officer IDs to details
    const topOfficers = topOfficersData.map((item) => {
      const officer = officers.find((o) => o.id === item.officerId);
      return {
        officerId: item.officerId,
        badge: officer?.badge || "Unknown",
        name: officer?.name || "Unknown",
        queryCount: item._count.officerId,
      };
    });

    return {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      topOfficers,
    };
  } catch (error) {
    console.error("Station statistics error:", error);
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      topOfficers: [],
    };
  }
}

/**
 * Get recent queries for an officer (for debugging/audit)
 *
 * @param officerId - Officer's ID
 * @param limit - Number of recent queries to retrieve
 */
export async function getRecentQueries(
  officerId: string,
  limit: number = 10
): Promise<
  Array<{
    queryType: string;
    searchTerm: string;
    resultSummary: string | null;
    success: boolean;
    timestamp: Date;
  }>
> {
  try {
    const queries = await prisma.uSSDQueryLog.findMany({
      where: { officerId },
      orderBy: { timestamp: "desc" },
      take: limit,
      select: {
        queryType: true,
        searchTerm: true,
        resultSummary: true,
        success: true,
        timestamp: true,
      },
    });

    return queries;
  } catch (error) {
    console.error("Recent queries retrieval error:", error);
    return [];
  }
}

/**
 * Check for suspicious patterns (future enhancement)
 * Examples:
 * - Too many failed queries in a row
 * - Searching for same NIN repeatedly
 * - High query volume in short time
 *
 * @param officerId - Officer's ID
 * @returns Array of detected suspicious patterns
 */
export async function detectSuspiciousPatterns(
  officerId: string
): Promise<string[]> {
  const patterns: string[] = [];

  try {
    // Get recent queries (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentQueries = await prisma.uSSDQueryLog.findMany({
      where: {
        officerId,
        timestamp: { gte: oneHourAgo },
      },
      orderBy: { timestamp: "desc" },
    });

    // Pattern 1: High failure rate (>50% in last 10 queries)
    const last10 = recentQueries.slice(0, 10);
    if (last10.length >= 5) {
      const failures = last10.filter((q) => !q.success).length;
      if (failures / last10.length > 0.5) {
        patterns.push(
          `High failure rate: ${failures}/${last10.length} recent queries failed`
        );
      }
    }

    // Pattern 2: Repeated searches for same term
    const searchTerms = recentQueries.map((q) => q.searchTerm);
    const termCounts = searchTerms.reduce((acc, term) => {
      acc[term] = (acc[term] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(termCounts).forEach(([term, count]) => {
      if (count >= 5) {
        patterns.push(`Repeated searches for "${term}": ${count} times`);
      }
    });

    // Pattern 3: Rapid queries (>20 in last hour)
    if (recentQueries.length > 20) {
      patterns.push(
        `High query volume: ${recentQueries.length} queries in last hour`
      );
    }
  } catch (error) {
    console.error("Pattern detection error:", error);
  }

  return patterns;
}
