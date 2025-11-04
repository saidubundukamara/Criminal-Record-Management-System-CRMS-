/*
  Warnings:

  - A unique constraint covering the columns `[ussdPhoneNumber]` on the table `officers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `collectedLocation` to the `evidence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stationId` to the `evidence` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "evidence" ADD COLUMN     "collectedLocation" TEXT NOT NULL,
ADD COLUMN     "isSealed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sealedAt" TIMESTAMP(3),
ADD COLUMN     "sealedById" TEXT,
ADD COLUMN     "stationId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'collected',
ADD COLUMN     "storageLocation" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "officers" ADD COLUMN     "ussdDailyLimit" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "ussdEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ussdLastUsed" TIMESTAMP(3),
ADD COLUMN     "ussdPhoneNumber" TEXT,
ADD COLUMN     "ussdQuickPinHash" TEXT,
ADD COLUMN     "ussdRegisteredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "criminalHistory" TEXT,
ADD COLUMN     "educationLevel" TEXT,
ADD COLUMN     "languagesSpoken" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "physicalDescription" TEXT,
ADD COLUMN     "placeOfBirth" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "stationId" TEXT,
ADD COLUMN     "tribe" TEXT,
ADD COLUMN     "updatedById" TEXT,
ALTER COLUMN "aliases" SET DEFAULT ARRAY[]::TEXT[];

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
CREATE TABLE "ussd_query_logs" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "queryType" TEXT NOT NULL,
    "searchTerm" TEXT NOT NULL,
    "resultSummary" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,

    CONSTRAINT "ussd_query_logs_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "ussd_query_logs_officerId_timestamp_idx" ON "ussd_query_logs"("officerId", "timestamp");

-- CreateIndex
CREATE INDEX "ussd_query_logs_phoneNumber_timestamp_idx" ON "ussd_query_logs"("phoneNumber", "timestamp");

-- CreateIndex
CREATE INDEX "ussd_query_logs_queryType_idx" ON "ussd_query_logs"("queryType");

-- CreateIndex
CREATE INDEX "ussd_query_logs_timestamp_idx" ON "ussd_query_logs"("timestamp");

-- CreateIndex
CREATE INDEX "evidence_stationId_idx" ON "evidence"("stationId");

-- CreateIndex
CREATE INDEX "evidence_status_idx" ON "evidence"("status");

-- CreateIndex
CREATE UNIQUE INDEX "officers_ussdPhoneNumber_key" ON "officers"("ussdPhoneNumber");

-- CreateIndex
CREATE INDEX "officers_ussdPhoneNumber_idx" ON "officers"("ussdPhoneNumber");

-- CreateIndex
CREATE INDEX "persons_updatedById_idx" ON "persons"("updatedById");

-- CreateIndex
CREATE INDEX "persons_stationId_idx" ON "persons"("stationId");

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_sealedById_fkey" FOREIGN KEY ("sealedById") REFERENCES "officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ussd_query_logs" ADD CONSTRAINT "ussd_query_logs_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
