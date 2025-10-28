/**
 * Sync API Routes
 *
 * Endpoints for offline-to-online synchronization
 * POST /api/sync - Process pending sync queue
 * GET /api/sync - Get sync statistics
 * DELETE /api/sync - Cleanup old completed entries
 *
 * Follows Service-Repository pattern with proper dependency injection
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";

/**
 * POST /api/sync
 * Process pending sync entries
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only officers can trigger sync
    if (!["SuperAdmin", "Admin", "StationCommander", "Officer"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { limit, retryFailed = false } = body;

    let result;

    if (retryFailed) {
      // Retry failed sync entries
      result = await container.syncService.retryFailedSync(limit);
    } else {
      // Process pending sync entries
      result = await container.syncService.processPendingSync(limit);
    }

    return NextResponse.json({
      success: result.success,
      synced: result.synced,
      failed: result.failed,
      errors: result.errors,
      message: result.success
        ? `Successfully synced ${result.synced} entries`
        : `Synced ${result.synced} entries with ${result.failed} failures`,
    });
  } catch (error) {
    console.error("Error processing sync:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync
 * Get sync statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await container.syncService.getSyncStats();

    return NextResponse.json({
      stats: {
        pending: stats.pending,
        failed: stats.failed,
        lastSyncAt: stats.lastSyncAt,
        isOnline: true, // This would be determined by client-side network detection
      },
    });
  } catch (error) {
    console.error("Error fetching sync stats:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sync
 * Cleanup old completed sync entries
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can cleanup
    if (!["SuperAdmin", "Admin"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("olderThanDays") || "7");

    const deletedCount = await container.syncService.cleanupOldEntries(olderThanDays);

    return NextResponse.json({
      message: `Cleaned up ${deletedCount} old sync entries`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up sync entries:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
