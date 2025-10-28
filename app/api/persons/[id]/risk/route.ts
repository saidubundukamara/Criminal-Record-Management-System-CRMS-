/**
 * Person Risk Level API Route
 *
 * PATCH /api/persons/[id]/risk - Update person risk level
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
 * PATCH /api/persons/[id]/risk
 * Update person risk level
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "persons", "update", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { riskLevel, reason } = body;

    // Validate risk level
    const validRiskLevels = ["low", "medium", "high"];
    if (!riskLevel || !validRiskLevels.includes(riskLevel)) {
      return NextResponse.json(
        { error: "Invalid risk level. Must be one of: low, medium, high" },
        { status: 400 }
      );
    }

    // Update risk level
    const person = await container.personService.updateRiskLevel(
      id,
      riskLevel,
      session.user.id,
      reason,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        person: {
          id: person.id,
          fullName: person.getFullName(),
          riskLevel: person.riskLevel,
          riskLabel: person.getRiskLabel(),
          updatedAt: person.updatedAt,
        },
        message: `Risk level updated to ${riskLevel}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating risk level:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

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
