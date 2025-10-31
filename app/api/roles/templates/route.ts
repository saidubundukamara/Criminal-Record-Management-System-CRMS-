/**
 * Role Templates API Route
 *
 * GET /api/roles/templates - Get predefined permission templates
 * POST /api/roles/templates - Create role from template
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
} from "@/src/lib/errors";

/**
 * GET /api/roles/templates
 * Get all predefined permission templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const templates = container.roleService.getPermissionTemplates();

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error("GET /api/roles/templates error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/roles/templates
 * Create a new role from a template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { templateName, roleName } = body;

    if (!templateName || !roleName) {
      return NextResponse.json(
        { error: "Invalid request. Required: templateName, roleName" },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    const newRole = await container.roleService.createFromTemplate(
      templateName,
      roleName,
      session.user.id,
      ip
    );

    return NextResponse.json({
      ...newRole,
      message: `Role created from template "${templateName}"`,
    });
  } catch (error) {
    console.error("POST /api/roles/templates error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
