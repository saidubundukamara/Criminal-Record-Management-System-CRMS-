/**
 * Amber Alerts API Routes
 *
 * Endpoints:
 * GET /api/alerts/amber - List amber alerts
 * POST /api/alerts/amber - Create a new amber alert
 *
 * Authentication: Required (NextAuth session)
 * Permissions: alerts:read, alerts:create
 *
 * CRMS - Pan-African Digital Public Good
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

/**
 * GET /api/alerts/amber
 * List Amber Alerts with optional filters
 *
 * Query parameters:
 * - status: Filter by status (active, found, expired)
 * - isActive: Filter active alerts (true/false)
 * - urgencyLevel: Filter by urgency (critical, high, medium)
 * - limit: Number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Permissions: Officer or Viewer
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session, "alerts", "read", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to view alerts" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const isActive = searchParams.get("isActive");
    const urgencyLevel = searchParams.get("urgencyLevel");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build filters
    const filters: any = {};

    if (status) filters.status = status;
    if (isActive !== null) filters.isActive = isActive === "true";
    if (urgencyLevel) filters.urgencyLevel = urgencyLevel;

    // Get alerts
    const result = await container.alertService.searchAmberAlerts(
      filters,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0
    );

    return NextResponse.json({
      alerts: result.alerts,
      total: result.total,
    });
  } catch (error) {
    console.error("GET /api/alerts/amber error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts/amber
 * Create a new Amber Alert for a missing child
 *
 * Request body:
 * {
 *   personName: string,
 *   age: number | null,
 *   gender: "male" | "female" | "unknown" | null,
 *   description: string,
 *   photoUrl?: string | null,
 *   lastSeenLocation?: string | null,
 *   lastSeenDate?: string, // ISO date string
 *   contactPhone: string,
 *   publishNow?: boolean // Auto-publish (default: false)
 * }
 *
 * Permissions: Officer or Admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session, "alerts", "create", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to create alerts" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { personName, description, contactPhone } = body;

    if (!personName || !description || !contactPhone) {
      return NextResponse.json(
        { error: "Person name, description, and contact phone are required" },
        { status: 400 }
      );
    }

    // Get IP address for audit
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Create amber alert
    const alert = await container.alertService.createAmberAlert(
      {
        personName: body.personName,
        age: body.age !== undefined ? body.age : null,
        gender: body.gender || null,
        description: body.description,
        photoUrl: body.photoUrl || null,
        lastSeenLocation: body.lastSeenLocation || null,
        lastSeenDate: body.lastSeenDate || null,
        contactPhone: body.contactPhone,
        publishNow: body.publishNow || false,
      },
      session.user.id,
      ipAddress
    );

    return NextResponse.json(
      {
        alert,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/alerts/amber error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
