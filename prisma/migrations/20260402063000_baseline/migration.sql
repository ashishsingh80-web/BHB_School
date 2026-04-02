-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AdmissionStatus" AS ENUM ('ENQUIRY', 'REGISTERED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'WAITLIST', 'ADMITTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "public"."FeeTxnType" AS ENUM ('INVOICE', 'PAYMENT', 'CONCESSION', 'LATE_FEE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."FollowUpChannel" AS ENUM ('CALL', 'WHATSAPP', 'VISIT', 'EMAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LeadTemperature" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'MANAGEMENT', 'PRINCIPAL', 'OFFICE_ADMIN', 'ADMISSION_DESK', 'ACCOUNTS', 'TEACHER', 'CLASS_TEACHER', 'RECEPTION', 'TRANSPORT_MANAGER', 'HR_ADMIN', 'PARENT', 'STUDENT');

-- CreateTable
CREATE TABLE "public"."AcademicSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admission" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "studentId" TEXT,
    "status" "public"."AdmissionStatus" NOT NULL DEFAULT 'ENQUIRY',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "draftDob" DATE,
    "draftFirstName" TEXT,
    "draftGender" "public"."Gender",
    "draftLastName" TEXT,
    "proposedAdmissionNo" TEXT,
    "proposedSectionId" TEXT,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdmissionDocument" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "documentTypeId" TEXT,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdmissionFeePayment" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isFull" BOOLEAN NOT NULL DEFAULT true,
    "receiptNo" TEXT,
    "description" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmissionFeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdvanceRecovery" (
    "id" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "recoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payrollRef" TEXT,

    CONSTRAINT "AdvanceRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusStop" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Class" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClassDiaryEntry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassDiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintTicket" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "raisedByName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "subjectHint" TEXT,
    "gradeHint" TEXT,
    "externalUrl" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentTypeMaster" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiredForAdmission" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentTypeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enquiry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "parentName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT,
    "classSeeking" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "nextFollowUp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedToId" TEXT,
    "leadTemperature" "public"."LeadTemperature",

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EnquiryFollowUp" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "channel" "public"."FollowUpChannel" NOT NULL DEFAULT 'CALL',
    "summary" TEXT NOT NULL,
    "nextFollowUp" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Exam" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "termLabel" TEXT,
    "examDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "vendor" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeHead" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FeeHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeStructure" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeTransaction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "public"."FeeTxnType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "receiptNo" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feeHeadId" TEXT,

    CONSTRAINT "FeeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FuelIssue" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "quantityLiters" DECIMAL(10,2) NOT NULL,
    "odometerKm" DECIMAL(12,2),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "FuelIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FuelPurchase" (
    "id" TEXT NOT NULL,
    "quantityLiters" DECIMAL(10,2) NOT NULL,
    "ratePerLiter" DECIMAL(10,2),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "vendor" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "FuelPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeBand" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minPercent" DECIMAL(5,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GradeBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HomeworkEntry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'HOMEWORK',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedOn" DATE NOT NULL,
    "dueDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryItem" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "qtyOnHand" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reorderLevel" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryTxn" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" DECIMAL(12,2) NOT NULL,
    "direction" TEXT NOT NULL,
    "ref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTxn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Mark" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "marksObtained" DECIMAL(8,2) NOT NULL,
    "maxMarks" DECIMAL(8,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnlineLead" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "campaign" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "rawPayload" JSONB,
    "childName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "enquiryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnlineLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Parent" (
    "id" TEXT NOT NULL,
    "fatherName" TEXT,
    "motherName" TEXT,
    "guardianName" TEXT,
    "phonePrimary" TEXT NOT NULL,
    "phoneAlt" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RouteStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "busStopId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "pickupTime" TEXT,
    "dropTime" TEXT,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SchoolNotice" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SchoolProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'BHB International School',
    "board" TEXT NOT NULL DEFAULT 'CBSE',
    "tagline" TEXT,
    "established" INTEGER,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Section" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "employeeCode" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "designation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffAdvance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "purpose" TEXT,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balance" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "StaffAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sectionId" TEXT,
    "admissionNo" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "dob" TIMESTAMP(3),
    "gender" "public"."Gender",
    "category" TEXT,
    "religion" TEXT,
    "bloodGroup" TEXT,
    "aadhaarLast4" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentAttendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentParent" (
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT 'Father',

    CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("studentId","parentId")
);

-- CreateTable
CREATE TABLE "public"."StudentTransportAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "boardingStopId" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTransportAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subject" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Survey" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "staffUserId" TEXT,
    "areaTag" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SurveyEntry" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "parentName" TEXT,
    "classSeeking" TEXT,
    "interestLevel" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "enquiryId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TransportRoute" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "defaultVehicleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'OFFICE_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vehicle" (
    "id" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "model" TEXT,
    "fuelType" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleDocument" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "expiresOn" DATE,
    "fileUrl" TEXT,
    "issuedOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admission_enquiryId_key" ON "public"."Admission"("enquiryId" ASC);

-- CreateIndex
CREATE INDEX "Admission_sessionId_idx" ON "public"."Admission"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "Admission_status_idx" ON "public"."Admission"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Admission_studentId_key" ON "public"."Admission"("studentId" ASC);

-- CreateIndex
CREATE INDEX "AdmissionDocument_admissionId_idx" ON "public"."AdmissionDocument"("admissionId" ASC);

-- CreateIndex
CREATE INDEX "AdmissionFeePayment_admissionId_idx" ON "public"."AdmissionFeePayment"("admissionId" ASC);

-- CreateIndex
CREATE INDEX "AdvanceRecovery_advanceId_idx" ON "public"."AdvanceRecovery"("advanceId" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "public"."AuditLog"("entity" ASC, "entityId" ASC);

-- CreateIndex
CREATE INDEX "BusStop_sessionId_idx" ON "public"."BusStop"("sessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BusStop_sessionId_name_key" ON "public"."BusStop"("sessionId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "Class_sessionId_idx" ON "public"."Class"("sessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Class_sessionId_name_key" ON "public"."Class"("sessionId" ASC, "name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ClassDiaryEntry_sectionId_entryDate_key" ON "public"."ClassDiaryEntry"("sectionId" ASC, "entryDate" ASC);

-- CreateIndex
CREATE INDEX "ClassDiaryEntry_sessionId_idx" ON "public"."ClassDiaryEntry"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "ComplaintTicket_createdAt_idx" ON "public"."ComplaintTicket"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ComplaintTicket_sessionId_idx" ON "public"."ComplaintTicket"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "ComplaintTicket_status_idx" ON "public"."ComplaintTicket"("status" ASC);

-- CreateIndex
CREATE INDEX "ContentAsset_provider_idx" ON "public"."ContentAsset"("provider" ASC);

-- CreateIndex
CREATE INDEX "DocumentTypeMaster_sessionId_idx" ON "public"."DocumentTypeMaster"("sessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeMaster_sessionId_name_key" ON "public"."DocumentTypeMaster"("sessionId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "Enquiry_assignedToId_idx" ON "public"."Enquiry"("assignedToId" ASC);

-- CreateIndex
CREATE INDEX "Enquiry_phone_idx" ON "public"."Enquiry"("phone" ASC);

-- CreateIndex
CREATE INDEX "Enquiry_sessionId_idx" ON "public"."Enquiry"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "EnquiryFollowUp_createdAt_idx" ON "public"."EnquiryFollowUp"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "EnquiryFollowUp_enquiryId_idx" ON "public"."EnquiryFollowUp"("enquiryId" ASC);

-- CreateIndex
CREATE INDEX "Exam_sessionId_idx" ON "public"."Exam"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "Expense_paidAt_idx" ON "public"."Expense"("paidAt" ASC);

-- CreateIndex
CREATE INDEX "Expense_sessionId_idx" ON "public"."Expense"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "FeeHead_sessionId_idx" ON "public"."FeeHead"("sessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FeeHead_sessionId_name_key" ON "public"."FeeHead"("sessionId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "FeeStructure_classId_idx" ON "public"."FeeStructure"("classId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructure_sessionId_classId_headId_key" ON "public"."FeeStructure"("sessionId" ASC, "classId" ASC, "headId" ASC);

-- CreateIndex
CREATE INDEX "FeeStructure_sessionId_idx" ON "public"."FeeStructure"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "FeeTransaction_feeHeadId_idx" ON "public"."FeeTransaction"("feeHeadId" ASC);

-- CreateIndex
CREATE INDEX "FeeTransaction_paidAt_idx" ON "public"."FeeTransaction"("paidAt" ASC);

-- CreateIndex
CREATE INDEX "FeeTransaction_studentId_idx" ON "public"."FeeTransaction"("studentId" ASC);

-- CreateIndex
CREATE INDEX "FuelIssue_vehicleId_idx" ON "public"."FuelIssue"("vehicleId" ASC);

-- CreateIndex
CREATE INDEX "FuelPurchase_purchasedAt_idx" ON "public"."FuelPurchase"("purchasedAt" ASC);

-- CreateIndex
CREATE INDEX "GradeBand_sessionId_idx" ON "public"."GradeBand"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "HomeworkEntry_assignedOn_idx" ON "public"."HomeworkEntry"("assignedOn" ASC);

-- CreateIndex
CREATE INDEX "HomeworkEntry_sessionId_sectionId_idx" ON "public"."HomeworkEntry"("sessionId" ASC, "sectionId" ASC);

-- CreateIndex
CREATE INDEX "InventoryItem_name_idx" ON "public"."InventoryItem"("name" ASC);

-- CreateIndex
CREATE INDEX "InventoryTxn_createdAt_idx" ON "public"."InventoryTxn"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "InventoryTxn_itemId_idx" ON "public"."InventoryTxn"("itemId" ASC);

-- CreateIndex
CREATE INDEX "Mark_examId_idx" ON "public"."Mark"("examId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Mark_examId_studentId_subjectId_key" ON "public"."Mark"("examId" ASC, "studentId" ASC, "subjectId" ASC);

-- CreateIndex
CREATE INDEX "Mark_studentId_idx" ON "public"."Mark"("studentId" ASC);

-- CreateIndex
CREATE INDEX "OnlineLead_createdAt_idx" ON "public"."OnlineLead"("createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "OnlineLead_enquiryId_key" ON "public"."OnlineLead"("enquiryId" ASC);

-- CreateIndex
CREATE INDEX "OnlineLead_sessionId_idx" ON "public"."OnlineLead"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "RouteStop_busStopId_idx" ON "public"."RouteStop"("busStopId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RouteStop_routeId_busStopId_key" ON "public"."RouteStop"("routeId" ASC, "busStopId" ASC);

-- CreateIndex
CREATE INDEX "RouteStop_routeId_idx" ON "public"."RouteStop"("routeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RouteStop_routeId_sortOrder_key" ON "public"."RouteStop"("routeId" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "SchoolNotice_publishedAt_idx" ON "public"."SchoolNotice"("publishedAt" ASC);

-- CreateIndex
CREATE INDEX "SchoolNotice_sessionId_idx" ON "public"."SchoolNotice"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "Section_classId_idx" ON "public"."Section"("classId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Section_classId_name_key" ON "public"."Section"("classId" ASC, "name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_employeeCode_key" ON "public"."Staff"("employeeCode" ASC);

-- CreateIndex
CREATE INDEX "Staff_isActive_idx" ON "public"."Staff"("isActive" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "public"."Staff"("userId" ASC);

-- CreateIndex
CREATE INDEX "StaffAdvance_staffId_idx" ON "public"."StaffAdvance"("staffId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNo_key" ON "public"."Student"("admissionNo" ASC);

-- CreateIndex
CREATE INDEX "Student_sectionId_idx" ON "public"."Student"("sectionId" ASC);

-- CreateIndex
CREATE INDEX "Student_sessionId_idx" ON "public"."Student"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "StudentAttendance_date_idx" ON "public"."StudentAttendance"("date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendance_studentId_date_key" ON "public"."StudentAttendance"("studentId" ASC, "date" ASC);

-- CreateIndex
CREATE INDEX "StudentAttendance_studentId_idx" ON "public"."StudentAttendance"("studentId" ASC);

-- CreateIndex
CREATE INDEX "StudentTransportAssignment_boardingStopId_idx" ON "public"."StudentTransportAssignment"("boardingStopId" ASC);

-- CreateIndex
CREATE INDEX "StudentTransportAssignment_routeId_idx" ON "public"."StudentTransportAssignment"("routeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "StudentTransportAssignment_studentId_key" ON "public"."StudentTransportAssignment"("studentId" ASC);

-- CreateIndex
CREATE INDEX "Subject_sessionId_idx" ON "public"."Subject"("sessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_sessionId_name_key" ON "public"."Subject"("sessionId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "Survey_sessionId_idx" ON "public"."Survey"("sessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SurveyEntry_enquiryId_key" ON "public"."SurveyEntry"("enquiryId" ASC);

-- CreateIndex
CREATE INDEX "SurveyEntry_phone_idx" ON "public"."SurveyEntry"("phone" ASC);

-- CreateIndex
CREATE INDEX "SurveyEntry_surveyId_idx" ON "public"."SurveyEntry"("surveyId" ASC);

-- CreateIndex
CREATE INDEX "TransportRoute_defaultVehicleId_idx" ON "public"."TransportRoute"("defaultVehicleId" ASC);

-- CreateIndex
CREATE INDEX "TransportRoute_sessionId_idx" ON "public"."TransportRoute"("sessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TransportRoute_sessionId_name_key" ON "public"."TransportRoute"("sessionId" ASC, "name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "public"."User"("clerkId" ASC);

-- CreateIndex
CREATE INDEX "Vehicle_isBlocked_idx" ON "public"."Vehicle"("isBlocked" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registrationNo_key" ON "public"."Vehicle"("registrationNo" ASC);

-- CreateIndex
CREATE INDEX "VehicleDocument_expiresOn_idx" ON "public"."VehicleDocument"("expiresOn" ASC);

-- CreateIndex
CREATE INDEX "VehicleDocument_vehicleId_idx" ON "public"."VehicleDocument"("vehicleId" ASC);

-- AddForeignKey
ALTER TABLE "public"."Admission" ADD CONSTRAINT "Admission_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "public"."Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Admission" ADD CONSTRAINT "Admission_proposedSectionId_fkey" FOREIGN KEY ("proposedSectionId") REFERENCES "public"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Admission" ADD CONSTRAINT "Admission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Admission" ADD CONSTRAINT "Admission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdmissionDocument" ADD CONSTRAINT "AdmissionDocument_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdmissionDocument" ADD CONSTRAINT "AdmissionDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "public"."DocumentTypeMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdmissionFeePayment" ADD CONSTRAINT "AdmissionFeePayment_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdvanceRecovery" ADD CONSTRAINT "AdvanceRecovery_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "public"."StaffAdvance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusStop" ADD CONSTRAINT "BusStop_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassDiaryEntry" ADD CONSTRAINT "ClassDiaryEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassDiaryEntry" ADD CONSTRAINT "ClassDiaryEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintTicket" ADD CONSTRAINT "ComplaintTicket_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentTypeMaster" ADD CONSTRAINT "DocumentTypeMaster_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enquiry" ADD CONSTRAINT "Enquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enquiry" ADD CONSTRAINT "Enquiry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnquiryFollowUp" ADD CONSTRAINT "EnquiryFollowUp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnquiryFollowUp" ADD CONSTRAINT "EnquiryFollowUp_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "public"."Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Exam" ADD CONSTRAINT "Exam_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeHead" ADD CONSTRAINT "FeeHead_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructure" ADD CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructure" ADD CONSTRAINT "FeeStructure_headId_fkey" FOREIGN KEY ("headId") REFERENCES "public"."FeeHead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructure" ADD CONSTRAINT "FeeStructure_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeTransaction" ADD CONSTRAINT "FeeTransaction_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "public"."FeeHead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeTransaction" ADD CONSTRAINT "FeeTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FuelIssue" ADD CONSTRAINT "FuelIssue_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeBand" ADD CONSTRAINT "GradeBand_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HomeworkEntry" ADD CONSTRAINT "HomeworkEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HomeworkEntry" ADD CONSTRAINT "HomeworkEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HomeworkEntry" ADD CONSTRAINT "HomeworkEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTxn" ADD CONSTRAINT "InventoryTxn_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Mark" ADD CONSTRAINT "Mark_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Mark" ADD CONSTRAINT "Mark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Mark" ADD CONSTRAINT "Mark_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnlineLead" ADD CONSTRAINT "OnlineLead_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "public"."Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnlineLead" ADD CONSTRAINT "OnlineLead_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RouteStop" ADD CONSTRAINT "RouteStop_busStopId_fkey" FOREIGN KEY ("busStopId") REFERENCES "public"."BusStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SchoolNotice" ADD CONSTRAINT "SchoolNotice_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffAdvance" ADD CONSTRAINT "StaffAdvance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentAttendance" ADD CONSTRAINT "StudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentParent" ADD CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentParent" ADD CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentTransportAssignment" ADD CONSTRAINT "StudentTransportAssignment_boardingStopId_fkey" FOREIGN KEY ("boardingStopId") REFERENCES "public"."BusStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentTransportAssignment" ADD CONSTRAINT "StudentTransportAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentTransportAssignment" ADD CONSTRAINT "StudentTransportAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subject" ADD CONSTRAINT "Subject_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Survey" ADD CONSTRAINT "Survey_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Survey" ADD CONSTRAINT "Survey_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyEntry" ADD CONSTRAINT "SurveyEntry_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "public"."Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyEntry" ADD CONSTRAINT "SurveyEntry_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "public"."Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransportRoute" ADD CONSTRAINT "TransportRoute_defaultVehicleId_fkey" FOREIGN KEY ("defaultVehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransportRoute" ADD CONSTRAINT "TransportRoute_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
