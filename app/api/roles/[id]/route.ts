/**
 * Role Detail API Routes
 *
 * Endpoints:
 * GET /api/roles/[id] - Get role by ID with permissions
 * PATCH /api/roles/[id] - Update role
 * DELETE /api/roles/[id] - Delete role
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
 * GET /api/roles/[id]
 * Get role by ID with permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roleWithPermissions = await container.roleService.getRole(id);

    // Get officer count for this role
    const officers = await container.officerRepository.findAll({
      roleId: id,
    });

    return NextResponse.json({
      ...roleWithPermissions,
      officerCount: officers.length,
    });
  } catch (error) {
    const { id } = await params;
    console.error(`GET /api/roles/${id} error:`, error);

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
 * PATCH /api/roles/[id]
 * Update role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Update role
    const updatedRole = await container.roleService.updateRole(
      id,
      {
        name: body.name,
        description: body.description,
        level: body.level,
      },
      session.user.id,
      ip
    );

    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    const { id } = await params;
    console.error(`PATCH /api/roles/${id} error:`, error);

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
 * DELETE /api/roles/[id]
 * Delete role (if no officers assigned)
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

    // Check permission
    if (!canManageRoles(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Delete role
    await container.roleService.deleteRole(id, session.user.id, ip);

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    const { id } = await params;
    console.error(`DELETE /api/roles/${id} error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
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
