"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAccountsAccess } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import {
  getAvailableFuelLiters,
  getFuelIssueBlockReason,
  parseOptionalFuelRate,
  parseOptionalOdometerKm,
} from "@/lib/fuel-rules";
import { emptyToNull, parseOptionalDateTimeOrUndefined } from "@/lib/form-helpers";
import { getCurrentSession } from "@/lib/session-context";

function parseAmount(raw: string, label = "Amount") {
  const n = Number.parseFloat(raw.trim());
  if (Number.isNaN(n) || n <= 0) throw new Error(`Invalid ${label}.`);
  return n;
}

export async function createExpense(formData: FormData) {
  const user = await requireAccountsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const category = String(formData.get("category") ?? "").trim();
  if (!category) throw new Error("Category is required.");

  const amount = parseAmount(String(formData.get("amount") ?? ""), "amount");

  const row = await prisma.expense.create({
    data: {
      sessionId: session.id,
      category,
      amount,
      description: emptyToNull(formData.get("description")),
      vendor: emptyToNull(formData.get("vendor")),
      paidAt: parseOptionalDateTimeOrUndefined(formData.get("paidAt")) ?? new Date(),
      receiptUrl: emptyToNull(formData.get("receiptUrl")),
    },
    select: { id: true },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "Expense",
    entityId: row.id,
    meta: { category, amount },
  });

  revalidatePath("/accounts/expenses");
  revalidatePath("/dashboard");
}

export async function createStaffAdvance(formData: FormData) {
  await requireAccountsAccess();

  const staffId = String(formData.get("staffId") ?? "").trim();
  if (!staffId) throw new Error("Select a staff member.");

  const amount = parseAmount(String(formData.get("amount") ?? ""), "amount");

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, isActive: true },
  });
  if (!staff) throw new Error("Staff not found.");

  await prisma.staffAdvance.create({
    data: {
      staffId,
      amount,
      purpose: emptyToNull(formData.get("purpose")),
      balance: amount,
    },
  });

  revalidatePath("/accounts/staff-advance");
  revalidatePath("/dashboard");
}

export async function recordAdvanceRecovery(formData: FormData) {
  await requireAccountsAccess();

  const advanceId = String(formData.get("advanceId") ?? "").trim();
  if (!advanceId) throw new Error("Missing advance.");

  const recovered = parseAmount(String(formData.get("amount") ?? ""), "recovery amount");

  await prisma.$transaction(async (tx) => {
    const advance = await tx.staffAdvance.findUnique({
      where: { id: advanceId },
      include: { staff: true },
    });
    if (!advance) throw new Error("Advance not found.");

    const bal = Number(advance.balance);
    if (recovered > bal + 1e-9) {
      throw new Error("Recovery cannot exceed remaining balance.");
    }

    await tx.advanceRecovery.create({
      data: {
        advanceId,
        amount: recovered,
        payrollRef: emptyToNull(formData.get("payrollRef")),
      },
    });

    await tx.staffAdvance.update({
      where: { id: advanceId },
      data: { balance: bal - recovered },
    });
  });

  revalidatePath("/accounts/staff-advance");
  revalidatePath("/dashboard");
}

export async function createFuelPurchase(formData: FormData) {
  await requireAccountsAccess();

  const quantityLiters = parseAmount(
    String(formData.get("quantityLiters") ?? ""),
    "quantity (liters)",
  );

  const totalRaw = String(formData.get("totalAmount") ?? "").trim();
  const totalAmount = parseAmount(totalRaw, "total amount");

  const ratePerLiter = parseOptionalFuelRate(String(formData.get("ratePerLiter") ?? ""));

  const purchasedAt = parseOptionalDateTimeOrUndefined(formData.get("purchasedAt")) ?? new Date();
  const notes = emptyToNull(formData.get("notes"));

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.fuelPurchase.create({
      data: {
        quantityLiters,
        ratePerLiter: ratePerLiter ?? undefined,
        totalAmount,
        vendor: emptyToNull(formData.get("vendor")),
        purchasedAt,
        notes,
      },
      select: { id: true },
    });

    await tx.fuelStockEntry.create({
      data: {
        quantityLiters,
        direction: "IN",
        referenceType: "FUEL_PURCHASE",
        referenceId: purchase.id,
        recordedAt: purchasedAt,
        notes,
      },
    });
  });

  revalidatePath("/accounts/fuel");
  revalidatePath("/transport/fuel-log");
  revalidatePath("/dashboard");
}

export async function createFuelIssue(formData: FormData) {
  await requireAccountsAccess();

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  if (!vehicleId) throw new Error("Select a vehicle.");

  const quantityLiters = parseAmount(
    String(formData.get("quantityLiters") ?? ""),
    "quantity (liters)",
  );

  const odometerKm = parseOptionalOdometerKm(String(formData.get("odometerKm") ?? ""));

  const issuedAt = parseOptionalDateTimeOrUndefined(formData.get("issuedAt")) ?? new Date();
  const notes = emptyToNull(formData.get("notes"));

  await prisma.$transaction(async (tx) => {
    const totals = await tx.fuelStockEntry.groupBy({
      by: ["direction"],
      _sum: { quantityLiters: true },
    });

    const available = getAvailableFuelLiters(
      totals.map((row) => ({
        direction: row.direction,
        quantityLiters: Number(row._sum.quantityLiters ?? 0),
      })),
    );
    const fuelBlock = getFuelIssueBlockReason(quantityLiters, available);
    if (fuelBlock) {
      throw new Error(fuelBlock);
    }

    const issue = await tx.fuelIssue.create({
      data: {
        vehicleId,
        quantityLiters,
        odometerKm,
        issuedAt,
        notes,
      },
      select: { id: true },
    });

    await tx.fuelStockEntry.create({
      data: {
        vehicleId,
        quantityLiters,
        direction: "OUT",
        referenceType: "FUEL_ISSUE",
        referenceId: issue.id,
        recordedAt: issuedAt,
        notes,
      },
    });
  });

  revalidatePath("/accounts/fuel");
  revalidatePath("/transport/fuel-log");
  revalidatePath("/transport/vehicles");
  revalidatePath("/dashboard");
}
