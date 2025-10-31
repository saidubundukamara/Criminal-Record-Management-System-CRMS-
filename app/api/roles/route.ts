/**
 * Roles API Routes
 *
 * Endpoints:
 * GET /api/roles - List all roles
 * POST /api/roles - Create new role
 *
 * Authentication: Required (NextAuth session)
 * Permissions: SuperAdmin only (canManageRoles)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { canManageRoles } from "@/lib/permissions";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@/src/lib/errors";

/**
 * GET /api/roles
 * List all roles
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - SuperAdmin only
    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all roles
    const roles = await container.roleService.listRoles();

    // Get stats
    const stats = await container.roleService.getStats();

    return NextResponse.json({
      roles,
      stats,
      count: roles.length,
    });
  } catch (error) {
    console.error("GET /api/roles error:", error);

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
 * POST /api/roles
 * Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - SuperAdmin only
    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Create role
    const newRole = await container.roleService.createRole(
      {
        name: body.name,
        description: body.description,
        level: body.level,
      },
      session.user.id,
      ip
    );

    return NextResponse.json({ role: newRole }, { status: 201 });
  } catch (error) {
    console.error("POST /api/roles error:", error);

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
