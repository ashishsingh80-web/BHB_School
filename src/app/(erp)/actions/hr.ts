"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireHrAccess } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { derivePayrollNetAmount, getNextPayrollStatus, normalizePayrollStatus } from "@/lib/payroll-rules";
import { getCurrentSession } from "@/lib/session-context";

function emptyToNull(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function parseOptionalAmount(v: FormDataEntryValue | null, label: string) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseFloat(s);
  if (Number.isNaN(n) || n < 0) throw new Error(`Invalid ${label}.`);
  return n;
}

export async function createStaffMember(formData: FormData) {
  const user = await requireHrAccess();

  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName) throw new Error("First name is required.");

  const employeeCode = emptyToNull(formData.get("employeeCode"));
  if (employeeCode) {
    const dup = await prisma.staff.findUnique({
      where: { employeeCode },
      select: { id: true },
    });
    if (dup) throw new Error("That employee code is already in use.");
  }

  const staff = await prisma.staff.create({
    data: {
      firstName,
      lastName: emptyToNull(formData.get("lastName")),
      employeeCode,
      phone: emptyToNull(formData.get("phone")),
      email: emptyToNull(formData.get("email")),
      designation: emptyToNull(formData.get("designation")),
    },
    select: { id: true },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "Staff",
    entityId: staff.id,
    meta: { firstName, employeeCode },
  });

  revalidatePath("/hr/directory");
  revalidatePath("/accounts/staff-advance");
  revalidatePath("/dashboard");
}

export async function setStaffActive(formData: FormData) {
  const user = await requireHrAccess();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing staff record.");

  const activeRaw = String(formData.get("isActive") ?? "").trim();
  const isActive = activeRaw === "true" || activeRaw === "1";

  await prisma.staff.update({
    where: { id },
    data: { isActive },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entity: "Staff",
    entityId: id,
    meta: { isActive },
  });

  revalidatePath("/hr/directory");
  revalidatePath("/accounts/staff-advance");
  revalidatePath("/dashboard");
}

export async function createPayrollRun(formData: FormData) {
  const user = await requireHrAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const monthLabel = String(formData.get("monthLabel") ?? "").trim();
  if (!monthLabel) throw new Error("Month label is required.");

  const existing = await prisma.payrollRun.findFirst({
    where: { sessionId: session.id, monthLabel },
    select: { id: true },
  });
  if (existing) throw new Error("A payroll run already exists for this month.");

  const grossAmount = parseOptionalAmount(formData.get("grossAmount"), "gross amount");
  const deductionsAmount =
    parseOptionalAmount(formData.get("deductionsAmount"), "deductions amount") ?? 0;
  const providedNet = parseOptionalAmount(formData.get("netAmount"), "net amount");
  const netAmount = derivePayrollNetAmount(grossAmount, deductionsAmount, providedNet);

  const status = normalizePayrollStatus(String(formData.get("status") ?? "DRAFT"));

  const row = await prisma.payrollRun.create({
    data: {
      sessionId: session.id,
      monthLabel,
      status,
      grossAmount,
      deductionsAmount,
      netAmount,
      processedAt: status === "PROCESSED" ? new Date() : null,
    },
    select: { id: true },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "PayrollRun",
    entityId: row.id,
    meta: { monthLabel, status, grossAmount, deductionsAmount, netAmount },
  });

  revalidatePath("/hr/payroll");
  revalidatePath("/dashboard");
}

export async function setPayrollRunStatus(formData: FormData) {
  const user = await requireHrAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing payroll run.");

  const run = await prisma.payrollRun.findFirst({
    where: { id, sessionId: session.id },
    select: { id: true, status: true },
  });
  if (!run) throw new Error("Payroll run not found.");

  const nextStatus = getNextPayrollStatus(run.status);

  await prisma.payrollRun.update({
    where: { id },
    data: {
      status: nextStatus,
      processedAt: nextStatus === "PROCESSED" ? new Date() : null,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entity: "PayrollRun",
    entityId: id,
    meta: { status: nextStatus },
  });

  revalidatePath("/hr/payroll");
  revalidatePath("/dashboard");
}
