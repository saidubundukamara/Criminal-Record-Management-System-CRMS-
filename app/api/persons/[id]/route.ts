/**
 * Person API Routes (Individual)
 *
 * GET    /api/persons/[id] - Get person by ID
 * PATCH  /api/persons/[id] - Update person
 * DELETE /api/persons/[id] - Delete person
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { UpdatePersonInput } from "@/src/services/PersonService";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/persons/[id]
 * Get person by ID with relations
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "persons", "read", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Get person with relations
    const person = await container.personService.getPersonWithRelations(
      id,
      session.user.id
    );

    return NextResponse.json(
      {
        person: {
          id: person.id,
          nin: person.nin,
          firstName: person.firstName,
          lastName: person.lastName,
          middleName: person.middleName,
          fullName: person.getFullName(),
          displayName: person.getDisplayName(),
          alias: person.alias,
          dateOfBirth: person.dateOfBirth,
          age: person.getAge(),
          ageCategory: person.getAgeCategory(),
          isMinor: person.isMinor(),
          gender: person.gender,
          nationality: person.nationality,
          placeOfBirth: person.placeOfBirth,
          occupation: person.occupation,
          maritalStatus: person.maritalStatus,
          educationLevel: person.educationLevel,
          tribe: person.tribe,
          religion: person.religion,
          languagesSpoken: person.languagesSpoken,
          physicalDescription: person.physicalDescription,
          photoUrl: person.photoUrl,
          addresses: person.addresses,
          phoneNumbers: person.phoneNumbers,
          emails: person.emails,
          primaryAddress: person.getPrimaryAddress(),
          primaryPhone: person.getPrimaryPhone(),
          primaryEmail: person.getPrimaryEmail(),
          fingerprintHash: person.fingerprintHash,
          biometricHash: person.biometricHash,
          hasBiometrics: person.hasBiometricData(),
          criminalHistory: person.criminalHistory,
          riskLevel: person.riskLevel,
          riskLabel: person.getRiskLabel(),
          isWanted: person.isWanted,
          isDeceasedOrMissing: person.isDeceasedOrMissing,
          requiresSpecialHandling: person.requiresSpecialHandling(),
          notes: person.notes,
          hasCompleteId: person.hasCompleteIdentification(),
          hasContactInfo: person.hasContactInfo(),
          dataCompleteness: person.getDataCompletenessPercentage(),
          cases: person.cases,
          casesCount: person.casesCount,
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching person:", error);

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

/**
 * PATCH /api/persons/[id]
 * Update person
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

    // Prepare input
    const input: UpdatePersonInput = body;

    // Update person
    const person = await container.personService.updatePerson(
      id,
      input,
      session.user.id,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        person: {
          id: person.id,
          nin: person.nin,
          firstName: person.firstName,
          lastName: person.lastName,
          middleName: person.middleName,
          fullName: person.getFullName(),
          alias: person.alias,
          dateOfBirth: person.dateOfBirth,
          age: person.getAge(),
          gender: person.gender,
          nationality: person.nationality,
          placeOfBirth: person.placeOfBirth,
          occupation: person.occupation,
          maritalStatus: person.maritalStatus,
          educationLevel: person.educationLevel,
          tribe: person.tribe,
          religion: person.religion,
          languagesSpoken: person.languagesSpoken,
          physicalDescription: person.physicalDescription,
          photoUrl: person.photoUrl,
          addresses: person.addresses,
          phoneNumbers: person.phoneNumbers,
          emails: person.emails,
          fingerprintHash: person.fingerprintHash,
          biometricHash: person.biometricHash,
          criminalHistory: person.criminalHistory,
          riskLevel: person.riskLevel,
          isWanted: person.isWanted,
          isDeceasedOrMissing: person.isDeceasedOrMissing,
          notes: person.notes,
          dataCompleteness: person.getDataCompletenessPercentage(),
          updatedAt: person.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating person:", error);

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

/**
 * DELETE /api/persons/[id]
 * Delete person (only if not linked to cases)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "persons", "delete", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Delete person
    await container.personService.deletePerson(
      id,
      session.user.id,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      { message: "Person deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting person:", error);

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
