/**
 * Person Wanted Status API Route
 *
 * PATCH /api/persons/[id]/wanted - Mark person as wanted
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/persons/[id]/wanted
 * Mark person as wanted
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions (requires update permission)
    if (!hasPermission(session, "persons", "update", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { reason } = body;

    // Mark as wanted
    const person = await container.personService.markAsWanted(
      id,
      session.user.id,
      reason,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        person: {
          id: person.id,
          fullName: person.getFullName(),
          isWanted: person.isWanted,
          riskLevel: person.riskLevel,
          updatedAt: person.updatedAt,
        },
        message: `${person.getFullName()} has been marked as wanted`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking person as wanted:", error);

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
