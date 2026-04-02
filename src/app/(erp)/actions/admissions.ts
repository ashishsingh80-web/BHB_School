"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FollowUpChannel, Gender, LeadTemperature } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmissionsAccess } from "@/lib/auth";
import { getEnrollmentBlockReason, getReviewSubmissionBlockReason } from "@/lib/admission-rules";
import { writeAuditLog } from "@/lib/audit-log";
import { emptyToNull, parseOptionalDateTimeOrNull } from "@/lib/form-helpers";
import { getCurrentSession } from "@/lib/session-context";

export async function createEnquiry(formData: FormData) {
  const user = await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session. Create one under Master Setup.");

  const childName = String(formData.get("childName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!childName || !phone) throw new Error("Child name and phone are required.");

  const row = await prisma.enquiry.create({
    data: {
      sessionId: session.id,
      childName,
      parentName: emptyToNull(formData.get("parentName")),
      phone,
      email: emptyToNull(formData.get("email")),
      source: emptyToNull(formData.get("source")),
      classSeeking: emptyToNull(formData.get("classSeeking")),
      status: String(formData.get("status") ?? "NEW").trim() || "NEW",
      notes: emptyToNull(formData.get("notes")),
      nextFollowUp: parseOptionalDateTimeOrNull(formData.get("nextFollowUp")),
    },
    select: { id: true },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "Enquiry",
    entityId: row.id,
    meta: { childName, phone },
  });

  revalidatePath("/admissions/enquiry-list");
  revalidatePath("/admissions/follow-up");
  revalidatePath("/dashboard");
}

/** Registration form: create enquiry + admission draft in one step, then open admission form. */
export async function createRegistrationAndAdmission(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session. Create one under Master Setup.");

  const childName = String(formData.get("childName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!childName || !phone) throw new Error("Child name and phone are required.");

  const admissionId = await prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.create({
      data: {
        sessionId: session.id,
        childName,
        parentName: emptyToNull(formData.get("parentName")),
        phone,
        email: emptyToNull(formData.get("email")),
        source: emptyToNull(formData.get("source")),
        classSeeking: emptyToNull(formData.get("classSeeking")),
        status: "REGISTERED",
        notes: emptyToNull(formData.get("notes")),
        nextFollowUp: parseOptionalDateTimeOrNull(formData.get("nextFollowUp")),
      },
    });

    const admission = await tx.admission.create({
      data: {
        sessionId: session.id,
        enquiryId: enquiry.id,
        status: "REGISTERED",
        draftFirstName: childName,
      },
    });

    return admission.id;
  });

  revalidatePath("/admissions/enquiry-list");
  revalidatePath("/admissions/follow-up");
  revalidateAdmissionPaths();
  revalidatePath("/admissions/registration");

  redirect(`/admissions/admission-form?admissionId=${admissionId}`);
}

export async function updateEnquiryStatus(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) throw new Error("Invalid update");

  const updated = await prisma.enquiry.updateMany({
    where: { id, sessionId: session.id },
    data: { status },
  });
  if (updated.count === 0) throw new Error("Enquiry not found.");

  revalidatePath("/admissions/enquiry-list");
  revalidatePath("/admissions/follow-up");
  revalidatePath("/dashboard");
}

export async function updateEnquiryFollowUp(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing enquiry");

  const updated = await prisma.enquiry.updateMany({
    where: { id, sessionId: session.id },
    data: {
      nextFollowUp: parseOptionalDateTimeOrNull(formData.get("nextFollowUp")),
      notes: emptyToNull(formData.get("notes")) ?? undefined,
    },
  });
  if (updated.count === 0) throw new Error("Enquiry not found.");

  revalidatePath("/admissions/enquiry-list");
  revalidatePath("/admissions/follow-up");
}

export async function updateEnquiryAssignment(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing enquiry.");

  const enq = await prisma.enquiry.findFirst({
    where: { id, sessionId: session.id },
  });
  if (!enq) throw new Error("Enquiry not found.");

  const assignRaw = String(formData.get("assignedToId") ?? "").trim();
  const assignedToId: string | null = assignRaw === "" ? null : assignRaw;
  if (assignedToId) {
    const u = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!u) throw new Error("Invalid staff user.");
  }

  const tempRaw = String(formData.get("leadTemperature") ?? "").trim();
  let leadTemperature: LeadTemperature | null = null;
  if (tempRaw === "HOT" || tempRaw === "WARM" || tempRaw === "COLD") {
    leadTemperature = tempRaw;
  }

  await prisma.enquiry.update({
    where: { id },
    data: { assignedToId, leadTemperature },
  });

  revalidatePath("/admissions/enquiry-list");
  revalidatePath("/admissions/follow-up");
  revalidatePath("/dashboard");
}

export async function addEnquiryFollowUpLog(formData: FormData) {
  const me = await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const enquiryId = String(formData.get("enquiryId") ?? "");
  const summary = String(formData.get("summary") ?? "").trim();
  if (!enquiryId || !summary) throw new Error("Enquiry and summary are required.");

  const enq = await prisma.enquiry.findFirst({
    where: { id: enquiryId, sessionId: session.id },
  });
  if (!enq) throw new Error("Enquiry not found.");

  const channelRaw = String(formData.get("channel") ?? "CALL").trim();
  const channel = (
    ["CALL", "WHATSAPP", "VISIT", "EMAIL", "OTHER"].includes(channelRaw)
      ? channelRaw
      : "CALL"
  ) as FollowUpChannel;

  const nextFollowUp = parseOptionalDateTimeOrNull(formData.get("nextFollowUp"));

  await prisma.$transaction(async (tx) => {
    await tx.enquiryFollowUp.create({
      data: {
        enquiryId,
        channel,
        summary,
        nextFollowUp,
        createdById: me.id,
      },
    });

    await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        ...(nextFollowUp ? { nextFollowUp } : {}),
        ...(enq.status === "NEW" ? { status: "FOLLOW_UP" } : {}),
      },
    });
  });

  revalidatePath("/admissions/enquiry-list");
  revalidatePath("/admissions/follow-up");
  revalidatePath("/dashboard");
}

export async function openAdmissionFromEnquiry(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const enquiryId = String(formData.get("enquiryId") ?? "");
  if (!enquiryId) throw new Error("Missing enquiry.");

  const enquiry = await prisma.enquiry.findFirst({
    where: { id: enquiryId, sessionId: session.id },
  });
  if (!enquiry) throw new Error("Enquiry not found.");

  const existing = await prisma.admission.findUnique({
    where: { enquiryId },
  });
  if (existing) {
    redirect(`/admissions/admission-form?admissionId=${existing.id}`);
  }

  const created = await prisma.admission.create({
    data: {
      sessionId: session.id,
      enquiryId,
      status: "REGISTERED",
      draftFirstName: enquiry.childName,
    },
  });

  revalidateAdmissionPaths();
  redirect(`/admissions/admission-form?admissionId=${created.id}`);
}

export async function saveAdmissionDraft(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("admissionId") ?? "");
  if (!id) throw new Error("Missing admission.");

  const admission = await prisma.admission.findFirst({
    where: { id, sessionId: session.id },
  });
  if (!admission) throw new Error("Admission not found.");
  if (!["REGISTERED", "PENDING_REVIEW", "APPROVED"].includes(admission.status)) {
    throw new Error("This admission can no longer be edited here.");
  }

  const sectionId = String(formData.get("proposedSectionId") ?? "").trim();
  const proposedSectionId = sectionId === "" ? null : sectionId;

  if (proposedSectionId) {
    const sec = await prisma.section.findFirst({
      where: { id: proposedSectionId, class: { sessionId: session.id } },
    });
    if (!sec) throw new Error("Invalid section.");
  }

  const firstName = String(formData.get("draftFirstName") ?? "").trim();
  if (!firstName) throw new Error("Student first name is required.");

  await prisma.admission.update({
    where: { id },
    data: {
      proposedSectionId,
      proposedAdmissionNo: emptyToNull(formData.get("proposedAdmissionNo")),
      draftFirstName: firstName,
      draftLastName: emptyToNull(formData.get("draftLastName")),
      draftDob: parseOptionalDateOnly(formData.get("draftDob")),
      draftGender: parseGender(formData.get("draftGender")),
      remarks: emptyToNull(formData.get("remarks")),
    },
  });

  revalidateAdmissionPaths();
}

export async function submitAdmissionForReview(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("admissionId") ?? "");
  if (!id) throw new Error("Missing admission.");

  const admission = await prisma.admission.findFirst({
    where: { id, sessionId: session.id },
  });
  if (!admission) throw new Error("Admission not found.");

  const blockingDocs = await prisma.admissionDocument.findMany({
    where: {
      admissionId: id,
      documentType: { requiredForAdmission: true },
      status: { notIn: ["VERIFIED", "WAIVED"] },
    },
    select: { label: true },
  });
  const reviewBlock = getReviewSubmissionBlockReason(
    admission,
    blockingDocs.map((d) => d.label),
  );
  if (reviewBlock) {
    throw new Error(reviewBlock);
  }

  await prisma.admission.update({
    where: { id },
    data: { status: "PENDING_REVIEW" },
  });

  revalidateAdmissionPaths();
}

export async function setAdmissionDecision(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("admissionId") ?? "");
  const next = String(formData.get("decision") ?? "").trim();
  if (!id) throw new Error("Missing admission.");

  if (!["APPROVED", "REJECTED", "WAITLIST"].includes(next)) {
    throw new Error("Invalid decision.");
  }

  const admission = await prisma.admission.findFirst({
    where: { id, sessionId: session.id },
  });
  if (!admission) throw new Error("Admission not found.");
  if (admission.status !== "PENDING_REVIEW") {
    throw new Error("Only applications in review can be decided.");
  }

  await prisma.admission.update({
    where: { id },
    data: {
      status: next as "APPROVED" | "REJECTED" | "WAITLIST",
    },
  });

  revalidateAdmissionPaths();
}

export async function enrollAdmissionAsStudent(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("admissionId") ?? "");
  if (!id) throw new Error("Missing admission.");

  const admission = await prisma.admission.findFirst({
    where: { id, sessionId: session.id },
    include: { enquiry: true },
  });
  if (!admission) throw new Error("Admission not found.");

  const feeCount = await prisma.admissionFeePayment.count({
    where: { admissionId: admission.id },
  });
  const enrollmentBlock = getEnrollmentBlockReason(
    {
      status: admission.status,
      studentId: admission.studentId,
      proposedSectionId: admission.proposedSectionId,
      draftFirstName: admission.draftFirstName,
      enquiryPhone: admission.enquiry?.phone ?? null,
    },
    feeCount,
  );
  if (enrollmentBlock) throw new Error(enrollmentBlock);

  const enrollSectionId = admission.proposedSectionId!;
  const enrollFirstName = admission.draftFirstName!;

  const section = await prisma.section.findFirst({
    where: { id: enrollSectionId, class: { sessionId: session.id } },
  });
  if (!section) throw new Error("Section is no longer valid.");
  const phone = admission.enquiry!.phone!.trim();

  const fatherName =
    admission.enquiry?.parentName?.trim() || enrollFirstName;

  try {
    await prisma.$transaction(async (tx) => {
      let parent = await tx.parent.findFirst({
        where: { phonePrimary: phone },
      });
      if (!parent) {
        parent = await tx.parent.create({
          data: {
            phonePrimary: phone,
            fatherName,
            email: admission.enquiry?.email?.trim() || null,
          },
        });
      }

      const admissionNo = admission.proposedAdmissionNo?.trim() || null;

      const student = await tx.student.create({
        data: {
          sessionId: session.id,
          sectionId: enrollSectionId,
          admissionNo: admissionNo === "" ? null : admissionNo,
          firstName: enrollFirstName,
          lastName: admission.draftLastName,
          dob: admission.draftDob,
          gender: admission.draftGender,
        },
      });

      await tx.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          relation: "Father",
        },
      });

      await tx.admission.update({
        where: { id: admission.id },
        data: {
          studentId: student.id,
          status: "ADMITTED",
        },
      });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint") && msg.includes("admissionNo")) {
      throw new Error("That admission number is already used. Change it on the admission form and try again.");
    }
    throw e;
  }

  revalidateAdmissionPaths();
  revalidatePath("/students/list");
  revalidatePath("/students/profile");
}

function revalidateAdmissionPaths() {
  revalidatePath("/admissions/enquiry-list");
  revalidatePath("/admissions/follow-up");
  revalidatePath("/admissions/registration");
  revalidatePath("/admissions/admission-form");
  revalidatePath("/admissions/admission-fee");
  revalidatePath("/admissions/pending-documents");
  revalidatePath("/admissions/approved");
  revalidatePath("/admissions/final-admission");
  revalidatePath("/admissions/rejected");
  revalidatePath("/admissions/waitlist");
  revalidatePath("/dashboard");
}

function parseOptionalDateOnly(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function parseGender(v: FormDataEntryValue | null): Gender | null {
  const s = String(v ?? "").trim();
  if (s === "MALE" || s === "FEMALE" || s === "OTHER") return s;
  return null;
}
