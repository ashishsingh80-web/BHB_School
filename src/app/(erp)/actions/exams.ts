"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireExamAccess } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session-context";

export async function createExam(formData: FormData) {
  await requireExamAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Exam name is required.");

  await prisma.exam.create({
    data: {
      sessionId: session.id,
      name,
      termLabel: emptyToNull(formData.get("termLabel")),
      examDate: parseDateOptional(formData.get("examDate")),
    },
  });

  revalidatePath("/exams/setup");
  revalidatePath("/exams/marks-entry");
  revalidatePath("/exams/results");
}

export async function deleteExam(formData: FormData) {
  await requireExamAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing exam");
  const row = await prisma.exam.findFirst({
    where: { id, sessionId: session.id },
  });
  if (!row) throw new Error("Not found");
  await prisma.exam.delete({ where: { id } });
  revalidatePath("/exams/setup");
  revalidatePath("/exams/marks-entry");
  revalidatePath("/exams/results");
}

export async function saveSectionMarks(formData: FormData) {
  await requireExamAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");

  const examId = String(formData.get("examId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");
  if (!examId || !sectionId) throw new Error("Exam and section required.");

  const exam = await prisma.exam.findFirst({
    where: { id: examId, sessionId: session.id },
  });
  if (!exam) throw new Error("Invalid exam.");

  const section = await prisma.section.findFirst({
    where: { id: sectionId, class: { sessionId: session.id } },
  });
  if (!section) throw new Error("Invalid section.");

  const students = await prisma.student.findMany({
    where: { sessionId: session.id, sectionId, isActive: true },
    select: { id: true },
  });
  const studentIds = new Set(students.map((s) => s.id));

  const subjects = await prisma.subject.findMany({
    where: { sessionId: session.id },
    select: { id: true },
  });
  const subjectIds = new Set(subjects.map((s) => s.id));

  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("obtained__")) continue;
    const parts = key.split("__");
    if (parts.length !== 3 || parts[0] !== "obtained") continue;
    const studentId = parts[1]!;
    const subjectId = parts[2]!;
    if (!studentIds.has(studentId) || !subjectIds.has(subjectId)) continue;

    const scoreStr = String(val ?? "").trim();
    const maxKey = `max__${studentId}__${subjectId}`;
    const maxRaw = String(formData.get(maxKey) ?? "100").trim();
    const maxMarks = Number.parseFloat(maxRaw);
    if (Number.isNaN(maxMarks) || maxMarks <= 0) continue;

    if (scoreStr === "" || scoreStr === "-") {
      await prisma.mark.deleteMany({
        where: { examId, studentId, subjectId },
      });
      continue;
    }

    const obtained = Number.parseFloat(scoreStr);
    if (Number.isNaN(obtained) || obtained < 0 || obtained > maxMarks) {
      throw new Error(`Invalid marks for student ${studentId} / subject ${subjectId}`);
    }

    await prisma.mark.upsert({
      where: {
        examId_studentId_subjectId: { examId, studentId, subjectId },
      },
      create: {
        examId,
        studentId,
        subjectId,
        marksObtained: obtained,
        maxMarks,
      },
      update: {
        marksObtained: obtained,
        maxMarks,
      },
    });
  }

  revalidatePath("/exams/marks-entry");
  revalidatePath("/exams/results");
  revalidatePath("/exams/weak-students");
  revalidatePath("/exams/report-card");
}

function emptyToNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
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
