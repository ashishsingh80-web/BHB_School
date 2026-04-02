"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAcademicAccess } from "@/lib/auth";
import { emptyToNull, parseOptionalDateTimeOrNull } from "@/lib/form-helpers";
import { getCurrentSession } from "@/lib/session-context";

function parseOptionalInt(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  if (Number.isNaN(n) || n < 0) throw new Error("Enter a valid whole number.");
  return n;
}

function parseOptionalPercent(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseFloat(s);
  if (Number.isNaN(n) || n < 0 || n > 100) throw new Error("Percentage must be between 0 and 100.");
  return n;
}

function parseStrictOptionalDateTime(v: FormDataEntryValue | null) {
  const parsed = parseOptionalDateTimeOrNull(v);
  if (String(v ?? "").trim() !== "" && parsed === null) {
    throw new Error("Enter a valid date/time.");
  }
  return parsed;
}

export async function createContentAsset(formData: FormData) {
  await requireAcademicAccess();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required.");

  await prisma.contentAsset.create({
    data: {
      title,
      provider: emptyToNull(formData.get("provider")),
      subjectHint: emptyToNull(formData.get("subjectHint")),
      gradeHint: emptyToNull(formData.get("gradeHint")),
      externalUrl: emptyToNull(formData.get("externalUrl")),
    },
  });

  revalidatePath("/academics/smart-content");
  revalidatePath("/dashboard");
}

export async function deleteContentAsset(formData: FormData) {
  await requireAcademicAccess();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing asset id.");

  await prisma.contentAsset.delete({ where: { id } });

  revalidatePath("/academics/smart-content");
  revalidatePath("/dashboard");
}

export async function createContentMapping(formData: FormData) {
  await requireAcademicAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const contentAssetId = String(formData.get("contentAssetId") ?? "").trim();
  if (!contentAssetId) throw new Error("Choose a content asset.");

  await prisma.contentMapping.create({
    data: {
      sessionId: session.id,
      contentAssetId,
      subjectId: emptyToNull(formData.get("subjectId")),
      className: emptyToNull(formData.get("className")),
      chapterName: emptyToNull(formData.get("chapterName")),
      topicName: emptyToNull(formData.get("topicName")),
    },
  });

  revalidatePath("/academics/smart-content");
}

export async function logContentUsage(formData: FormData) {
  await requireAcademicAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const contentAssetId = String(formData.get("contentAssetId") ?? "").trim();
  if (!contentAssetId) throw new Error("Choose a content asset.");

  await prisma.contentUsage.create({
    data: {
      sessionId: session.id,
      contentAssetId,
      subjectId: emptyToNull(formData.get("subjectId")),
      usedByName: emptyToNull(formData.get("usedByName")),
      usedForClass: emptyToNull(formData.get("usedForClass")),
      usedForSection: emptyToNull(formData.get("usedForSection")),
      usageType: String(formData.get("usageType") ?? "CLASSROOM").trim() || "CLASSROOM",
      durationMinutes: parseOptionalInt(formData.get("durationMinutes")),
      usedAt: parseStrictOptionalDateTime(formData.get("usedAt")) ?? new Date(),
    },
  });

  revalidatePath("/academics/smart-content");
  revalidatePath("/dashboard");
}

export async function logStudentContentActivity(formData: FormData) {
  await requireAcademicAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const contentAssetId = String(formData.get("contentAssetId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const activityType = String(formData.get("activityType") ?? "").trim();

  if (!contentAssetId || !studentId || !activityType) {
    throw new Error("Asset, student, and activity type are required.");
  }

  await prisma.studentContentActivity.create({
    data: {
      sessionId: session.id,
      contentAssetId,
      studentId,
      subjectId: emptyToNull(formData.get("subjectId")),
      activityType,
      progressPercent: parseOptionalPercent(formData.get("progressPercent")),
      scorePercent: parseOptionalPercent(formData.get("scorePercent")),
      occurredAt: parseStrictOptionalDateTime(formData.get("occurredAt")) ?? new Date(),
    },
  });

  revalidatePath("/academics/smart-content");
  revalidatePath("/dashboard");
}
