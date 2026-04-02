"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAttendanceAccess } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session-context";
import type { AttendanceStatus } from "@prisma/client";

export async function saveSectionAttendance(formData: FormData) {
  await requireAttendanceAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const sectionId = String(formData.get("sectionId") ?? "");
  const dateStr = String(formData.get("date") ?? "").trim();
  if (!sectionId || !dateStr) throw new Error("Section and date are required.");

  const date = parseDateOnly(dateStr);

  const section = await prisma.section.findFirst({
    where: { id: sectionId, class: { sessionId: session.id } },
  });
  if (!section) throw new Error("Invalid section.");

  const students = await prisma.student.findMany({
    where: {
      sessionId: session.id,
      sectionId,
      isActive: true,
    },
    select: { id: true },
  });

  for (const s of students) {
    const key = `status_${s.id}`;
    const raw = formData.get(key);
    if (raw === null || raw === undefined) continue;
    const statusStr = String(raw).trim();
    if (!statusStr || statusStr === "UNMARKED") {
      await prisma.studentAttendance.deleteMany({
        where: { studentId: s.id, date },
      });
      continue;
    }
    if (!isAttendanceStatus(statusStr)) throw new Error(`Invalid status for student ${s.id}`);
    const status = statusStr as AttendanceStatus;

    await prisma.studentAttendance.upsert({
      where: {
        studentId_date: { studentId: s.id, date },
      },
      create: {
        studentId: s.id,
        date,
        status,
        remarks: emptyToNull(formData.get(`remarks_${s.id}`)),
      },
      update: {
        status,
        remarks: emptyToNull(formData.get(`remarks_${s.id}`)),
      },
    });
  }

  revalidatePath("/attendance/students");
  revalidatePath("/attendance/monthly");
  revalidatePath("/dashboard");
}

function parseDateOnly(ymd: string): Date {
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error("Invalid date");
  }
  const [y, m, d] = parts as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

function isAttendanceStatus(s: string): s is AttendanceStatus {
  return ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"].includes(s);
}

function emptyToNull(v: FormDataEntryValue | null) {
  const str = String(v ?? "").trim();
  return str === "" ? null : str;
}
