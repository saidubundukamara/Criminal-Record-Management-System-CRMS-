/**
 * Evidence Chain of Custody API Route
 *
 * POST /api/evidence/[id]/custody - Add custody event to chain
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { AddCustodyEventInput } from "@/src/services/EvidenceService";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/evidence/[id]/custody
 * Add custody event to chain of custody
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "evidence", "update", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const { action, location, notes } = body;

    if (!action || !location) {
      return NextResponse.json(
        { error: "Action and location are required" },
        { status: 400 }
      );
    }

    const validActions = ["collected", "transferred", "accessed", "returned", "destroyed"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    const input: AddCustodyEventInput = {
      action,
      location,
      notes,
    };

    // Add custody event
    const evidence = await container.evidenceService.addCustodyEvent(
      id,
      input,
      session.user.id,
      {
        name: session.user.name,
        badge: session.user.badge,
      },
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        evidence: {
          id: evidence.id,
          qrCode: evidence.qrCode,
          chainOfCustody: evidence.chainOfCustody,
          currentCustodian: evidence.getCurrentCustodian(),
          custodyTransferCount: evidence.getCustodyTransferCount(),
          updatedAt: evidence.updatedAt,
        },
        message: "Custody event added successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding custody event:", error);

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
