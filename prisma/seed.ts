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

  // ==================== SUMMARY ====================
  console.log("\n🎉 Seeding complete!");
  console.log("\n📝 Default SuperAdmin credentials:");
  console.log("   Badge: SA-00001");
  console.log("   PIN: 12345678");
  console.log("\n⚠️  IMPORTANT: Change PIN immediately after first login!");
  console.log("\n📊 Summary:");
  console.log(`   - ${createdPermissions.length} permissions`);
  console.log(`   - 6 roles (SuperAdmin, Admin, StationCommander, Officer, EvidenceClerk, Viewer)`);
  console.log(`   - 1 station (HQ-001)`);
  console.log(`   - 1 officer (SA-00001)`);
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
