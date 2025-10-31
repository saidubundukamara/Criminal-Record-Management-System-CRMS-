/**
 * Case-Person Removal API Route
 *
 * DELETE /api/cases/[id]/persons/[personId] - Remove a person from a case
 *
 * Pan-African Design: Unlink persons from cases
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { NotFoundError, ForbiddenError } from "@/src/lib/errors";

interface RouteContext {
  params: Promise<{
    id: string;
    personId: string;
  }>;
}

/**
 * DELETE /api/cases/[id]/persons/[personId]
 * Remove a person from a case (delete the case-person link)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId, personId } = await context.params;

    // Check permissions - need update access to cases
    if (!hasPermission(session, "cases", "update", "own")) {
      throw new ForbiddenError(
        "Insufficient permissions to remove persons from case"
      );
    }

    const prisma = container.prismaClient;
    const auditRepo = container.auditLogRepository;

    // Find the case-person link
    const casePerson = await prisma.casePerson.findFirst({
      where: {
        caseId,
        personId,
      },
      include: {
        person: {
          select: {
            fullName: true,
          },
        },
        case: {
          select: {
            caseNumber: true,
          },
        },
      },
    });

    if (!casePerson) {
      throw new NotFoundError("Person is not linked to this case");
    }

    // Delete the link
    await prisma.casePerson.delete({
      where: {
        id: casePerson.id,
      },
    });

    // Audit log
    await auditRepo.create({
      entityType: "case",
      entityId: caseId,
      officerId: session.user.id,
      action: "update",
      success: true,
      details: {
        operation: "remove_person",
        personId,
        role: casePerson.role,
        personName: casePerson.person.fullName,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      stationId: session.user.stationId,
    });

    return NextResponse.json(
      {
        message: "Person removed from case successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error removing person from case:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to remove person from case" },
      { status: 500 }
    );
  }
}
