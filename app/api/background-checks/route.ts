/**
 * Background Checks API Routes
 *
 * Endpoints:
 * GET /api/background-checks - List background checks
 * POST /api/background-checks - Perform a new background check
 *
 * Authentication: Required (NextAuth session)
 * Permissions: bgcheck:read, bgcheck:create
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
 * GET /api/background-checks
 * List background checks with optional filters
 *
 * Query parameters:
 * - nin: Filter by NIN
 * - requestType: Filter by request type (officer, citizen, employer, visa)
 * - status: Filter by status (pending, completed, failed)
 * - hasRecord: Filter by record status (true/false)
 * - limit: Number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Permissions: Officer or Admin
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
    if (!hasPermission(session, "bgcheck", "read", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to view background checks" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const nin = searchParams.get("nin");
    const requestType = searchParams.get("requestType");
    const status = searchParams.get("status");
    const hasRecord = searchParams.get("hasRecord");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build filters
    const filters: any = {};

    if (nin) filters.nin = nin;
    if (requestType) filters.requestType = requestType;
    if (status) filters.status = status;
    if (hasRecord !== null) filters.hasRecord = hasRecord === "true";

    // Get background checks
    const result = await container.backgroundCheckService.searchBackgroundChecks(
      filters,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0
    );

    return NextResponse.json({
      checks: result.checks,
      total: result.total,
    });
  } catch (error) {
    console.error("GET /api/background-checks error:", error);

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
 * POST /api/background-checks
 * Perform a new background check by NIN
 *
 * Request body:
 * {
 *   nin: string,
 *   requestType: "officer" | "citizen" | "employer" | "visa",
 *   phoneNumber?: string // For USSD citizen requests
 * }
 *
 * Permissions: Officer or Admin (citizen requests can be public via USSD)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Parse request body
    const body = await request.json();
    const { nin, requestType, phoneNumber } = body;

    // Validate required fields
    if (!nin || !requestType) {
      return NextResponse.json(
        { error: "NIN and requestType are required" },
        { status: 400 }
      );
    }

    // For officer/employer/visa requests, authentication is required
    if (requestType !== "citizen") {
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check permissions
      if (!hasPermission(session, "bgcheck", "create", "station")) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions to perform background checks" },
          { status: 403 }
        );
      }
    }

    // For citizen requests, require phone number
    if (requestType === "citizen" && !phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required for citizen requests" },
        { status: 400 }
      );
    }

    // Get IP address for audit
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Perform background check
    const backgroundCheck = await container.backgroundCheckService.performBackgroundCheck(
      {
        nin,
        requestedById: session?.user?.id || null,
        requestType,
        phoneNumber: phoneNumber || null,
      },
      ipAddress
    );

    // Return appropriate response based on request type
    if (requestType === "citizen" || requestType === "employer") {
      // Return redacted result
      const redactedResult = backgroundCheck.getRedactedResult();
      return NextResponse.json(
        {
          id: backgroundCheck.id,
          nin: backgroundCheck.nin,
          result: redactedResult,
          status: backgroundCheck.status,
          expiresAt: backgroundCheck.expiresAt,
          createdAt: backgroundCheck.createdAt,
        },
        { status: 201 }
      );
    } else {
      // Return full result for officer/visa requests
      return NextResponse.json(
        {
          backgroundCheck,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("POST /api/background-checks error:", error);

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
