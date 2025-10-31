/**
 * Wanted Persons API Routes
 *
 * Endpoints:
 * GET /api/alerts/wanted - List wanted persons
 * POST /api/alerts/wanted - Create a new wanted person
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
 * GET /api/alerts/wanted
 * List Wanted Persons with optional filters
 *
 * Query parameters:
 * - status: Filter by status (active, captured, expired)
 * - dangerLevel: Filter by danger level (low, medium, high, extreme)
 * - isActive: Filter active warrants (true/false)
 * - isRegional: Filter regional alerts (true/false)
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
        { error: "Forbidden: Insufficient permissions to view wanted persons" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dangerLevel = searchParams.get("dangerLevel");
    const isActive = searchParams.get("isActive");
    const isRegional = searchParams.get("isRegional");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build filters
    const filters: any = {};

    if (status) filters.status = status;
    if (dangerLevel) filters.dangerLevel = dangerLevel;
    if (isActive !== null) filters.isActive = isActive === "true";
    if (isRegional !== null) filters.isRegionalAlert = isRegional === "true";

    // Get wanted persons
    const result = await container.alertService.searchWantedPersons(
      filters,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0
    );

    return NextResponse.json({
      wantedPersons: result.wantedPersons,
      total: result.total,
    });
  } catch (error) {
    console.error("GET /api/alerts/wanted error:", error);

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
 * POST /api/alerts/wanted
 * Create a new Wanted Person
 *
 * Request body:
 * {
 *   personId: string,
 *   charges: Array<{ charge: string, category: string, severity: "minor" | "major" | "critical" }>,
 *   dangerLevel: "low" | "medium" | "high" | "extreme",
 *   warrantNumber: string,
 *   issuedDate: string, // ISO date string
 *   expiresAt?: string | null, // ISO date string
 *   lastSeenLocation?: string | null,
 *   lastSeenDate?: string | null, // ISO date string
 *   physicalDescription: string,
 *   photoUrl?: string | null,
 *   rewardAmount?: number | null,
 *   contactPhone: string,
 *   isRegionalAlert?: boolean
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
        { error: "Forbidden: Insufficient permissions to create wanted persons" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const {
      personId,
      charges,
      dangerLevel,
      warrantNumber,
      issuedDate,
      physicalDescription,
      contactPhone,
    } = body;

    if (
      !personId ||
      !charges ||
      !dangerLevel ||
      !warrantNumber ||
      !issuedDate ||
      !physicalDescription ||
      !contactPhone
    ) {
      return NextResponse.json(
        {
          error:
            "PersonId, charges, dangerLevel, warrantNumber, issuedDate, physicalDescription, and contactPhone are required",
        },
        { status: 400 }
      );
    }

    // Get IP address for audit
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Create wanted person
    const wantedPerson = await container.alertService.createWantedPerson(
      {
        personId: body.personId,
        charges: body.charges,
        dangerLevel: body.dangerLevel,
        warrantNumber: body.warrantNumber,
        issuedDate: body.issuedDate,
        expiresAt: body.expiresAt || null,
        lastSeenLocation: body.lastSeenLocation || null,
        lastSeenDate: body.lastSeenDate || null,
        physicalDescription: body.physicalDescription,
        photoUrl: body.photoUrl || null,
        rewardAmount: body.rewardAmount || null,
        contactPhone: body.contactPhone,
        isRegionalAlert: body.isRegionalAlert || false,
      },
      session.user.id,
      ipAddress
    );

    return NextResponse.json(
      {
        wantedPerson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/alerts/wanted error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
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
