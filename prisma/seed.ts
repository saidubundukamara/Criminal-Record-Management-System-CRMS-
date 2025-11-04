import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";
import { encryptPII, hash as sha256Hash } from "../src/lib/encryption";
import crypto from "crypto";

const prisma = new PrismaClient();

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate a case number in format: {StationCode}-{Year}-{SequentialNumber}
 * Example: HQ-2025-000001
 */
function generateCaseNumber(stationCode: string, year: number, sequence: number): string {
  return `${stationCode}-${year}-${sequence.toString().padStart(6, "0")}`;
}

/**
 * Generate a unique QR code for evidence
 * Format: EVD-XXXX-XXXX
 */
function generateQRCode(): string {
  const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `EVD-${part1}-${part2}`;
}

/**
 * Create chain of custody entry
 */
function createCustodyEvent(officerId: string, action: string, location: string) {
  return {
    officerId,
    action,
    timestamp: new Date().toISOString(),
    location,
  };
}

/**
 * Generate Sierra Leone NIN (National Identification Number)
 * Format: SL-XXXXXXXX-X
 */
function generateNIN(): string {
  const middle = crypto.randomBytes(4).toString("hex").toUpperCase();
  const checkDigit = Math.floor(Math.random() * 10);
  return `SL-${middle}-${checkDigit}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ==================== PERMISSIONS ====================
  console.log("📋 Creating permissions...");

  const permissions = [
    // Cases
    { resource: "cases", action: "create", scope: "station" },
    { resource: "cases", action: "read", scope: "station" },
    { resource: "cases", action: "read", scope: "national" },
    { resource: "cases", action: "update", scope: "station" },
    { resource: "cases", action: "delete", scope: "national" },
    { resource: "cases", action: "export", scope: "station" },

    // Persons
    { resource: "persons", action: "create", scope: "station" },
    { resource: "persons", action: "read", scope: "national" },
    { resource: "persons", action: "update", scope: "station" },
    { resource: "persons", action: "delete", scope: "national" },

    // Evidence
    { resource: "evidence", action: "create", scope: "station" },
    { resource: "evidence", action: "read", scope: "station" },
    { resource: "evidence", action: "update", scope: "own" },
    { resource: "evidence", action: "delete", scope: "national" },

    // Officers
    { resource: "officers", action: "create", scope: "national" },
    { resource: "officers", action: "read", scope: "station" },
    { resource: "officers", action: "update", scope: "national" },
    { resource: "officers", action: "delete", scope: "national" },

    // Stations
    { resource: "stations", action: "create", scope: "national" },
    { resource: "stations", action: "read", scope: "national" },
    { resource: "stations", action: "update", scope: "national" },

    // Alerts
    { resource: "alerts", action: "create", scope: "station" },
    { resource: "alerts", action: "read", scope: "national" },
    { resource: "alerts", action: "update", scope: "station" },

    // Background Checks
    { resource: "bgcheck", action: "create", scope: "station" },
    { resource: "bgcheck", action: "read", scope: "station" },

    // Reports
    { resource: "reports", action: "create", scope: "station" },
    { resource: "reports", action: "read", scope: "station" },
    { resource: "reports", action: "export", scope: "national" },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) =>
      prisma.permission.upsert({
        where: { resource_action_scope: p },
        update: {},
        create: p,
      })
    )
  );

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // ==================== ROLES ====================
  console.log("👥 Creating roles...");

  // SuperAdmin - Full system access
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SuperAdmin" },
    update: {},
    create: {
      name: "SuperAdmin",
      description: "Full system access - All permissions",
      level: 1,
      permissions: {
        connect: createdPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // Admin - Regional/national administration
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "Regional/national administration",
      level: 2,
      permissions: {
        connect: createdPermissions
          .filter((p) => ["national", "region", "station"].includes(p.scope))
          .map((p) => ({ id: p.id })),
      },
    },
  });

  // StationCommander - Station-level oversight
  const commanderRole = await prisma.role.upsert({
    where: { name: "StationCommander" },
    update: {},
    create: {
      name: "StationCommander",
      description: "Station-level oversight and management",
      level: 3,
      permissions: {
        connect: createdPermissions
          .filter((p) => ["station", "own"].includes(p.scope))
          .map((p) => ({ id: p.id })),
      },
    },
  });

  // Officer - Operational police officer
  const officerRole = await prisma.role.upsert({
    where: { name: "Officer" },
    update: {},
    create: {
      name: "Officer",
      description: "Operational police officer",
      level: 4,
      permissions: {
        connect: createdPermissions
          .filter(
            (p) =>
              (p.resource === "cases" ||
                p.resource === "persons" ||
                p.resource === "evidence" ||
                p.resource === "bgcheck") &&
              ["station", "own"].includes(p.scope) &&
              p.action !== "delete"
          )
          .map((p) => ({ id: p.id })),
      },
    },
  });

  // EvidenceClerk - Evidence management specialist
  const clerkRole = await prisma.role.upsert({
    where: { name: "EvidenceClerk" },
    update: {},
    create: {
      name: "EvidenceClerk",
      description: "Evidence management specialist",
      level: 5,
      permissions: {
        connect: createdPermissions
          .filter((p) => p.resource === "evidence")
          .map((p) => ({ id: p.id })),
      },
    },
  });

  // Viewer - Read-only access
  const viewerRole = await prisma.role.upsert({
    where: { name: "Viewer" },
    update: {},
    create: {
      name: "Viewer",
      description: "Read-only access (prosecutors, judges, etc.)",
      level: 6,
      permissions: {
        connect: createdPermissions
          .filter((p) => p.action === "read")
          .map((p) => ({ id: p.id })),
      },
    },
  });

  console.log("✅ Created 6 roles");

  // ==================== STATIONS ====================
  console.log("🏢 Creating headquarters station...");

  const hqStation = await prisma.station.upsert({
    where: { code: "HQ-001" },
    update: {},
    create: {
      name: "Police Headquarters",
      code: "HQ-001",
      location: "Freetown",
      district: "Western Area",
      region: "Western",
      countryCode: "SLE",
      phone: "+232-XXX-XXXX",
      email: "hq@police.gov.sl",
    },
  });

  console.log("✅ Created headquarters station");

  // ==================== SUPERADMIN USER ====================
  console.log("👤 Creating SuperAdmin user...");

  const superAdminPin = await hash("12345678"); // ⚠️ CHANGE IN PRODUCTION!

  const superAdmin = await prisma.officer.upsert({
    where: { badge: "SA-00001" },
    update: {},
    create: {
      badge: "SA-00001",
      name: "System Administrator",
      email: "admin@police.gov.sl",
      phone: "+232-XXX-XXXX",
      pinHash: superAdminPin,
      roleId: superAdminRole.id,
      stationId: hqStation.id,
      active: true,
    },
  });

  console.log("✅ Created SuperAdmin user");

  // ==================== ADDITIONAL STATIONS ====================
  console.log("🏢 Creating additional district stations...");

  const boStation = await prisma.station.upsert({
    where: { code: "BO-001" },
    update: {},
    create: {
      name: "Bo District Police HQ",
      code: "BO-001",
      location: "Bo City",
      district: "Bo",
      region: "Southern Province",
      countryCode: "SLE",
      phone: "+232-76-XXX-XXXX",
      email: "bo@police.gov.sl",
    },
  });

  const kenemaStation = await prisma.station.upsert({
    where: { code: "KE-001" },
    update: {},
    create: {
      name: "Kenema District Police HQ",
      code: "KE-001",
      location: "Kenema City",
      district: "Kenema",
      region: "Eastern Province",
      countryCode: "SLE",
      phone: "+232-76-XXX-XXXY",
      email: "kenema@police.gov.sl",
    },
  });

  const makeniStation = await prisma.station.upsert({
    where: { code: "MA-001" },
    update: {},
    create: {
      name: "Makeni District Police HQ",
      code: "MA-001",
      location: "Makeni City",
      district: "Bombali",
      region: "Northern Province",
      countryCode: "SLE",
      phone: "+232-77-XXX-XXXX",
      email: "makeni@police.gov.sl",
    },
  });

  const portLokoStation = await prisma.station.upsert({
    where: { code: "PL-001" },
    update: {},
    create: {
      name: "Port Loko District Police Station",
      code: "PL-001",
      location: "Port Loko",
      district: "Port Loko",
      region: "North West Province",
      countryCode: "SLE",
      phone: "+232-78-XXX-XXXX",
      email: "portloko@police.gov.sl",
    },
  });

  const koiduStation = await prisma.station.upsert({
    where: { code: "KO-001" },
    update: {},
    create: {
      name: "Koidu Police Station",
      code: "KO-001",
      location: "Koidu City",
      district: "Kono",
      region: "Eastern Province",
      countryCode: "SLE",
      phone: "+232-79-XXX-XXXX",
      email: "koidu@police.gov.sl",
    },
  });

  console.log("✅ Created 5 additional district stations");

  // ==================== ADDITIONAL OFFICERS ====================
  console.log("👥 Creating additional officers...");

  const defaultPin = await hash("12345678");
  const ussdQuickPin = await hash("1234");

  // Admin - Freetown HQ
  const admin1 = await prisma.officer.upsert({
    where: { badge: "AD-00001" },
    update: {},
    create: {
      badge: "AD-00001",
      name: "Mohamed Kamara",
      email: "m.kamara@police.gov.sl",
      phone: "+232-76-111111",
      pinHash: defaultPin,
      roleId: adminRole.id,
      stationId: hqStation.id,
      active: true,
    },
  });

  // Station Commanders
  const commander1 = await prisma.officer.upsert({
    where: { badge: "SC-00001" },
    update: {},
    create: {
      badge: "SC-00001",
      name: "Aminata Sesay",
      email: "a.sesay@police.gov.sl",
      phone: "+232-76-222222",
      pinHash: defaultPin,
      roleId: commanderRole.id,
      stationId: boStation.id,
      active: true,
    },
  });

  const commander2 = await prisma.officer.upsert({
    where: { badge: "SC-00002" },
    update: {},
    create: {
      badge: "SC-00002",
      name: "Ibrahim Koroma",
      email: "i.koroma@police.gov.sl",
      phone: "+232-77-333333",
      pinHash: defaultPin,
      roleId: commanderRole.id,
      stationId: makeniStation.id,
      active: true,
      ussdEnabled: true,
      ussdPhoneNumber: "+232-77-333333",
      ussdQuickPinHash: ussdQuickPin,
    },
  });

  // Officers
  const officer1 = await prisma.officer.upsert({
    where: { badge: "OF-00001" },
    update: {},
    create: {
      badge: "OF-00001",
      name: "Fatmata Bangura",
      email: "f.bangura@police.gov.sl",
      phone: "+232-78-444444",
      pinHash: defaultPin,
      roleId: officerRole.id,
      stationId: hqStation.id,
      active: true,
    },
  });

  const officer2 = await prisma.officer.upsert({
    where: { badge: "OF-00002" },
    update: {},
    create: {
      badge: "OF-00002",
      name: "Abu Bakarr Turay",
      email: "a.turay@police.gov.sl",
      phone: "+232-76-555555",
      pinHash: defaultPin,
      roleId: officerRole.id,
      stationId: kenemaStation.id,
      active: true,
      ussdEnabled: true,
      ussdPhoneNumber: "+232-76-555555",
      ussdQuickPinHash: ussdQuickPin,
    },
  });

  const officer3 = await prisma.officer.upsert({
    where: { badge: "OF-00003" },
    update: {},
    create: {
      badge: "OF-00003",
      name: "Isatu Conteh",
      email: "i.conteh@police.gov.sl",
      phone: "+232-79-666666",
      pinHash: defaultPin,
      roleId: officerRole.id,
      stationId: portLokoStation.id,
      active: true,
      ussdEnabled: true,
      ussdPhoneNumber: "+232-79-666666",
      ussdQuickPinHash: ussdQuickPin,
    },
  });

  // Evidence Clerk
  const evidenceClerk1 = await prisma.officer.upsert({
    where: { badge: "EC-00001" },
    update: {},
    create: {
      badge: "EC-00001",
      name: "Samuel Jalloh",
      email: "s.jalloh@police.gov.sl",
      phone: "+232-77-777777",
      pinHash: defaultPin,
      roleId: clerkRole.id,
      stationId: hqStation.id,
      active: true,
    },
  });

  // Viewer (Prosecutor)
  const viewer1 = await prisma.officer.upsert({
    where: { badge: "VW-00001" },
    update: {},
    create: {
      badge: "VW-00001",
      name: "Mariatu Kargbo",
      email: "m.kargbo@justice.gov.sl",
      phone: "+232-78-888888",
      pinHash: defaultPin,
      roleId: viewerRole.id,
      stationId: hqStation.id,
      active: true,
    },
  });

  console.log("✅ Created 8 additional officers (3 with USSD support)");

  // ==================== PERSONS ====================
  console.log("👤 Creating persons with encrypted PII...");

  const person1 = await prisma.person.create({
    data: {
      firstName: "Joseph",
      lastName: "Kamara",
      fullName: "Joseph Kamara",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1985-03-15"),
      gender: "M",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("15 Kissy Road, Freetown"),
      phoneEncrypted: encryptPII("+232-76-123456"),
      emailEncrypted: encryptPII("j.kamara@example.sl"),
      createdById: officer1.id,
      stationId: hqStation.id,
      riskLevel: "low",
    },
  });

  const person2 = await prisma.person.create({
    data: {
      firstName: "Hawa",
      lastName: "Sesay",
      fullName: "Hawa Sesay",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1990-07-22"),
      gender: "F",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("23 Lumley Beach Road, Freetown"),
      phoneEncrypted: encryptPII("+232-77-234567"),
      createdById: officer1.id,
      stationId: hqStation.id,
      riskLevel: "low",
    },
  });

  const person3 = await prisma.person.create({
    data: {
      firstName: "Abdul",
      lastName: "Koroma",
      fullName: "Abdul Rahman Koroma",
      middleName: "Rahman",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1982-11-10"),
      gender: "M",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("45 Main Street, Bo City"),
      phoneEncrypted: encryptPII("+232-76-345678"),
      createdById: commander1.id,
      stationId: boStation.id,
      riskLevel: "medium",
      aliases: ["Abdul K", "Rahman"],
    },
  });

  const person4 = await prisma.person.create({
    data: {
      firstName: "Mariama",
      lastName: "Bangura",
      fullName: "Mariama Bangura",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1995-01-05"),
      gender: "F",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("12 Market Street, Kenema"),
      phoneEncrypted: encryptPII("+232-78-456789"),
      emailEncrypted: encryptPII("m.bangura@example.sl"),
      createdById: officer2.id,
      stationId: kenemaStation.id,
      riskLevel: "low",
    },
  });

  const person5 = await prisma.person.create({
    data: {
      firstName: "Samuel",
      lastName: "Conteh",
      fullName: "Samuel Conteh",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1978-09-18"),
      gender: "M",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("78 King Street, Makeni"),
      phoneEncrypted: encryptPII("+232-79-567890"),
      createdById: commander2.id,
      stationId: makeniStation.id,
      riskLevel: "high",
      aliases: ["Sam Conteh", "Big Sam"],
      isWanted: true,
      wantedSince: new Date("2024-10-01"),
    },
  });

  const person6 = await prisma.person.create({
    data: {
      firstName: "Fatmata",
      lastName: "Turay",
      fullName: "Fatmata Turay",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1988-06-30"),
      gender: "F",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("34 Station Road, Port Loko"),
      phoneEncrypted: encryptPII("+232-76-678901"),
      createdById: officer3.id,
      stationId: portLokoStation.id,
      riskLevel: "low",
    },
  });

  const person7 = await prisma.person.create({
    data: {
      firstName: "Mohamed",
      lastName: "Jalloh",
      fullName: "Mohamed Jalloh",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1992-04-12"),
      gender: "M",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("56 Commercial Avenue, Koidu"),
      phoneEncrypted: encryptPII("+232-77-789012"),
      createdById: officer1.id,
      stationId: hqStation.id,
      riskLevel: "medium",
    },
  });

  const person8 = await prisma.person.create({
    data: {
      firstName: "Aminata",
      lastName: "Kargbo",
      fullName: "Aminata Kargbo",
      dob: new Date("2010-08-20"),
      gender: "F",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("89 School Road, Bo City"),
      createdById: commander1.id,
      stationId: boStation.id,
      riskLevel: "low",
      isDeceasedOrMissing: true,
    },
  });

  const person9 = await prisma.person.create({
    data: {
      firstName: "Ibrahim",
      lastName: "Mansaray",
      fullName: "Ibrahim Mansaray",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1980-12-25"),
      gender: "M",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("101 Hill Station, Freetown"),
      phoneEncrypted: encryptPII("+232-78-890123"),
      emailEncrypted: encryptPII("i.mansaray@example.sl"),
      createdById: officer1.id,
      stationId: hqStation.id,
      riskLevel: "low",
    },
  });

  const person10 = await prisma.person.create({
    data: {
      firstName: "Isatu",
      lastName: "Kamara",
      fullName: "Isatu Kamara",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1975-02-14"),
      gender: "F",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("22 Government Wharf, Freetown"),
      phoneEncrypted: encryptPII("+232-76-901234"),
      createdById: officer1.id,
      stationId: hqStation.id,
      riskLevel: "low",
    },
  });

  const person11 = await prisma.person.create({
    data: {
      firstName: "Alimamy",
      lastName: "Koroma",
      fullName: "Alimamy Koroma",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1987-05-08"),
      gender: "M",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("67 Waterloo Street, Freetown"),
      phoneEncrypted: encryptPII("+232-77-012345"),
      createdById: officer1.id,
      stationId: hqStation.id,
      riskLevel: "medium",
      aliases: ["Alimamy K"],
    },
  });

  const person12 = await prisma.person.create({
    data: {
      firstName: "Kadiatu",
      lastName: "Bangura",
      fullName: "Kadiatu Bangura",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1993-09-03"),
      gender: "F",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("45 Circular Road, Kenema"),
      phoneEncrypted: encryptPII("+232-78-123450"),
      createdById: officer2.id,
      stationId: kenemaStation.id,
      riskLevel: "low",
    },
  });

  const person13 = await prisma.person.create({
    data: {
      firstName: "Momodu",
      lastName: "Sesay",
      fullName: "Momodu Sesay",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1984-11-29"),
      gender: "M",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("33 Makeni Highway, Makeni"),
      phoneEncrypted: encryptPII("+232-79-234561"),
      createdById: commander2.id,
      stationId: makeniStation.id,
      riskLevel: "medium",
    },
  });

  const person14 = await prisma.person.create({
    data: {
      firstName: "Jenneh",
      lastName: "Conteh",
      fullName: "Jenneh Conteh",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1991-03-17"),
      gender: "F",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("78 Ferry Road, Port Loko"),
      phoneEncrypted: encryptPII("+232-76-345672"),
      createdById: officer3.id,
      stationId: portLokoStation.id,
      riskLevel: "low",
    },
  });

  const person15 = await prisma.person.create({
    data: {
      firstName: "Abu",
      lastName: "Kamara",
      fullName: "Abu Kamara",
      nationalId: generateNIN(),
      idType: "NIN",
      dob: new Date("1979-07-11"),
      gender: "M",
      nationality: "SLE",
      countryCode: "SLE",
      addressEncrypted: encryptPII("90 Diamond Road, Koidu"),
      phoneEncrypted: encryptPII("+232-77-456783"),
      fingerprintHash: sha256Hash("fingerprint-abu-kamara"),
      createdById: officer1.id,
      stationId: hqStation.id,
      riskLevel: "high",
      aliases: ["Abu K", "Diamond Abu"],
      isWanted: true,
      wantedSince: new Date("2024-11-01"),
    },
  });

  console.log("✅ Created 15 persons with encrypted PII");

  // ==================== CASES ====================
  console.log("📁 Creating cases with realistic scenarios...");

  // Case 1: Armed Robbery in Freetown (investigating)
  const case1 = await prisma.case.create({
    data: {
      caseNumber: generateCaseNumber("HQ", 2025, 1),
      title: "Armed Robbery at Kissy Market",
      description: "Armed robbery incident at Kissy Market. Two suspects attacked shopkeeper with knife, stealing cash and goods worth approximately Le 5,000,000.",
      category: "robbery",
      severity: "major",
      status: "investigating",
      incidentDate: new Date("2025-01-10"),
      reportedDate: new Date("2025-01-10"),
      location: "Kissy Market, Freetown",
      stationId: hqStation.id,
      officerId: officer1.id,
    },
  });

  // Case 2: Missing Child in Bo (open, will link to AmberAlert)
  const case2 = await prisma.case.create({
    data: {
      caseNumber: generateCaseNumber("BO", 2025, 1),
      title: "Missing Child - Aminata Kargbo",
      description: "13-year-old Aminata Kargbo reported missing. Last seen near her school in Bo City on January 15, 2025.",
      category: "kidnapping",
      severity: "critical",
      status: "open",
      incidentDate: new Date("2025-01-15"),
      reportedDate: new Date("2025-01-15"),
      location: "School Road, Bo City",
      stationId: boStation.id,
      officerId: commander1.id,
    },
  });

  // Case 3: Domestic Assault in Makeni (charged)
  const case3 = await prisma.case.create({
    data: {
      caseNumber: generateCaseNumber("MA", 2025, 1),
      title: "Domestic Violence Assault",
      description: "Domestic violence incident. Suspect Samuel Conteh assaulted his spouse causing serious injuries. Victim hospitalized.",
      category: "assault",
      severity: "major",
      status: "charged",
      incidentDate: new Date("2025-01-05"),
      reportedDate: new Date("2025-01-05"),
      location: "King Street, Makeni",
      stationId: makeniStation.id,
      officerId: commander2.id,
    },
  });

  // Case 4: Financial Fraud in Kenema (court)
  const case4 = await prisma.case.create({
    data: {
      caseNumber: generateCaseNumber("KE", 2025, 1),
      title: "Bank Fraud Investigation",
      description: "Financial fraud case involving unauthorized transactions. Suspect Mohamed Jalloh allegedly defrauded multiple customers of approximately Le 15,000,000.",
      category: "fraud",
      severity: "major",
      status: "court",
      incidentDate: new Date("2024-12-01"),
      reportedDate: new Date("2024-12-05"),
      location: "Commercial Avenue, Kenema",
      stationId: kenemaStation.id,
      officerId: officer2.id,
    },
  });

  // Case 5: Murder Investigation in Freetown (investigating, suspect wanted)
  const case5 = await prisma.case.create({
    data: {
      caseNumber: generateCaseNumber("HQ", 2025, 2),
      title: "Homicide Investigation - Ibrahim Mansaray",
      description: "Murder investigation. Victim Ibrahim Mansaray found deceased. Primary suspect Abu Kamara currently at large and wanted.",
      category: "murder",
      severity: "critical",
      status: "investigating",
      incidentDate: new Date("2024-12-28"),
      reportedDate: new Date("2024-12-28"),
      location: "Hill Station, Freetown",
      stationId: hqStation.id,
      officerId: officer1.id,
    },
  });

  // Case 6: Petty Theft (closed)
  const case6 = await prisma.case.create({
    data: {
      caseNumber: generateCaseNumber("PL", 2025, 1),
      title: "Petty Theft - Mobile Phone",
      description: "Theft of mobile phone from victim. Suspect apprehended and phone recovered.",
      category: "theft",
      severity: "minor",
      status: "closed",
      incidentDate: new Date("2025-01-08"),
      reportedDate: new Date("2025-01-08"),
      location: "Ferry Road, Port Loko",
      stationId: portLokoStation.id,
      officerId: officer3.id,
    },
  });

  // Case 7: Assault (open)
  const case7 = await prisma.case.create({
    data: {
      caseNumber: generateCaseNumber("BO", 2025, 2),
      title: "Assault at Local Bar",
      description: "Physical altercation at local bar resulting in injuries. Investigation ongoing to identify all involved parties.",
      category: "assault",
      severity: "minor",
      status: "open",
      incidentDate: new Date("2025-01-18"),
      reportedDate: new Date("2025-01-19"),
      location: "Main Street, Bo City",
      stationId: boStation.id,
      officerId: commander1.id,
    },
  });

  console.log("✅ Created 7 cases with realistic scenarios");

  // ==================== CASE-PERSON RELATIONSHIPS ====================
  console.log("🔗 Creating case-person relationships...");

  // Case 1: Armed Robbery - Suspects, Victim, Witnesses
  await prisma.casePerson.createMany({
    data: [
      { caseId: case1.id, personId: person3.id, role: "suspect", statement: "Suspect identified by witness. Currently in custody." },
      { caseId: case1.id, personId: person11.id, role: "suspect", statement: "Second suspect apprehended at scene." },
      { caseId: case1.id, personId: person1.id, role: "victim", statement: "Shopkeeper attacked and robbed at knifepoint." },
      { caseId: case1.id, personId: person2.id, role: "witness", statement: "Witnessed the attack and called police." },
      { caseId: case1.id, personId: person9.id, role: "witness", statement: "Saw suspects fleeing the scene." },
    ],
  });

  // Case 2: Missing Child - Missing person, Informant
  await prisma.casePerson.createMany({
    data: [
      { caseId: case2.id, personId: person8.id, role: "victim", statement: "Missing child, last seen near school." },
      { caseId: case2.id, personId: person6.id, role: "informant", statement: "Mother of missing child, reported to police." },
      { caseId: case2.id, personId: person12.id, role: "witness", statement: "Last person to see child before disappearance." },
    ],
  });

  // Case 3: Domestic Assault - Suspect, Victim, Witness
  await prisma.casePerson.createMany({
    data: [
      { caseId: case3.id, personId: person5.id, role: "suspect", statement: "Accused of assaulting spouse. Arrested and charged." },
      { caseId: case3.id, personId: person14.id, role: "victim", statement: "Victim of domestic violence, hospitalized with injuries." },
      { caseId: case3.id, personId: person13.id, role: "witness", statement: "Neighbor who heard altercation and called police." },
    ],
  });

  // Case 4: Fraud - Suspect, Victims
  await prisma.casePerson.createMany({
    data: [
      { caseId: case4.id, personId: person7.id, role: "suspect", statement: "Bank employee accused of fraud. Case in court." },
      { caseId: case4.id, personId: person4.id, role: "victim", statement: "Lost Le 3,000,000 in unauthorized transactions." },
      { caseId: case4.id, personId: person12.id, role: "victim", statement: "Lost Le 2,500,000 in fraudulent transfers." },
      { caseId: case4.id, personId: person10.id, role: "witness", statement: "Bank manager who discovered the fraud." },
    ],
  });

  // Case 5: Murder - Suspect (wanted), Victim, Witnesses
  await prisma.casePerson.createMany({
    data: [
      { caseId: case5.id, personId: person15.id, role: "suspect", statement: "Primary suspect in murder. Currently at large and wanted." },
      { caseId: case5.id, personId: person9.id, role: "victim", statement: "Deceased victim. Homicide investigation ongoing." },
      { caseId: case5.id, personId: person1.id, role: "witness", statement: "Saw suspect near victim's residence on night of incident." },
      { caseId: case5.id, personId: person10.id, role: "witness", statement: "Heard argument between victim and suspect earlier that day." },
    ],
  });

  // Case 6: Petty Theft - Suspect, Victim (closed case)
  await prisma.casePerson.createMany({
    data: [
      { caseId: case6.id, personId: person13.id, role: "suspect", statement: "Apprehended with stolen phone. Confessed to theft." },
      { caseId: case6.id, personId: person14.id, role: "victim", statement: "Phone stolen and later recovered." },
    ],
  });

  // Case 7: Assault - Suspects, Victim
  await prisma.casePerson.createMany({
    data: [
      { caseId: case7.id, personId: person11.id, role: "suspect", statement: "Involved in bar fight. Investigation ongoing." },
      { caseId: case7.id, personId: person3.id, role: "victim", statement: "Injured in altercation at bar." },
      { caseId: case7.id, personId: person7.id, role: "witness", statement: "Bartender who witnessed the fight." },
    ],
  });

  console.log("✅ Created 27 case-person relationships");

  // ==================== EVIDENCE ====================
  console.log("📦 Creating evidence items with chain of custody...");

  // Evidence for Case 1: Armed Robbery
  await prisma.evidence.create({
    data: {
      caseId: case1.id,
      type: "physical",
      description: "Kitchen knife used in robbery, 8-inch blade",
      qrCode: generateQRCode(),
      status: "stored",
      collectedLocation: "Kissy Market crime scene",
      collectedDate: new Date("2025-01-10T14:30:00"),
      collectedById: officer1.id,
      stationId: hqStation.id,
      tags: ["weapon", "critical"],
      chainOfCustody: [
        createCustodyEvent(officer1.id, "collected", "Kissy Market crime scene"),
        createCustodyEvent(evidenceClerk1.id, "received", "HQ Evidence Room"),
      ],
    },
  });

  await prisma.evidence.create({
    data: {
      caseId: case1.id,
      type: "digital",
      description: "CCTV footage from market showing suspects",
      qrCode: generateQRCode(),
      status: "stored",
      collectedLocation: "Kissy Market",
      collectedDate: new Date("2025-01-10T15:00:00"),
      collectedById: officer1.id,
      stationId: hqStation.id,
      tags: ["digital", "video"],
      fileName: "cctv_kissy_market_20250110.mp4",
      mimeType: "video/mp4",
      fileSize: 45678900,
      fileHash: sha256Hash("cctv-footage-case1"),
      chainOfCustody: [
        createCustodyEvent(officer1.id, "collected", "Kissy Market"),
        createCustodyEvent(evidenceClerk1.id, "received", "HQ Evidence Room"),
      ],
    },
  });

  // Evidence for Case 2: Missing Child
  await prisma.evidence.create({
    data: {
      caseId: case2.id,
      type: "document",
      description: "School attendance record for Aminata Kargbo",
      qrCode: generateQRCode(),
      status: "stored",
      collectedLocation: "Bo City School",
      collectedDate: new Date("2025-01-15T11:00:00"),
      collectedById: commander1.id,
      stationId: hqStation.id,
      tags: ["document", "missing-person"],
      chainOfCustody: [
        createCustodyEvent(commander1.id, "collected", "Bo City School"),
        createCustodyEvent(evidenceClerk1.id, "received", "HQ Evidence Room"),
      ],
    },
  });

  await prisma.evidence.create({
    data: {
      caseId: case2.id,
      type: "photo",
      description: "Recent photo of missing child",
      qrCode: generateQRCode(),
      status: "stored",
      collectedLocation: "Family residence",
      collectedDate: new Date("2025-01-15T10:30:00"),
      collectedById: commander1.id,
      stationId: hqStation.id,
      tags: ["photo", "missing-person"],
      fileName: "aminata_kargbo_photo.jpg",
      mimeType: "image/jpeg",
      fileSize: 234567,
      chainOfCustody: [
        createCustodyEvent(commander1.id, "collected", "Family residence"),
      ],
    },
  });

  // Evidence for Case 3: Domestic Assault
  await prisma.evidence.create({
    data: {
      caseId: case3.id,
      type: "document",
      description: "Medical report documenting victim's injuries",
      qrCode: generateQRCode(),
      status: "court",
      collectedLocation: "Makeni Hospital",
      collectedDate: new Date("2025-01-05T18:00:00"),
      collectedById: commander2.id,
      stationId: makeniStation.id,
      tags: ["medical", "forensic"],
      fileName: "medical_report_conteh.pdf",
      mimeType: "application/pdf",
      fileSize: 123456,
      chainOfCustody: [
        createCustodyEvent(commander2.id, "collected", "Makeni Hospital"),
      ],
    },
  });

  await prisma.evidence.create({
    data: {
      caseId: case3.id,
      type: "photo",
      description: "Photos of victim's injuries",
      qrCode: generateQRCode(),
      status: "court",
      collectedLocation: "Makeni Hospital",
      collectedDate: new Date("2025-01-05T18:30:00"),
      collectedById: commander2.id,
      stationId: makeniStation.id,
      tags: ["photo", "forensic"],
      fileName: "victim_injuries.jpg",
      mimeType: "image/jpeg",
      fileSize: 345678,
      chainOfCustody: [
        createCustodyEvent(commander2.id, "collected", "Makeni Hospital"),
      ],
    },
  });

  // Evidence for Case 4: Fraud
  await prisma.evidence.create({
    data: {
      caseId: case4.id,
      type: "document",
      description: "Bank transaction records showing fraudulent transfers",
      qrCode: generateQRCode(),
      status: "court",
      collectedLocation: "Bank of Sierra Leone, Kenema Branch",
      collectedDate: new Date("2024-12-05T09:00:00"),
      collectedById: officer2.id,
      stationId: kenemaStation.id,
      tags: ["document", "financial", "critical"],
      fileName: "bank_records_fraud.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 567890,
      fileHash: sha256Hash("bank-records-case4"),
      chainOfCustody: [
        createCustodyEvent(officer2.id, "collected", "Bank of Sierra Leone, Kenema Branch"),
        createCustodyEvent(evidenceClerk1.id, "received", "HQ Evidence Room"),
      ],
    },
  });

  await prisma.evidence.create({
    data: {
      caseId: case4.id,
      type: "document",
      description: "Forged authorization documents",
      qrCode: generateQRCode(),
      status: "court",
      collectedLocation: "Bank of Sierra Leone, Kenema Branch",
      collectedDate: new Date("2024-12-06T10:00:00"),
      collectedById: officer2.id,
      stationId: kenemaStation.id,
      tags: ["document", "forgery"],
      chainOfCustody: [
        createCustodyEvent(officer2.id, "collected", "Bank of Sierra Leone, Kenema Branch"),
        createCustodyEvent(evidenceClerk1.id, "received", "HQ Evidence Room"),
      ],
    },
  });

  // Evidence for Case 5: Murder
  await prisma.evidence.create({
    data: {
      caseId: case5.id,
      type: "physical",
      description: "Potential murder weapon recovered from scene",
      qrCode: generateQRCode(),
      status: "analyzed",
      collectedLocation: "Hill Station crime scene",
      collectedDate: new Date("2024-12-28T20:00:00"),
      collectedById: officer1.id,
      stationId: hqStation.id,
      tags: ["weapon", "critical", "forensic"],
      isSealed: true,
      sealedAt: new Date("2024-12-28T22:00:00"),
      sealedById: evidenceClerk1.id,
      chainOfCustody: [
        createCustodyEvent(officer1.id, "collected", "Hill Station crime scene"),
        createCustodyEvent(evidenceClerk1.id, "received", "HQ Evidence Room"),
        createCustodyEvent(evidenceClerk1.id, "sent_for_analysis", "Forensic Lab"),
      ],
    },
  });

  await prisma.evidence.create({
    data: {
      caseId: case5.id,
      type: "biological",
      description: "DNA samples from crime scene",
      qrCode: generateQRCode(),
      status: "analyzed",
      collectedLocation: "Hill Station crime scene",
      collectedDate: new Date("2024-12-28T21:00:00"),
      collectedById: officer1.id,
      stationId: hqStation.id,
      tags: ["dna", "critical", "forensic"],
      isSealed: true,
      sealedAt: new Date("2024-12-28T22:30:00"),
      sealedById: evidenceClerk1.id,
      chainOfCustody: [
        createCustodyEvent(officer1.id, "collected", "Hill Station crime scene"),
        createCustodyEvent(evidenceClerk1.id, "received", "HQ Evidence Room"),
        createCustodyEvent(evidenceClerk1.id, "sent_for_analysis", "Forensic Lab"),
      ],
    },
  });

  // Evidence for Case 6: Petty Theft (closed)
  await prisma.evidence.create({
    data: {
      caseId: case6.id,
      type: "physical",
      description: "Recovered stolen mobile phone (Samsung Galaxy)",
      qrCode: generateQRCode(),
      status: "returned",
      collectedLocation: "Port Loko Station",
      collectedDate: new Date("2025-01-08T16:00:00"),
      collectedById: officer3.id,
      stationId: portLokoStation.id,
      tags: ["stolen-property", "recovered"],
      notes: "Returned to rightful owner after case closure",
      chainOfCustody: [
        createCustodyEvent(officer3.id, "collected", "Port Loko Station"),
        createCustodyEvent(officer3.id, "returned_to_owner", "Port Loko Station"),
      ],
    },
  });

  console.log("✅ Created 12 evidence items with chain of custody");

  // ==================== CASE NOTES ====================
  console.log("📝 Creating case notes...");

  await prisma.caseNote.createMany({
    data: [
      { caseId: case1.id, content: "Initial investigation underway. Two suspects in custody. Reviewing CCTV footage." },
      { caseId: case1.id, content: "Interviewed victims and witnesses. Weapon recovered and logged as evidence." },
      { caseId: case2.id, content: "Missing child case opened. AmberAlert issued. Family interviewed." },
      { caseId: case2.id, content: "Search teams deployed in Bo City. Checking with neighboring districts." },
      { caseId: case3.id, content: "Suspect arrested and charged. Victim's medical report obtained." },
      { caseId: case3.id, content: "Case forwarded to prosecutor. Court date pending." },
      { caseId: case4.id, content: "Bank records obtained. Multiple victims identified. Suspect denies allegations." },
      { caseId: case4.id, content: "Forensic accounting review in progress. Case now in court." },
      { caseId: case5.id, content: "Homicide investigation ongoing. Primary suspect identified but at large. Wanted notice issued." },
      { caseId: case5.id, content: "Forensic evidence sent for DNA analysis. Awaiting lab results." },
      { caseId: case6.id, content: "Suspect apprehended with stolen phone. Confessed to theft. Phone returned to owner." },
      { caseId: case6.id, content: "Case closed. Suspect charged with petty theft." },
    ],
  });

  console.log("✅ Created 12 case notes");

  // ==================== AMBER ALERTS ====================
  console.log("🚨 Creating Amber Alerts...");

  await prisma.amberAlert.createMany({
    data: [
      {
        personName: "Aminata Kargbo",
        age: 13,
        gender: "F",
        description: "13-year-old girl, last seen wearing blue school uniform. Shoulder-length hair.",
        lastSeenLocation: "School Road, Bo City",
        lastSeenDate: new Date("2025-01-15T15:30:00"),
        contactPhone: "+232-76-222222",
        status: "active",
        publishedAt: new Date("2025-01-15T16:00:00"),
        createdById: commander1.id,
      },
      {
        personName: "Mohamed Koroma",
        age: 8,
        gender: "M",
        description: "8-year-old boy, last seen near Lumley Beach. Wearing red t-shirt and blue shorts.",
        lastSeenLocation: "Lumley Beach, Freetown",
        lastSeenDate: new Date("2025-01-12T14:00:00"),
        contactPhone: "+232-76-111111",
        status: "active",
        publishedAt: new Date("2025-01-12T15:00:00"),
        createdById: officer1.id,
      },
      {
        personName: "Fatmata Sesay",
        age: 10,
        gender: "F",
        description: "10-year-old girl, found safe and reunited with family.",
        lastSeenLocation: "Market Street, Kenema",
        lastSeenDate: new Date("2025-01-05T10:00:00"),
        contactPhone: "+232-76-555555",
        status: "found",
        publishedAt: new Date("2025-01-05T12:00:00"),
        expiresAt: new Date("2025-01-06T12:00:00"),
        createdById: officer2.id,
      },
      {
        personName: "Ibrahim Turay",
        age: 7,
        gender: "M",
        description: "7-year-old boy. Alert expired, case still under investigation.",
        lastSeenLocation: "Port Loko Town Center",
        lastSeenDate: new Date("2024-12-20T16:00:00"),
        contactPhone: "+232-79-666666",
        status: "expired",
        publishedAt: new Date("2024-12-20T17:00:00"),
        expiresAt: new Date("2024-12-27T17:00:00"),
        createdById: officer3.id,
      },
    ],
  });

  console.log("✅ Created 4 Amber Alerts");

  // ==================== WANTED PERSONS ====================
  console.log("🔍 Creating wanted persons...");

  await prisma.wantedPerson.createMany({
    data: [
      {
        personId: person15.id,
        name: "Abu Kamara",
        aliases: ["Abu K", "Diamond Abu"],
        charges: ["Murder", "Armed Robbery"],
        description: "Male, approximately 45 years old, last seen in Freetown area. Considered armed and dangerous.",
        dangerLevel: "extreme",
        reward: 10000000,
        warrantNumber: "HQ-W-2025-001",
        lastSeenLocation: "Hill Station, Freetown",
        lastSeenDate: new Date("2024-12-29"),
        status: "active",
        regionalAlert: true,
        priority: 100,
        publishedAt: new Date("2024-12-30"),
        createdById: officer1.id,
      },
      {
        personId: person5.id,
        name: "Samuel Conteh",
        aliases: ["Sam Conteh", "Big Sam"],
        charges: ["Domestic Violence", "Assault"],
        description: "Male, 47 years old. Arrest warrant issued. Not considered armed.",
        dangerLevel: "medium",
        warrantNumber: "MA-W-2025-001",
        lastSeenLocation: "Makeni City",
        lastSeenDate: new Date("2025-01-04"),
        status: "captured",
        capturedAt: new Date("2025-01-05"),
        capturedLocation: "Makeni Police Station",
        publishedAt: new Date("2025-01-04"),
        createdById: commander2.id,
      },
      {
        name: "Unknown Male",
        charges: ["Armed Robbery", "Assault"],
        description: "Male, approximately 25-30 years old, medium build. Involved in series of robberies in Kenema district.",
        dangerLevel: "high",
        reward: 3000000,
        lastSeenLocation: "Kenema City",
        lastSeenDate: new Date("2025-01-10"),
        status: "active",
        publishedAt: new Date("2025-01-11"),
        createdById: officer2.id,
      },
      {
        name: "Alimamy Koroma Jr.",
        charges: ["Theft", "Burglary"],
        description: "Male, 22 years old. Wanted for multiple burglaries in Bo district.",
        dangerLevel: "low",
        reward: 500000,
        warrantNumber: "BO-W-2025-002",
        lastSeenLocation: "Bo City",
        lastSeenDate: new Date("2025-01-08"),
        status: "active",
        publishedAt: new Date("2025-01-09"),
        createdById: commander1.id,
      },
      {
        name: "Mariama Bangura",
        charges: ["Fraud", "Forgery"],
        description: "Female, 35 years old. Wanted for document forgery and fraud.",
        dangerLevel: "low",
        warrantNumber: "HQ-W-2025-003",
        lastSeenLocation: "Freetown",
        lastSeenDate: new Date("2025-01-01"),
        status: "active",
        publishedAt: new Date("2025-01-02"),
        createdById: admin1.id,
      },
    ],
  });

  console.log("✅ Created 5 wanted persons");

  // ==================== BACKGROUND CHECKS ====================
  console.log("📋 Creating background checks...");

  await prisma.backgroundCheck.createMany({
    data: [
      {
        nin: person1.nationalId!,
        requestType: "officer",
        requestedById: officer1.id,
        status: "completed",
        result: { status: "clear", message: "No criminal record found" },
        issuedAt: new Date("2025-01-10"),
      },
      {
        nin: person3.nationalId!,
        requestType: "officer",
        requestedById: officer1.id,
        status: "completed",
        result: {
          status: "record_exists",
          message: "Criminal record found",
          cases: ["HQ-2025-000001 - Armed Robbery (investigating)"],
        },
        issuedAt: new Date("2025-01-11"),
      },
      {
        nin: person7.nationalId!,
        requestType: "citizen",
        phoneNumber: "+232-77-789012",
        status: "completed",
        result: { status: "record_exists", message: "Record exists. Visit nearest police station for details." },
        issuedAt: new Date("2025-01-12"),
      },
      {
        nin: person2.nationalId!,
        requestType: "employer",
        requestedById: viewer1.id,
        status: "completed",
        result: { status: "clear", message: "No criminal record found. Suitable for employment." },
        issuedAt: new Date("2025-01-13"),
      },
      {
        nin: person4.nationalId!,
        requestType: "visa",
        requestedById: officer2.id,
        status: "completed",
        result: { status: "clear", message: "No criminal record. Visa background check passed." },
        issuedAt: new Date("2025-01-14"),
      },
      {
        nin: person15.nationalId!,
        requestType: "officer",
        requestedById: officer1.id,
        status: "completed",
        result: {
          status: "record_exists",
          message: "Serious criminal record found. Wanted for murder.",
          cases: ["HQ-2025-000002 - Murder (investigating)"],
          wanted: true,
        },
        issuedAt: new Date("2024-12-29"),
      },
      {
        nin: person6.nationalId!,
        requestType: "citizen",
        phoneNumber: "+232-76-678901",
        status: "completed",
        result: { status: "clear", message: "No criminal record found." },
        issuedAt: new Date("2025-01-15"),
      },
      {
        nin: person10.nationalId!,
        requestType: "officer",
        requestedById: officer1.id,
        status: "pending",
        result: {},
      },
    ],
  });

  console.log("✅ Created 8 background checks");

  // ==================== VEHICLES ====================
  console.log("🚗 Creating vehicles...");

  await prisma.vehicle.createMany({
    data: [
      {
        licensePlate: "AAB-1234",
        vehicleType: "sedan",
        ownerNIN: person1.nationalId,
        ownerName: "Joseph Kamara",
        make: "Toyota",
        model: "Corolla",
        color: "White",
        year: 2018,
        status: "active",
        stationId: hqStation.id,
      },
      {
        licensePlate: "AFT-5678",
        vehicleType: "suv",
        ownerNIN: person7.nationalId,
        ownerName: "Mohamed Jalloh",
        make: "Nissan",
        model: "Patrol",
        color: "Black",
        year: 2020,
        status: "stolen",
        stolenDate: new Date("2024-12-15"),
        stolenReportedBy: officer2.id,
        notes: "Stolen from Koidu. Linked to fraud case KE-2025-000001.",
        stationId: kenemaStation.id,
      },
      {
        licensePlate: "HQ-9012",
        vehicleType: "truck",
        ownerNIN: person11.nationalId,
        ownerName: "Alimamy Koroma",
        make: "Isuzu",
        model: "D-Max",
        color: "Blue",
        year: 2017,
        status: "stolen",
        stolenDate: new Date("2025-01-05"),
        stolenReportedBy: officer1.id,
        stationId: hqStation.id,
      },
      {
        licensePlate: "BO-3456",
        vehicleType: "motorcycle",
        ownerName: "Unknown",
        make: "Yamaha",
        color: "Red",
        year: 2019,
        status: "recovered",
        stolenDate: new Date("2024-12-20"),
        recoveredDate: new Date("2025-01-08"),
        notes: "Recovered in Bo City. Owner unknown, investigating.",
        stationId: boStation.id,
      },
      {
        licensePlate: "KE-7890",
        vehicleType: "sedan",
        ownerNIN: person12.nationalId,
        ownerName: "Kadiatu Bangura",
        make: "Honda",
        model: "Accord",
        color: "Silver",
        year: 2021,
        status: "active",
        stationId: kenemaStation.id,
      },
      {
        licensePlate: "MA-2345",
        vehicleType: "van",
        ownerName: "Makeni Transport Services",
        make: "Toyota",
        model: "Hiace",
        color: "White",
        year: 2016,
        status: "active",
        notes: "Commercial passenger van",
        stationId: makeniStation.id,
      },
    ],
  });

  console.log("✅ Created 6 vehicles");

  // ==================== AUDIT LOG ====================
  console.log("📊 Creating audit log entries...");

  await prisma.auditLog.createMany({
    data: [
      {
        entityType: "case",
        entityId: case1.id,
        officerId: officer1.id,
        stationId: hqStation.id,
        action: "create",
        success: true,
        details: { caseNumber: "HQ-2025-000001", title: "Armed Robbery at Kissy Market" },
        ipAddress: "192.168.1.100",
      },
      {
        entityType: "person",
        entityId: person1.id,
        officerId: officer1.id,
        stationId: hqStation.id,
        action: "create",
        success: true,
        details: { name: "Joseph Kamara", nin: person1.nationalId },
        ipAddress: "192.168.1.100",
      },
      {
        entityType: "evidence",
        entityId: case1.id,
        officerId: officer1.id,
        stationId: hqStation.id,
        action: "create",
        success: true,
        details: { caseNumber: "HQ-2025-000001", type: "physical", description: "Kitchen knife" },
        ipAddress: "192.168.1.100",
      },
      {
        entityType: "case",
        entityId: case1.id,
        officerId: officer1.id,
        stationId: hqStation.id,
        action: "update",
        success: true,
        details: { caseNumber: "HQ-2025-000001", field: "status", oldValue: "open", newValue: "investigating" },
        ipAddress: "192.168.1.100",
      },
      {
        entityType: "officer",
        entityId: admin1.id,
        officerId: superAdmin.id,
        stationId: hqStation.id,
        action: "create",
        success: true,
        details: { badge: "AD-00001", name: "Mohamed Kamara", role: "Admin" },
        ipAddress: "192.168.1.1",
      },
      {
        entityType: "case",
        entityId: case2.id,
        officerId: commander1.id,
        stationId: boStation.id,
        action: "create",
        success: true,
        details: { caseNumber: "BO-2025-000001", title: "Missing Child - Aminata Kargbo" },
        ipAddress: "192.168.2.50",
      },
      {
        entityType: "amber_alert",
        entityId: case2.id,
        officerId: commander1.id,
        stationId: boStation.id,
        action: "create",
        success: true,
        details: { personName: "Aminata Kargbo", status: "active" },
        ipAddress: "192.168.2.50",
      },
      {
        entityType: "case",
        entityId: case4.id,
        officerId: officer2.id,
        stationId: kenemaStation.id,
        action: "update",
        success: true,
        details: { caseNumber: "KE-2025-000001", field: "status", oldValue: "charged", newValue: "court" },
        ipAddress: "192.168.3.75",
      },
      {
        entityType: "wanted_person",
        entityId: person15.id,
        officerId: officer1.id,
        stationId: hqStation.id,
        action: "create",
        success: true,
        details: { name: "Abu Kamara", charges: ["Murder", "Armed Robbery"], dangerLevel: "extreme" },
        ipAddress: "192.168.1.100",
      },
      {
        entityType: "background_check",
        entityId: person1.nationalId!,
        officerId: officer1.id,
        stationId: hqStation.id,
        action: "create",
        success: true,
        details: { nin: person1.nationalId, requestType: "officer", result: "clear" },
        ipAddress: "192.168.1.100",
      },
      {
        entityType: "vehicle",
        entityId: "AFT-5678",
        officerId: officer2.id,
        stationId: kenemaStation.id,
        action: "update",
        success: true,
        details: { licensePlate: "AFT-5678", field: "status", oldValue: "active", newValue: "stolen" },
        ipAddress: "192.168.3.75",
      },
      {
        entityType: "case",
        entityId: case6.id,
        officerId: officer3.id,
        stationId: portLokoStation.id,
        action: "update",
        success: true,
        details: { caseNumber: "PL-2025-000001", field: "status", oldValue: "investigating", newValue: "closed" },
        ipAddress: "192.168.4.80",
      },
      {
        entityType: "officer",
        entityId: officer1.id,
        officerId: officer1.id,
        stationId: hqStation.id,
        action: "login",
        success: true,
        details: { badge: "OF-00001", method: "badge_and_pin" },
        ipAddress: "192.168.1.100",
      },
      {
        entityType: "officer",
        entityId: commander1.id,
        officerId: commander1.id,
        stationId: boStation.id,
        action: "login",
        success: true,
        details: { badge: "SC-00001", method: "badge_and_pin" },
        ipAddress: "192.168.2.50",
      },
      {
        entityType: "evidence",
        entityId: case5.id,
        officerId: evidenceClerk1.id,
        stationId: hqStation.id,
        action: "update",
        success: true,
        details: { caseNumber: "HQ-2025-000002", action: "sent_for_analysis", location: "Forensic Lab" },
        ipAddress: "192.168.1.105",
      },
    ],
  });

  console.log("✅ Created 15 audit log entries");

  // ==================== SUMMARY ====================
  console.log("\n🎉 Seeding complete!");
  console.log("\n📝 Default SuperAdmin credentials:");
  console.log("   Badge: SA-00001");
  console.log("   PIN: 12345678");
  console.log("\n⚠️  IMPORTANT: Change PIN immediately after first login!");
  console.log("\n📊 Summary:");
  console.log(`   - ${createdPermissions.length} permissions`);
  console.log(`   - 6 roles (SuperAdmin, Admin, StationCommander, Officer, EvidenceClerk, Viewer)`);
  console.log(`   - 6 stations (HQ + 5 district stations)`);
  console.log(`   - 9 officers (including SA-00001, 3 with USSD support)`);
  console.log(`   - 15 persons (with encrypted PII)`);
  console.log(`   - 7 cases (various scenarios and statuses)`);
  console.log(`   - 27 case-person relationships`);
  console.log(`   - 12 evidence items (with chain of custody)`);
  console.log(`   - 12 case notes`);
  console.log(`   - 4 Amber Alerts (2 active, 1 found, 1 expired)`);
  console.log(`   - 5 wanted persons (4 active, 1 captured)`);
  console.log(`   - 8 background checks (7 completed, 1 pending)`);
  console.log(`   - 6 vehicles (3 stolen/recovered)`);
  console.log(`   - 15 audit log entries`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
