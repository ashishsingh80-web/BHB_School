"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireTransportAccess } from "@/lib/auth";

function emptyToNull(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function parseOptionalDate(v: FormDataEntryValue | null): Date | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const d = new Date(s + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parsePositiveNumber(v: FormDataEntryValue | null, label: string) {
  const s = String(v ?? "").trim();
  const n = Number.parseFloat(s);
  if (Number.isNaN(n) || n <= 0) throw new Error(`Invalid ${label}.`);
  return n;
}

export async function createVehicle(formData: FormData) {
  await requireTransportAccess();

  const registrationNo = String(formData.get("registrationNo") ?? "").trim().toUpperCase();
  if (!registrationNo) throw new Error("Registration number is required.");

  await prisma.vehicle.create({
    data: {
      registrationNo,
      model: emptyToNull(formData.get("model")),
      fuelType: emptyToNull(formData.get("fuelType")),
      driverName: emptyToNull(formData.get("driverName")),
      driverPhone: emptyToNull(formData.get("driverPhone")),
    },
  });

  revalidatePath("/transport/vehicles");
  revalidatePath("/transport/compliance");
  revalidatePath("/accounts/fuel");
  revalidatePath("/dashboard");
}

export async function blockVehicle(formData: FormData) {
  await requireTransportAccess();
  const id = String(formData.get("vehicleId") ?? "").trim();
  if (!id) throw new Error("Missing vehicle.");

  const reason = String(formData.get("blockReason") ?? "").trim() || "Blocked";

  await prisma.vehicle.update({
    where: { id },
    data: { isBlocked: true, blockReason: reason },
  });

  revalidatePath("/transport/vehicles");
  revalidatePath("/transport/compliance");
  revalidatePath("/dashboard");
}

export async function unblockVehicle(formData: FormData) {
  await requireTransportAccess();
  const id = String(formData.get("vehicleId") ?? "").trim();
  if (!id) throw new Error("Missing vehicle.");

  await prisma.vehicle.update({
    where: { id },
    data: { isBlocked: false, blockReason: null },
  });

  revalidatePath("/transport/vehicles");
  revalidatePath("/transport/compliance");
  revalidatePath("/dashboard");
}

export async function addVehicleDocument(formData: FormData) {
  await requireTransportAccess();

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  const docType = String(formData.get("docType") ?? "").trim();
  if (!vehicleId || !docType) throw new Error("Vehicle and document type are required.");

  await prisma.vehicleDocument.create({
    data: {
      vehicleId,
      docType,
      expiresOn: parseOptionalDate(formData.get("expiresOn")),
      issuedOn: parseOptionalDate(formData.get("issuedOn")),
      fileUrl: emptyToNull(formData.get("fileUrl")),
    },
  });

  revalidatePath("/transport/vehicles");
  revalidatePath("/transport/compliance");
  revalidatePath("/dashboard");
}

export async function addDriverDocument(formData: FormData) {
  await requireTransportAccess();

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  const driverName = String(formData.get("driverName") ?? "").trim();
  const docType = String(formData.get("docType") ?? "").trim();
  if (!vehicleId || !driverName || !docType) {
    throw new Error("Vehicle, driver name, and document type are required.");
  }

  await prisma.driverDocument.create({
    data: {
      vehicleId,
      driverName,
      docType,
      identifier: emptyToNull(formData.get("identifier")),
      expiresOn: parseOptionalDate(formData.get("expiresOn")),
      fileUrl: emptyToNull(formData.get("fileUrl")),
    },
  });

  revalidatePath("/transport/vehicles");
  revalidatePath("/transport/compliance");
  revalidatePath("/dashboard");
}

export async function addFuelStockAdjustment(formData: FormData) {
  await requireTransportAccess();

  const direction = String(formData.get("direction") ?? "").trim().toUpperCase();
  if (direction !== "IN" && direction !== "OUT") {
    throw new Error("Direction must be IN or OUT.");
  }

  const quantityLiters = parsePositiveNumber(formData.get("quantityLiters"), "quantity");
  const recordedAt = parseOptionalDate(formData.get("recordedAt"));

  await prisma.fuelStockEntry.create({
    data: {
      vehicleId: emptyToNull(formData.get("vehicleId")),
      quantityLiters,
      direction,
      referenceType: "MANUAL",
      referenceId: null,
      recordedAt: recordedAt ?? new Date(),
      notes: emptyToNull(formData.get("notes")),
    },
  });

  revalidatePath("/transport/fuel-log");
  revalidatePath("/accounts/fuel");
  revalidatePath("/transport/vehicles");
  revalidatePath("/dashboard");
}
