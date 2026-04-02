"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireExamAccess } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session-context";

export async function createGradeBand(formData: FormData) {
  await requireExamAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");

  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("Grade label is required.");

  const minRaw = String(formData.get("minPercent") ?? "").trim();
  const minPercent = Number.parseFloat(minRaw);
  if (Number.isNaN(minPercent) || minPercent < 0 || minPercent > 100) {
    throw new Error("Min % must be between 0 and 100.");
  }

  const sortRaw = String(formData.get("sortOrder") ?? "0").trim();
  const sortOrder = Number.parseInt(sortRaw, 10);
  const order = Number.isNaN(sortOrder) ? 0 : sortOrder;

  await prisma.gradeBand.create({
    data: {
      sessionId: session.id,
      label,
      minPercent,
      sortOrder: order,
    },
  });

  revalidatePath("/exams/grade-rules");
  revalidatePath("/exams/report-card");
}

export async function deleteGradeBand(formData: FormData) {
  await requireExamAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No session.");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing band");

  const row = await prisma.gradeBand.findFirst({
    where: { id, sessionId: session.id },
  });
  if (!row) throw new Error("Not found");

  await prisma.gradeBand.delete({ where: { id } });

  revalidatePath("/exams/grade-rules");
  revalidatePath("/exams/report-card");
}
