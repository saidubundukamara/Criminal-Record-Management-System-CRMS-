/**
 * Role Permissions API Routes
 *
 * Endpoints:
 * POST /api/roles/[id]/permissions - Assign permissions to role
 * DELETE /api/roles/[id]/permissions - Remove permissions from role
 * PUT /api/roles/[id]/permissions - Replace all permissions
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
 * POST /api/roles/[id]/permissions
 * Assign permissions to role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { permissionIds } = body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "Invalid request. Required: permissionIds (array)" },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    const roleWithPermissions = await container.roleService.assignPermissions(
      id,
      { permissionIds },
      session.user.id,
      ip
    );

    return NextResponse.json({
      ...roleWithPermissions,
      message: "Permissions assigned successfully",
    });
  } catch (error) {
    const { id } = await params;
    console.error(`POST /api/roles/${id}/permissions error:`, error);

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

/**
 * DELETE /api/roles/[id]/permissions
 * Remove permissions from role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { permissionIds } = body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "Invalid request. Required: permissionIds (array)" },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    const roleWithPermissions = await container.roleService.removePermissions(
      id,
      { permissionIds },
      session.user.id,
      ip
    );

    return NextResponse.json({
      ...roleWithPermissions,
      message: "Permissions removed successfully",
    });
  } catch (error) {
    const { id } = await params;
    console.error(`DELETE /api/roles/${id}/permissions error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles/[id]/permissions
 * Replace all permissions for a role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { permissionIds } = body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "Invalid request. Required: permissionIds (array)" },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    const roleWithPermissions = await container.roleService.replacePermissions(
      id,
      permissionIds,
      session.user.id,
      ip
    );

    return NextResponse.json({
      ...roleWithPermissions,
      message: "Permissions replaced successfully",
    });
  } catch (error) {
    const { id } = await params;
    console.error(`PUT /api/roles/${id}/permissions error:`, error);

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
