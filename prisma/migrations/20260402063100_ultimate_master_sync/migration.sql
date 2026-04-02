-- AlterTable
ALTER TABLE "OnlineLead" ADD COLUMN     "campaignTrackingId" TEXT;

-- CreateTable
CREATE TABLE "CampaignTracking" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "medium" TEXT,
    "formName" TEXT,
    "landingUrl" TEXT,
    "budgetAmount" DECIMAL(12,2),
    "spendAmount" DECIMAL(12,2),
    "startsOn" DATE,
    "endsOn" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDocument" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "identifier" TEXT,
    "expiresOn" DATE,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelStockEntry" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT,
    "quantityLiters" DECIMAL(10,2) NOT NULL,
    "direction" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "FuelStockEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentMapping" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "contentAssetId" TEXT NOT NULL,
    "subjectId" TEXT,
    "className" TEXT,
    "chapterName" TEXT,
    "topicName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentUsage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "contentAssetId" TEXT NOT NULL,
    "subjectId" TEXT,
    "usedByName" TEXT,
    "usedForClass" TEXT,
    "usedForSection" TEXT,
    "usageType" TEXT NOT NULL DEFAULT 'CLASSROOM',
    "durationMinutes" INTEGER,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentContentActivity" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contentAssetId" TEXT NOT NULL,
    "subjectId" TEXT,
    "activityType" TEXT NOT NULL,
    "progressPercent" DECIMAL(5,2),
    "scorePercent" DECIMAL(5,2),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentContentActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "grossAmount" DECIMAL(12,2),
    "deductionsAmount" DECIMAL(12,2),
    "netAmount" DECIMAL(12,2),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignTracking_sessionId_idx" ON "CampaignTracking"("sessionId");

-- CreateIndex
CREATE INDEX "CampaignTracking_source_idx" ON "CampaignTracking"("source");

-- CreateIndex
CREATE INDEX "CampaignTracking_campaignName_idx" ON "CampaignTracking"("campaignName");

-- CreateIndex
CREATE INDEX "DriverDocument_vehicleId_idx" ON "DriverDocument"("vehicleId");

-- CreateIndex
CREATE INDEX "DriverDocument_expiresOn_idx" ON "DriverDocument"("expiresOn");

-- CreateIndex
CREATE INDEX "FuelStockEntry_vehicleId_idx" ON "FuelStockEntry"("vehicleId");

-- CreateIndex
CREATE INDEX "FuelStockEntry_recordedAt_idx" ON "FuelStockEntry"("recordedAt");

-- CreateIndex
CREATE INDEX "ContentMapping_sessionId_idx" ON "ContentMapping"("sessionId");

-- CreateIndex
CREATE INDEX "ContentMapping_contentAssetId_idx" ON "ContentMapping"("contentAssetId");

-- CreateIndex
CREATE INDEX "ContentMapping_subjectId_idx" ON "ContentMapping"("subjectId");

-- CreateIndex
CREATE INDEX "ContentUsage_sessionId_idx" ON "ContentUsage"("sessionId");

-- CreateIndex
CREATE INDEX "ContentUsage_contentAssetId_idx" ON "ContentUsage"("contentAssetId");

-- CreateIndex
CREATE INDEX "ContentUsage_subjectId_idx" ON "ContentUsage"("subjectId");

-- CreateIndex
CREATE INDEX "ContentUsage_usedAt_idx" ON "ContentUsage"("usedAt");

-- CreateIndex
CREATE INDEX "StudentContentActivity_sessionId_idx" ON "StudentContentActivity"("sessionId");

-- CreateIndex
CREATE INDEX "StudentContentActivity_studentId_idx" ON "StudentContentActivity"("studentId");

-- CreateIndex
CREATE INDEX "StudentContentActivity_contentAssetId_idx" ON "StudentContentActivity"("contentAssetId");

-- CreateIndex
CREATE INDEX "StudentContentActivity_subjectId_idx" ON "StudentContentActivity"("subjectId");

-- CreateIndex
CREATE INDEX "StudentContentActivity_occurredAt_idx" ON "StudentContentActivity"("occurredAt");

-- CreateIndex
CREATE INDEX "PayrollRun_sessionId_idx" ON "PayrollRun"("sessionId");

-- CreateIndex
CREATE INDEX "PayrollRun_monthLabel_idx" ON "PayrollRun"("monthLabel");

-- CreateIndex
CREATE INDEX "PayrollRun_status_idx" ON "PayrollRun"("status");

-- CreateIndex
CREATE INDEX "OnlineLead_campaignTrackingId_idx" ON "OnlineLead"("campaignTrackingId");

-- AddForeignKey
ALTER TABLE "OnlineLead" ADD CONSTRAINT "OnlineLead_campaignTrackingId_fkey" FOREIGN KEY ("campaignTrackingId") REFERENCES "CampaignTracking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTracking" ADD CONSTRAINT "CampaignTracking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelStockEntry" ADD CONSTRAINT "FuelStockEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentMapping" ADD CONSTRAINT "ContentMapping_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentMapping" ADD CONSTRAINT "ContentMapping_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentMapping" ADD CONSTRAINT "ContentMapping_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentUsage" ADD CONSTRAINT "ContentUsage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentUsage" ADD CONSTRAINT "ContentUsage_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentUsage" ADD CONSTRAINT "ContentUsage_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentContentActivity" ADD CONSTRAINT "StudentContentActivity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentContentActivity" ADD CONSTRAINT "StudentContentActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentContentActivity" ADD CONSTRAINT "StudentContentActivity_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentContentActivity" ADD CONSTRAINT "StudentContentActivity_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
