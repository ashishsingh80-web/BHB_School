"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAccountsAccess as requireFeesAccess } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import {
  normalizeFeeReceiptNo,
  parseLedgerFeeTxnType,
  parsePositiveFeeAmount,
} from "@/lib/fee-rules";
import { getCurrentSession } from "@/lib/session-context";
import type { FeeTxnType } from "@prisma/client";

export async function upsertFeeStructure(formData: FormData) {
  await requireFeesAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const classId = String(formData.get("classId") ?? "");
  const headId = String(formData.get("headId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  if (!classId || !headId || amountRaw === "") throw new Error("Class, head, and amount are required.");

  const amount = Number.parseFloat(amountRaw);
  if (Number.isNaN(amount) || amount < 0) throw new Error("Invalid amount.");

  await prisma.feeStructure.upsert({
    where: {
      sessionId_classId_headId: {
        sessionId: session.id,
        classId,
        headId,
      },
    },
    create: {
      sessionId: session.id,
      classId,
      headId,
      amount,
    },
    update: { amount },
  });

  revalidatePath("/fees/structure");
  revalidatePath("/dashboard");
}

export async function recordFeePayment(formData: FormData) {
  const user = await requireFeesAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const studentId = String(formData.get("studentId") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  if (!studentId || amountRaw === "") throw new Error("Student and amount are required.");

  const student = await prisma.student.findFirst({
    where: { id: studentId, sessionId: session.id },
    select: { id: true },
  });
  if (!student) throw new Error("Student not found for this session.");

  const amount = parsePositiveFeeAmount(amountRaw);
  const receiptNo = normalizeFeeReceiptNo(emptyToNull(formData.get("receiptNo")));

  const headRaw = String(formData.get("feeHeadId") ?? "").trim();
  const feeHeadId: string | null = headRaw === "" ? null : headRaw;

  if (feeHeadId) {
    const head = await prisma.feeHead.findFirst({
      where: { id: feeHeadId, sessionId: session.id },
    });
    if (!head) throw new Error("Invalid fee head for this session.");
  }

  const txn = await prisma.feeTransaction.create({
    data: {
      studentId,
      type: "PAYMENT",
      amount,
      description: emptyToNull(formData.get("description")) ?? "Fee payment",
      receiptNo,
      paidAt: new Date(),
      feeHeadId,
    },
    select: { id: true },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "FeeTransaction",
    entityId: txn.id,
    meta: {
      type: "PAYMENT",
      studentId,
      amount,
      receiptNo,
    },
  });

  revalidatePath("/fees/collect");
  revalidatePath("/fees/receipts");
  revalidatePath("/fees/ledger");
  revalidatePath("/fees/monthly-collection");
  revalidatePath("/fees/head-wise");
  revalidatePath("/dashboard");
}

export async function recordFeeLedgerEntry(formData: FormData) {
  await requireFeesAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const studentId = String(formData.get("studentId") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  if (!studentId || !typeRaw || amountRaw === "") throw new Error("Missing fields.");

  const student = await prisma.student.findFirst({
    where: { id: studentId, sessionId: session.id },
    select: { id: true },
  });
  if (!student) throw new Error("Student not found for this session.");

  const type = parseLedgerFeeTxnType(typeRaw) as FeeTxnType;
  const amount = parsePositiveFeeAmount(amountRaw);

  await prisma.feeTransaction.create({
    data: {
      studentId,
      type,
      amount,
      description: emptyToNull(formData.get("description")) ?? type,
      receiptNo: emptyToNull(formData.get("receiptNo")),
      paidAt: new Date(),
    },
  });

  revalidatePath("/fees/refunds");
  revalidatePath("/fees/receipts");
  revalidatePath("/fees/ledger");
  revalidatePath("/dashboard");
}

function emptyToNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
