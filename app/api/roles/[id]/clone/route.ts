/**
 * Role Clone API Route
 *
 * POST /api/roles/[id]/clone - Clone role with new name and level
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
    const { newName, newDescription, newLevel } = body;

    if (!newName || !newLevel) {
      return NextResponse.json(
        { error: "Invalid request. Required: newName, newLevel" },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    const newRole = await container.roleService.cloneRole(
      id,
      { newName, newDescription, newLevel },
      session.user.id,
      ip
    );

    return NextResponse.json({
      ...newRole,
      message: "Role cloned successfully",
    });
  } catch (error) {
    const { id } = await params;
    console.error(`POST /api/roles/${id}/clone error:`, error);

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
