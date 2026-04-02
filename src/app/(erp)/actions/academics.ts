"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAcademicAccess } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session-context";

export async function createHomeworkEntry(formData: FormData) {
  await requireAcademicAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const sectionId = String(formData.get("sectionId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "HOMEWORK").trim();
  if (!sectionId || !title) throw new Error("Section and title are required.");

  const section = await prisma.section.findFirst({
    where: { id: sectionId, class: { sessionId: session.id } },
  });
  if (!section) throw new Error("Invalid section.");

  const subjectIdRaw = String(formData.get("subjectId") ?? "").trim();
  const subjectId = subjectIdRaw === "" ? null : subjectIdRaw;

  if (subjectId) {
    const sub = await prisma.subject.findFirst({
      where: { id: subjectId, sessionId: session.id },
    });
    if (!sub) throw new Error("Invalid subject.");
  }

  const assignedOn = parseDateRequired(formData.get("assignedOn"));
  const dueDate = parseDateOptional(formData.get("dueDate"));

  await prisma.homeworkEntry.create({
    data: {
      sessionId: session.id,
      sectionId,
      subjectId,
      kind: kind === "CLASSWORK" ? "CLASSWORK" : "HOMEWORK",
      title,
      description: emptyToNull(formData.get("description")),
      assignedOn,
      dueDate,
    },
  });

  revalidatePath("/academics/homework");
}

export async function deleteHomeworkEntry(formData: FormData) {
  await requireAcademicAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");
  const row = await prisma.homeworkEntry.findFirst({
    where: { id, sessionId: session.id },
  });
  if (!row) throw new Error("Not found.");
  await prisma.homeworkEntry.delete({ where: { id } });
  revalidatePath("/academics/homework");
}

export async function upsertClassDiary(formData: FormData) {
  await requireAcademicAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const sectionId = String(formData.get("sectionId") ?? "");
  const summary = String(formData.get("summary") ?? "").trim();
  if (!sectionId || !summary) throw new Error("Section and summary are required.");

  const section = await prisma.section.findFirst({
    where: { id: sectionId, class: { sessionId: session.id } },
  });
  if (!section) throw new Error("Invalid section.");

  const entryDate = parseDateRequired(formData.get("entryDate"));

  await prisma.classDiaryEntry.upsert({
    where: {
      sectionId_entryDate: { sectionId, entryDate },
    },
    create: {
      sessionId: session.id,
      sectionId,
      entryDate,
      summary,
    },
    update: { summary },
  });

  revalidatePath("/academics/class-diary");
}

function emptyToNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function parseDateRequired(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) throw new Error("Date required");
  const parts = s.split("-");
  if (parts.length !== 3) throw new Error("Invalid date.");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    !y ||
    !m ||
    !d
  ) {
    throw new Error("Invalid date.");
  }
  return new Date(Date.UTC(y, m - 1, d));
}

function parseDateOptional(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    !y ||
    !m ||
    !d
  ) {
    return null;
  }
  return new Date(Date.UTC(y, m - 1, d));
}
