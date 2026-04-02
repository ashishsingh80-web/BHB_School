"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmissionsAccess, requireDocumentTypeAccess } from "@/lib/auth";
import { emptyToNull } from "@/lib/form-helpers";
import { getCurrentSession } from "@/lib/session-context";

const DOC_STATUSES = ["PENDING", "RECEIVED", "VERIFIED", "REJECTED", "WAIVED"] as const;

export async function updateAdmissionDocument(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !DOC_STATUSES.includes(status as (typeof DOC_STATUSES)[number])) {
    throw new Error("Invalid document update.");
  }

  const doc = await prisma.admissionDocument.findFirst({
    where: { id },
    include: { admission: true },
  });
  if (!doc || doc.admission.sessionId !== session.id) {
    throw new Error("Document not found.");
  }
  if (doc.admission.status === "ADMITTED") {
    throw new Error("Admission is finalised; documents are read-only.");
  }

  await prisma.admissionDocument.update({
    where: { id },
    data: {
      status,
      remarks: emptyToNull(formData.get("remarks")),
      fileUrl: emptyToNull(formData.get("fileUrl")),
      verifiedAt: status === "VERIFIED" ? new Date() : null,
    },
  });

  revalidatePath("/admissions/admission-form");
  revalidatePath("/admissions/admission-fee");
  revalidatePath("/admissions/pending-documents");
}

export async function recordAdmissionFeePayment(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");

  const admissionId = String(formData.get("admissionId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  if (!admissionId || !amountRaw) throw new Error("Admission and amount required.");

  const amount = Number.parseFloat(amountRaw);
  if (Number.isNaN(amount) || amount <= 0) throw new Error("Invalid amount.");

  const admission = await prisma.admission.findFirst({
    where: { id: admissionId, sessionId: session.id },
  });
  if (!admission) throw new Error("Admission not found.");
  if (admission.status === "ADMITTED") {
    throw new Error("Use student fee collection after admission is finalised.");
  }

  const isFull = String(formData.get("isFull") ?? "") === "on";

  await prisma.admissionFeePayment.create({
    data: {
      admissionId,
      amount,
      isFull,
      receiptNo: emptyToNull(formData.get("receiptNo")),
      description: emptyToNull(formData.get("description")),
      paidAt: new Date(),
    },
  });

  revalidatePath("/admissions/admission-form");
  revalidatePath("/admissions/admission-fee");
  revalidatePath("/admissions/pending-documents");
}

export async function createDocumentTypeMaster(formData: FormData) {
  await requireDocumentTypeAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  await prisma.documentTypeMaster.create({
    data: {
      sessionId: session.id,
      name,
      requiredForAdmission: String(formData.get("requiredForAdmission") ?? "") === "on",
      sortOrder: Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0,
    },
  });

  revalidatePath("/master/document-types");
  revalidatePath("/admissions/admission-form");
}

export async function deleteDocumentTypeMaster(formData: FormData) {
  await requireDocumentTypeAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id.");

  const row = await prisma.documentTypeMaster.findFirst({
    where: { id, sessionId: session.id },
  });
  if (!row) throw new Error("Not found.");

  await prisma.documentTypeMaster.delete({ where: { id } });

  revalidatePath("/master/document-types");
  revalidatePath("/admissions/admission-form");
}
