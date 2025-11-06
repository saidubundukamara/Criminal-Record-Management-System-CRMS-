import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

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

  // ==================== USSD-REGISTERED OFFICERS (for testing) ====================
  console.log("📱 Creating USSD-registered test officers...");

  // Officer 1: Station Commander with USSD enabled (higher daily limit)
  const commanderQuickPin = await hash("1234"); // Quick PIN: 1234
  const commander = await prisma.officer.upsert({
    where: { badge: "SC-00001" },
    update: {},
    create: {
      badge: "SC-00001",
      name: "Ibrahim Kamara",
      email: "ikamara@police.gov.sl",
      phone: "+23278123456",
      pinHash: await hash("87654321"),
      roleId: commanderRole.id,
      stationId: hqStation.id,
      active: true,
      // USSD fields
      ussdPhoneNumber: "+23278123456",
      ussdQuickPinHash: commanderQuickPin,
      ussdEnabled: true,
      ussdRegisteredAt: new Date(),
      ussdDailyLimit: 100, // Higher limit for commanders
    },
  });

  // Officer 2: Regular Officer with USSD enabled
  const officer1QuickPin = await hash("5678"); // Quick PIN: 5678
  const officer1 = await prisma.officer.upsert({
    where: { badge: "OF-00001" },
    update: {},
    create: {
      badge: "OF-00001",
      name: "Fatmata Sesay",
      email: "fsesay@police.gov.sl",
      phone: "+23279234567",
      pinHash: await hash("11111111"),
      roleId: officerRole.id,
      stationId: hqStation.id,
      active: true,
      // USSD fields
      ussdPhoneNumber: "+23279234567",
      ussdQuickPinHash: officer1QuickPin,
      ussdEnabled: true,
      ussdRegisteredAt: new Date(),
      ussdDailyLimit: 50,
    },
  });

  // Officer 3: Officer with USSD disabled (for whitelist testing)
  const officer2QuickPin = await hash("9012"); // Quick PIN: 9012
  const officer2 = await prisma.officer.upsert({
    where: { badge: "OF-00002" },
    update: {},
    create: {
      badge: "OF-00002",
      name: "Mohamed Bangura",
      email: "mbangura@police.gov.sl",
      phone: "+23276345678",
      pinHash: await hash("22222222"),
      roleId: officerRole.id,
      stationId: hqStation.id,
      active: true,
      // USSD fields
      ussdPhoneNumber: "+23276345678",
      ussdQuickPinHash: officer2QuickPin,
      ussdEnabled: false, // Disabled for testing whitelist
      ussdRegisteredAt: new Date(),
      ussdDailyLimit: 50,
    },
  });

  // Officer 4: Officer without USSD configured (for registration testing)
  const officer3 = await prisma.officer.upsert({
    where: { badge: "OF-00003" },
    update: {},
    create: {
      badge: "OF-00003",
      name: "Aminata Koroma",
      email: "akoroma@police.gov.sl",
      phone: "+23277456789",
      pinHash: await hash("33333333"),
      roleId: officerRole.id,
      stationId: hqStation.id,
      active: true,
      // No USSD fields set - for registration testing
    },
  });

  // Officer 5: Evidence Clerk with USSD enabled (lower daily limit)
  const clerkQuickPin = await hash("3456"); // Quick PIN: 3456
  const clerk = await prisma.officer.upsert({
    where: { badge: "EC-00001" },
    update: {},
    create: {
      badge: "EC-00001",
      name: "John Conteh",
      email: "jconteh@police.gov.sl",
      phone: "+23278567890",
      pinHash: await hash("44444444"),
      roleId: clerkRole.id,
      stationId: hqStation.id,
      active: true,
      // USSD fields
      ussdPhoneNumber: "+23278567890",
      ussdQuickPinHash: clerkQuickPin,
      ussdEnabled: true,
      ussdRegisteredAt: new Date(),
      ussdDailyLimit: 30, // Lower limit for clerks
    },
  });

  console.log("✅ Created 5 USSD test officers");

  // ==================== TEST PERSONS (for USSD queries) ====================
  console.log("👤 Creating test persons for USSD queries...");

  // Person 1: Wanted person (high risk)
  const wantedPerson = await prisma.person.upsert({
    where: { nationalId: "SLE-1990-0123456" },
    update: {},
    create: {
      nationalId: "SLE-1990-0123456",
      idType: "NIN",
      countryCode: "SLE",
      firstName: "Abdul",
      lastName: "Kamara",
      middleName: "Hassan",
      fullName: "Abdul Hassan Kamara",
      aliases: ["Abdul K", "AHK"],
      dob: new Date("1990-05-15"),
      gender: "Male",
      nationality: "SLE",
      isWanted: true,
      wantedSince: new Date("2024-01-15"),
      riskLevel: "high",
      createdById: superAdmin.id,
    },
  });

  // Person 2: Missing person
  const missingPerson = await prisma.person.upsert({
    where: { nationalId: "SLE-1995-0234567" },
    update: {},
    create: {
      nationalId: "SLE-1995-0234567",
      idType: "NIN",
      countryCode: "SLE",
      firstName: "Mary",
      lastName: "Koroma",
      middleName: null,
      fullName: "Mary Koroma",
      aliases: [],
      dob: new Date("1995-08-22"),
      gender: "Female",
      nationality: "SLE",
      isDeceasedOrMissing: true,
      riskLevel: "medium",
      createdById: superAdmin.id,
    },
  });

  // Person 3: Person with clean record
  const cleanPerson = await prisma.person.upsert({
    where: { nationalId: "SLE-1988-0345678" },
    update: {},
    create: {
      nationalId: "SLE-1988-0345678",
      idType: "NIN",
      countryCode: "SLE",
      firstName: "James",
      lastName: "Sesay",
      middleName: null,
      fullName: "James Sesay",
      aliases: [],
      dob: new Date("1988-11-10"),
      gender: "Male",
      nationality: "SLE",
      createdById: superAdmin.id,
    },
  });

  // Person 4: Person with criminal record (will be linked to case)
  const criminalPerson = await prisma.person.upsert({
    where: { nationalId: "SLE-1992-0456789" },
    update: {},
    create: {
      nationalId: "SLE-1992-0456789",
      idType: "NIN",
      countryCode: "SLE",
      firstName: "Hassan",
      lastName: "Bangura",
      middleName: "Musa",
      fullName: "Hassan Musa Bangura",
      aliases: ["Hassan B"],
      dob: new Date("1992-03-18"),
      gender: "Male",
      nationality: "SLE",
      riskLevel: "medium",
      createdById: superAdmin.id,
    },
  });

  console.log("✅ Created 4 test persons");

  // ==================== TEST VEHICLES (for USSD vehicle lookups) ====================
  console.log("🚗 Creating test vehicles for USSD lookups...");

  // Vehicle 1: Stolen Toyota Corolla
  const stolenToyota = await prisma.vehicle.upsert({
    where: { licensePlate: "SL-A-1234" },
    update: {},
    create: {
      licensePlate: "SL-A-1234",
      vehicleType: "car",
      make: "Toyota",
      model: "Corolla",
      year: 2018,
      color: "Silver",
      ownerNIN: "111222333444",
      ownerName: "John Doe",
      status: "stolen",
      stolenDate: new Date("2024-11-01"),
      stolenReportedBy: superAdmin.id,
      stationId: hqStation.id,
      notes: "Stolen from Freetown Central Parking - armed robbery",
    },
  });

  // Vehicle 2: Normal registered Honda Civic
  const normalHonda = await prisma.vehicle.upsert({
    where: { licensePlate: "SL-B-5678" },
    update: {},
    create: {
      licensePlate: "SL-B-5678",
      vehicleType: "car",
      make: "Honda",
      model: "Civic",
      year: 2020,
      color: "Blue",
      ownerNIN: "555666777888",
      ownerName: "Jane Smith",
      status: "active",
      stationId: hqStation.id,
      notes: "Registered vehicle - no issues",
    },
  });

  // Vehicle 3: Stolen Nissan Sentra
  const stolenNissan = await prisma.vehicle.upsert({
    where: { licensePlate: "SL-C-9012" },
    update: {},
    create: {
      licensePlate: "SL-C-9012",
      vehicleType: "car",
      make: "Nissan",
      model: "Sentra",
      year: 2019,
      color: "Black",
      ownerNIN: "999888777666",
      ownerName: "Bob Wilson",
      status: "stolen",
      stolenDate: new Date("2024-10-15"),
      stolenReportedBy: superAdmin.id,
      stationId: hqStation.id,
      notes: "Used in armed robbery - getaway vehicle",
    },
  });

  console.log("✅ Created 3 test vehicles");

  // ==================== TEST CASES (for background checks) ====================
  console.log("📁 Creating test cases for USSD background checks...");

  // Case 1: Motor Vehicle Theft (linked to stolen Toyota)
  const theftCase = await prisma.case.upsert({
    where: { caseNumber: "HQ-2024-000001" },
    update: {},
    create: {
      caseNumber: "HQ-2024-000001",
      title: "Motor Vehicle Theft - Toyota Corolla",
      description: "Silver Toyota Corolla stolen from Freetown Central Parking lot. Suspect seen fleeing on foot.",
      category: "theft",
      severity: "major",
      status: "investigating",
      incidentDate: new Date("2024-11-01"),
      reportedDate: new Date("2024-11-01"),
      location: "Freetown Central Parking, Aberdeen Road",
      stationId: hqStation.id,
      officerId: officer1.id, // Assigned to USSD-enabled officer
    },
  });

  // Case 2: Aggravated Assault (linked to criminal person)
  const assaultCase = await prisma.case.upsert({
    where: { caseNumber: "HQ-2024-000002" },
    update: {},
    create: {
      caseNumber: "HQ-2024-000002",
      title: "Aggravated Assault at King Jimmy Market",
      description: "Physical assault with weapon at local market. Victim hospitalized with serious injuries.",
      category: "assault",
      severity: "major",
      status: "charged",
      incidentDate: new Date("2024-10-20"),
      reportedDate: new Date("2024-10-20"),
      location: "King Jimmy Market, Freetown",
      stationId: hqStation.id,
      officerId: commander.id, // Assigned to commander
    },
  });

  // Link criminal person to assault case as suspect
  await prisma.casePerson.upsert({
    where: {
      caseId_personId_role: {
        caseId: assaultCase.id,
        personId: criminalPerson.id,
        role: "suspect",
      },
    },
    update: {},
    create: {
      caseId: assaultCase.id,
      personId: criminalPerson.id,
      role: "suspect",
      statement: "Suspect identified by multiple witnesses at the scene",
    },
  });

  // Link wanted person to theft case as suspect
  await prisma.casePerson.upsert({
    where: {
      caseId_personId_role: {
        caseId: theftCase.id,
        personId: wantedPerson.id,
        role: "suspect",
      },
    },
    update: {},
    create: {
      caseId: theftCase.id,
      personId: wantedPerson.id,
      role: "suspect",
      statement: "Security footage shows suspect matching description",
    },
  });

  console.log("✅ Created 2 test cases with person links");

  // ==================== WANTED PERSON RECORD (for USSD wanted checks) ====================
  console.log("🚨 Creating wanted person record with warrant...");

  // Wanted Person Record for Abdul Kamara
  const wantedPersonRecord = await prisma.wantedPerson.upsert({
    where: { personId: wantedPerson.id },
    update: {},
    create: {
      personId: wantedPerson.id,
      name: "Abdul Hassan Kamara",
      aliases: ["Abdul K", "AHK"],
      charges: ["Armed Robbery", "Assault with Deadly Weapon", "Motor Vehicle Theft"],
      dangerLevel: "extreme",
      status: "active",
      warrantNumber: "W-2024-001",
      reward: 5000000, // 5 million Leones
      description: "Male, approximately 6'0\" tall, dark complexion, visible scar on left cheek. Last seen wearing dark clothing. Considered armed and dangerous.",
      lastSeenLocation: "Bo District, Southern Province",
      lastSeenDate: new Date("2024-10-25"),
      regionalAlert: true,
      priority: 95,
      publishedAt: new Date("2024-01-15"),
      createdById: superAdmin.id,
    },
  });

  console.log("✅ Created wanted person record");

  // ==================== SUMMARY ====================
  console.log("\n🎉 Seeding complete!");
  console.log("\n📝 Login Credentials:");
  console.log("   SuperAdmin:");
  console.log("     Badge: SA-00001");
  console.log("     PIN: 12345678");
  console.log("\n📱 USSD Test Credentials:");
  console.log("   Commander (SC-00001):");
  console.log("     Phone: +23278123456");
  console.log("     Quick PIN: 1234");
  console.log("     Status: ✅ Enabled (100 queries/day)");
  console.log("\n   Officer 1 (OF-00001):");
  console.log("     Phone: +23279234567");
  console.log("     Quick PIN: 5678");
  console.log("     Status: ✅ Enabled (50 queries/day)");
  console.log("\n   Officer 2 (OF-00002):");
  console.log("     Phone: +23276345678");
  console.log("     Quick PIN: 9012");
  console.log("     Status: ❌ Disabled (for whitelist testing)");
  console.log("\n   Officer 3 (OF-00003):");
  console.log("     Phone: +23277456789");
  console.log("     Status: ⚠️ Not registered (for registration testing)");
  console.log("\n   Evidence Clerk (EC-00001):");
  console.log("     Phone: +23278567890");
  console.log("     Quick PIN: 3456");
  console.log("     Status: ✅ Enabled (30 queries/day)");
  console.log("\n🧪 Test Data for USSD Queries:");
  console.log("   Persons:");
  console.log("     - SLE-1990-0123456: ⚠️ WANTED (Abdul Hassan Kamara - high risk)");
  console.log("     - SLE-1995-0234567: ⚠️ MISSING (Mary Koroma)");
  console.log("     - SLE-1988-0345678: ✅ CLEAN (James Sesay)");
  console.log("     - SLE-1992-0456789: ⚠️ RECORD (Hassan Musa Bangura - 1 case)");
  console.log("\n   Vehicles:");
  console.log("     - SL-A-1234: 🚨 STOLEN (Toyota Corolla 2018)");
  console.log("     - SL-B-5678: ✅ NORMAL (Honda Civic 2020)");
  console.log("     - SL-C-9012: 🚨 STOLEN (Nissan Sentra 2019)");
  console.log("\n⚠️  IMPORTANT: Change SuperAdmin PIN immediately after first login!");
  console.log("\n📊 Database Summary:");
  console.log(`   - ${createdPermissions.length} permissions`);
  console.log(`   - 6 roles (SuperAdmin, Admin, StationCommander, Officer, EvidenceClerk, Viewer)`);
  console.log(`   - 1 station (HQ-001)`);
  console.log(`   - 6 officers (1 SuperAdmin + 5 USSD test officers)`);
  console.log(`   - 4 persons (1 wanted, 1 missing, 1 clean, 1 with record)`);
  console.log(`   - 3 vehicles (2 stolen, 1 normal)`);
  console.log(`   - 2 cases (theft, assault)`);
  console.log(`   - 1 wanted person record (with warrant)`);
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
