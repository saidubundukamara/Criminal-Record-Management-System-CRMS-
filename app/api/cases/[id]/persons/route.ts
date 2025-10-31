/**
 * Case-Person Linking API Routes
 *
 * POST /api/cases/[id]/persons - Add a person to a case
 * GET /api/cases/[id]/persons - List all persons in a case
 *
 * Pan-African Design: Link suspects, victims, witnesses, informants to cases
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
 * GET /api/cases/[id]/persons
 * List all persons linked to a case with their roles
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await context.params;

    // Check permissions - need read access to cases
    if (!hasPermission(session, "cases", "read", "own")) {
      throw new ForbiddenError("Insufficient permissions to view case persons");
    }

    // Get case with persons using Prisma directly for this query
    const prisma = container.prismaClient;
    const caseWithPersons = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        persons: {
          include: {
            person: {
              select: {
                id: true,
                fullName: true,
                nationalId: true,
                photoUrl: true,
                gender: true,
                dob: true,
              },
            },
          },
        },
      },
    });

    if (!caseWithPersons) {
      throw new NotFoundError("Case not found");
    }

    // Format the response
    const persons = caseWithPersons.persons.map((cp) => ({
      linkId: cp.id,
      personId: cp.person.id,
      role: cp.role,
      statement: cp.statement,
      createdAt: cp.createdAt,
      person: {
        id: cp.person.id,
        fullName: cp.person.fullName,
        nationalId: cp.person.nationalId,
        photoUrl: cp.person.photoUrl,
        gender: cp.person.gender,
        dob: cp.person.dob,
      },
    }));

    return NextResponse.json({ persons }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching case persons:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch case persons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases/[id]/persons
 * Add a person to a case with a specific role
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await context.params;

    // Check permissions - need update access to cases
    if (!hasPermission(session, "cases", "update", "own")) {
      throw new ForbiddenError("Insufficient permissions to add persons to case");
    }

    // Parse and validate request body
    const body = await request.json();
    const { personId, role, statement } = body;

    if (!personId) {
      throw new ValidationError("Person ID is required");
    }

    if (!role) {
      throw new ValidationError("Role is required");
    }

    const validRoles = ["suspect", "victim", "witness", "informant"];
    if (!validRoles.includes(role)) {
      throw new ValidationError(
        `Invalid role. Must be one of: ${validRoles.join(", ")}`
      );
    }

    // Create the case-person link
    const prisma = container.prismaClient;
    const auditRepo = container.auditLogRepository;

    // Check if case exists
    const caseExists = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseExists) {
      throw new NotFoundError("Case not found");
    }

    // Check if person exists
    const personExists = await prisma.person.findUnique({
      where: { id: personId },
    });
    if (!personExists) {
      throw new NotFoundError("Person not found");
    }

    // Check if link already exists
    const existingLink = await prisma.casePerson.findFirst({
      where: {
        caseId,
        personId,
        role,
      },
    });

    if (existingLink) {
      throw new ValidationError(
        `Person is already linked to this case as ${role}`
      );
    }

    // Create the link
    const casePerson = await prisma.casePerson.create({
      data: {
        caseId,
        personId,
        role,
        statement: statement || null,
      },
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            photoUrl: true,
            gender: true,
            dob: true,
          },
        },
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
        operation: "add_person",
        personId,
        role,
        personName: personExists.fullName,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      stationId: session.user.stationId,
    });

    return NextResponse.json(
      {
        message: "Person added to case successfully",
        casePerson: {
          linkId: casePerson.id,
          personId: casePerson.personId,
          role: casePerson.role,
          statement: casePerson.statement,
          createdAt: casePerson.createdAt,
          person: casePerson.person,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding person to case:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to add person to case" },
      { status: 500 }
    );
  }
}
