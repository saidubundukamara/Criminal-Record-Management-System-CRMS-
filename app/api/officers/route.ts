/**
 * Officers API Routes
 *
 * Endpoints:
 * GET /api/officers - List officers with filters
 * POST /api/officers - Create new officer
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Admin only (canManageOfficers)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { canManageOfficers } from "@/lib/permissions";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@/src/lib/errors";

/**
 * GET /api/officers
 * List officers with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - Admin only
    if (!canManageOfficers(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const roleId = searchParams.get("roleId");
    const stationId = searchParams.get("stationId");
    const search = searchParams.get("search");

    // Build filters
    const filters: any = {};

    if (active !== null) filters.active = active === "true";
    if (roleId) filters.roleId = roleId;
    if (stationId) filters.stationId = stationId;
    if (search) filters.search = search;

    // Get officers
    const officers = await container.officerService.listOfficers(filters);

    // Get stats
    const stats = await container.officerService.getStats(
      stationId ? { stationId } : undefined
    );

    return NextResponse.json({
      officers,
      stats,
      count: officers.length,
    });
  } catch (error) {
    console.error("GET /api/officers error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/officers
 * Create a new officer
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - Admin only
    if (!canManageOfficers(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Create officer
    const newOfficer = await container.officerService.createOfficer(
      {
        badge: body.badge,
        name: body.name,
        email: body.email,
        phone: body.phone,
        pin: body.pin,
        roleId: body.roleId,
        stationId: body.stationId,
      },
      session.user.id,
      ip
    );

    return NextResponse.json({ officer: newOfficer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/officers error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
