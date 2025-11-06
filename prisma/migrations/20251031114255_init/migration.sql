-- CreateTable
CREATE TABLE "officers" (
    "id" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "pinHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "pinChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaBackupCodes" TEXT[],
    "ussdPhoneNumber" TEXT,
    "ussdQuickPinHash" TEXT,
    "ussdEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ussdRegisteredAt" TIMESTAMP(3),
    "ussdLastUsed" TIMESTAMP(3),
    "ussdDailyLimit" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "officers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "deviceInfo" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "district" TEXT,
    "region" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SLE',
    "phone" TEXT,
    "email" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "nationalId" TEXT,
    "idType" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SLE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "fullName" TEXT,
    "aliases" TEXT[],
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'SLE',
    "addressEncrypted" TEXT,
    "phoneEncrypted" TEXT,
    "emailEncrypted" TEXT,
    "photoUrl" TEXT,
    "fingerprintHash" TEXT,
    "biometricHash" TEXT,
    "isWanted" BOOLEAN NOT NULL DEFAULT false,
    "wantedSince" TIMESTAMP(3),
    "isDeceasedOrMissing" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "stationId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_persons" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "statement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "qrCode" TEXT NOT NULL,
    "storageUrl" TEXT,
    "fileKey" TEXT,
    "fileHash" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "collectedDate" TIMESTAMP(3) NOT NULL,
    "collectedById" TEXT NOT NULL,
    "collectedLocation" TEXT,
    "stationId" TEXT NOT NULL,
    "storageLocation" TEXT,
    "isSealed" BOOLEAN NOT NULL DEFAULT false,
    "sealedAt" TIMESTAMP(3),
    "sealedBy" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'collected',
    "notes" TEXT,
    "chainOfCustody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amber_alerts" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "lastSeenLocation" TEXT,
    "lastSeenDate" TIMESTAMP(3),
    "contactPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amber_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wanted_persons" (
    "id" TEXT NOT NULL,
    "personId" TEXT,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "charges" TEXT[],
    "photoUrl" TEXT,
    "description" TEXT,
    "reward" DECIMAL(10,2),
    "dangerLevel" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "warrantNumber" TEXT,
    "lastSeenLocation" TEXT,
    "lastSeenDate" TIMESTAMP(3),
    "regionalAlert" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "publishedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "capturedLocation" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wanted_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_checks" (
    "id" TEXT NOT NULL,
    "nin" TEXT NOT NULL,
    "requestedById" TEXT,
    "requestType" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "phoneNumber" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "background_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "officerId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "stationId" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ussd_query_logs" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "queryType" TEXT NOT NULL,
    "searchTerm" TEXT NOT NULL,
    "resultSummary" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "sessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ussd_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "ownerNIN" TEXT,
    "ownerName" TEXT,
    "vehicleType" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "color" TEXT,
    "year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stolenDate" TIMESTAMP(3),
    "stolenReportedBy" TEXT,
    "recoveredDate" TIMESTAMP(3),
    "notes" TEXT,
    "stationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "officers_badge_key" ON "officers"("badge");

-- CreateIndex
CREATE UNIQUE INDEX "officers_email_key" ON "officers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "officers_ussdPhoneNumber_key" ON "officers"("ussdPhoneNumber");

-- CreateIndex
CREATE INDEX "officers_badge_idx" ON "officers"("badge");

-- CreateIndex
CREATE INDEX "officers_stationId_idx" ON "officers"("stationId");

-- CreateIndex
CREATE INDEX "officers_roleId_idx" ON "officers"("roleId");

-- CreateIndex
CREATE INDEX "officers_ussdPhoneNumber_idx" ON "officers"("ussdPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_sessionToken_idx" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_officerId_idx" ON "sessions"("officerId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_level_key" ON "roles"("level");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_level_idx" ON "roles"("level");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_scope_key" ON "permissions"("resource", "action", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");

-- CreateIndex
CREATE INDEX "stations_code_idx" ON "stations"("code");

-- CreateIndex
CREATE INDEX "stations_region_idx" ON "stations"("region");

-- CreateIndex
CREATE INDEX "stations_countryCode_idx" ON "stations"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "persons_nationalId_key" ON "persons"("nationalId");

-- CreateIndex
CREATE INDEX "persons_nationalId_idx" ON "persons"("nationalId");

-- CreateIndex
CREATE INDEX "persons_firstName_lastName_idx" ON "persons"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "persons_countryCode_idx" ON "persons"("countryCode");

-- CreateIndex
CREATE INDEX "persons_createdById_idx" ON "persons"("createdById");

-- CreateIndex
CREATE INDEX "persons_isWanted_idx" ON "persons"("isWanted");

-- CreateIndex
CREATE INDEX "persons_riskLevel_idx" ON "persons"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "cases_caseNumber_key" ON "cases"("caseNumber");

-- CreateIndex
CREATE INDEX "cases_caseNumber_idx" ON "cases"("caseNumber");

-- CreateIndex
CREATE INDEX "cases_stationId_idx" ON "cases"("stationId");

-- CreateIndex
CREATE INDEX "cases_officerId_idx" ON "cases"("officerId");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_category_idx" ON "cases"("category");

-- CreateIndex
CREATE INDEX "cases_incidentDate_idx" ON "cases"("incidentDate");

-- CreateIndex
CREATE INDEX "case_persons_caseId_idx" ON "case_persons"("caseId");

-- CreateIndex
CREATE INDEX "case_persons_personId_idx" ON "case_persons"("personId");

-- CreateIndex
CREATE INDEX "case_persons_role_idx" ON "case_persons"("role");

-- CreateIndex
CREATE UNIQUE INDEX "case_persons_caseId_personId_role_key" ON "case_persons"("caseId", "personId", "role");

-- CreateIndex
CREATE INDEX "case_notes_caseId_idx" ON "case_notes"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_qrCode_key" ON "evidence"("qrCode");

-- CreateIndex
CREATE INDEX "evidence_caseId_idx" ON "evidence"("caseId");

-- CreateIndex
CREATE INDEX "evidence_qrCode_idx" ON "evidence"("qrCode");

-- CreateIndex
CREATE INDEX "evidence_collectedById_idx" ON "evidence"("collectedById");

-- CreateIndex
CREATE INDEX "evidence_stationId_idx" ON "evidence"("stationId");

-- CreateIndex
CREATE INDEX "evidence_status_idx" ON "evidence"("status");

-- CreateIndex
CREATE INDEX "amber_alerts_status_idx" ON "amber_alerts"("status");

-- CreateIndex
CREATE INDEX "amber_alerts_createdById_idx" ON "amber_alerts"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "wanted_persons_personId_key" ON "wanted_persons"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "wanted_persons_warrantNumber_key" ON "wanted_persons"("warrantNumber");

-- CreateIndex
CREATE INDEX "wanted_persons_status_idx" ON "wanted_persons"("status");

-- CreateIndex
CREATE INDEX "wanted_persons_personId_idx" ON "wanted_persons"("personId");

-- CreateIndex
CREATE INDEX "wanted_persons_createdById_idx" ON "wanted_persons"("createdById");

-- CreateIndex
CREATE INDEX "background_checks_nin_idx" ON "background_checks"("nin");

-- CreateIndex
CREATE INDEX "background_checks_requestedById_idx" ON "background_checks"("requestedById");

-- CreateIndex
CREATE INDEX "background_checks_phoneNumber_idx" ON "background_checks"("phoneNumber");

-- CreateIndex
CREATE INDEX "background_checks_createdAt_idx" ON "background_checks"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_officerId_idx" ON "audit_logs"("officerId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "sync_queue_status_idx" ON "sync_queue"("status");

-- CreateIndex
CREATE INDEX "sync_queue_createdAt_idx" ON "sync_queue"("createdAt");

-- CreateIndex
CREATE INDEX "ussd_query_logs_officerId_idx" ON "ussd_query_logs"("officerId");

-- CreateIndex
CREATE INDEX "ussd_query_logs_timestamp_idx" ON "ussd_query_logs"("timestamp");

-- CreateIndex
CREATE INDEX "ussd_query_logs_queryType_idx" ON "ussd_query_logs"("queryType");

-- CreateIndex
CREATE INDEX "ussd_query_logs_phoneNumber_idx" ON "ussd_query_logs"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_licensePlate_idx" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_ownerNIN_idx" ON "vehicles"("ownerNIN");

-- CreateIndex
CREATE INDEX "vehicles_stationId_idx" ON "vehicles"("stationId");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- AddForeignKey
ALTER TABLE "officers" ADD CONSTRAINT "officers_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officers" ADD CONSTRAINT "officers_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_persons" ADD CONSTRAINT "case_persons_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_persons" ADD CONSTRAINT "case_persons_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amber_alerts" ADD CONSTRAINT "amber_alerts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wanted_persons" ADD CONSTRAINT "wanted_persons_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wanted_persons" ADD CONSTRAINT "wanted_persons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_checks" ADD CONSTRAINT "background_checks_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ussd_query_logs" ADD CONSTRAINT "ussd_query_logs_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
