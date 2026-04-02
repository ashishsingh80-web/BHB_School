"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireTransportAccess } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { getCurrentSession } from "@/lib/session-context";

function emptyToNull(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

const TRANSPORT_PATHS = [
  "/transport/stops",
  "/transport/routes",
  "/transport/mapping",
  "/master/transport",
  "/dashboard",
] as const;

function revalidateTransport() {
  for (const p of TRANSPORT_PATHS) revalidatePath(p);
}

export async function createBusStop(formData: FormData) {
  const user = await requireTransportAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Stop name is required.");

  const row = await prisma.busStop.create({
    data: {
      sessionId: session.id,
      name,
      area: emptyToNull(formData.get("area")),
      sortOrder: Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0,
    },
    select: { id: true },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "BusStop",
    entityId: row.id,
    meta: { name },
  });
  revalidateTransport();
}

export async function deleteBusStop(formData: FormData) {
  const user = await requireTransportAccess();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing stop.");

  const onRoute = await prisma.routeStop.count({ where: { busStopId: id } });
  const assigned = await prisma.studentTransportAssignment.count({
    where: { boardingStopId: id },
  });
  if (onRoute > 0 || assigned > 0) {
    throw new Error("Stop is on a route or assigned to a student; remove those links first.");
  }

  await prisma.busStop.delete({ where: { id } });
  await writeAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "BusStop",
    entityId: id,
  });
  revalidateTransport();
}

export async function createTransportRoute(formData: FormData) {
  const user = await requireTransportAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Route name is required.");

  const vid = emptyToNull(formData.get("defaultVehicleId"));
  const row = await prisma.transportRoute.create({
    data: {
      sessionId: session.id,
      name,
      code: emptyToNull(formData.get("code")),
      defaultVehicleId: vid,
    },
    select: { id: true },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "TransportRoute",
    entityId: row.id,
    meta: { name },
  });
  revalidateTransport();
}

export async function updateTransportRoute(formData: FormData) {
  const user = await requireTransportAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing route.");

  const vid = emptyToNull(formData.get("defaultVehicleId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Route name is required.");

  const updated = await prisma.transportRoute.updateMany({
    where: { id, sessionId: session.id },
    data: {
      name,
      code: emptyToNull(formData.get("code")),
      defaultVehicleId: vid,
      isActive: formData.get("isActive") === "on",
    },
  });
  if (updated.count === 0) throw new Error("Route not found.");

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entity: "TransportRoute",
    entityId: id,
  });
  revalidateTransport();
}

export async function deleteTransportRoute(formData: FormData) {
  const user = await requireTransportAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing route.");

  await prisma.transportRoute.deleteMany({ where: { id, sessionId: session.id } });
  await writeAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "TransportRoute",
    entityId: id,
  });
  revalidateTransport();
}

export async function addStopToRoute(formData: FormData) {
  const user = await requireTransportAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const routeId = String(formData.get("routeId") ?? "").trim();
  const busStopId = String(formData.get("busStopId") ?? "").trim();
  if (!routeId || !busStopId) throw new Error("Route and stop are required.");

  const route = await prisma.transportRoute.findFirst({
    where: { id: routeId, sessionId: session.id },
  });
  if (!route) throw new Error("Route not found.");

  const stop = await prisma.busStop.findFirst({
    where: { id: busStopId, sessionId: session.id },
  });
  if (!stop) throw new Error("Stop not found.");

  const max = await prisma.routeStop.aggregate({
    where: { routeId },
    _max: { sortOrder: true },
  });
  const next = (max._max.sortOrder ?? -1) + 1;

  await prisma.routeStop.create({
    data: {
      routeId,
      busStopId,
      sortOrder: next,
      pickupTime: emptyToNull(formData.get("pickupTime")),
      dropTime: emptyToNull(formData.get("dropTime")),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entity: "TransportRoute",
    entityId: routeId,
    meta: { action: "addStop", busStopId },
  });
  revalidateTransport();
}

export async function removeStopFromRoute(formData: FormData) {
  const user = await requireTransportAccess();
  const routeStopId = String(formData.get("routeStopId") ?? "").trim();
  if (!routeStopId) throw new Error("Missing route stop.");

  const rs = await prisma.routeStop.findUnique({
    where: { id: routeStopId },
    select: { routeId: true, busStopId: true },
  });
  if (!rs) throw new Error("Not found.");

  const assigned = await prisma.studentTransportAssignment.count({
    where: { routeId: rs.routeId, boardingStopId: rs.busStopId },
  });
  if (assigned > 0) {
    throw new Error("A student is still mapped to this stop on this route; change mappings first.");
  }

  await prisma.routeStop.delete({ where: { id: routeStopId } });
  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entity: "TransportRoute",
    entityId: rs.routeId,
    meta: { action: "removeStop" },
  });
  revalidateTransport();
}

export async function moveRouteStop(formData: FormData) {
  await requireTransportAccess();
  const routeStopId = String(formData.get("routeStopId") ?? "").trim();
  const dir = String(formData.get("direction") ?? "").trim();
  if (!routeStopId || (dir !== "up" && dir !== "down")) throw new Error("Invalid move.");

  const current = await prisma.routeStop.findUnique({
    where: { id: routeStopId },
  });
  if (!current) throw new Error("Not found.");

  const neighborOrder = dir === "up" ? current.sortOrder - 1 : current.sortOrder + 1;
  const neighbor = await prisma.routeStop.findFirst({
    where: { routeId: current.routeId, sortOrder: neighborOrder },
  });
  if (!neighbor) return;

  await prisma.$transaction([
    prisma.routeStop.update({
      where: { id: current.id },
      data: { sortOrder: neighborOrder },
    }),
    prisma.routeStop.update({
      where: { id: neighbor.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
  revalidateTransport();
}

export async function upsertStudentTransport(formData: FormData) {
  const user = await requireTransportAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const studentId = String(formData.get("studentId") ?? "").trim();
  const routeId = String(formData.get("routeId") ?? "").trim();
  const boardingStopId = String(formData.get("boardingStopId") ?? "").trim();
  if (!studentId || !routeId || !boardingStopId) {
    throw new Error("Student, route, and boarding stop are required.");
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, sessionId: session.id },
  });
  if (!student) throw new Error("Student not found.");

  const route = await prisma.transportRoute.findFirst({
    where: { id: routeId, sessionId: session.id },
  });
  if (!route) throw new Error("Route not found.");

  const onRoute = await prisma.routeStop.findFirst({
    where: { routeId, busStopId: boardingStopId },
  });
  if (!onRoute) throw new Error("Boarding stop must be on the selected route.");

  await prisma.studentTransportAssignment.upsert({
    where: { studentId },
    create: {
      studentId,
      routeId,
      boardingStopId,
      remarks: emptyToNull(formData.get("remarks")),
    },
    update: {
      routeId,
      boardingStopId,
      remarks: emptyToNull(formData.get("remarks")),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPSERT",
    entity: "StudentTransportAssignment",
    entityId: studentId,
    meta: { routeId, boardingStopId },
  });
  revalidateTransport();
}

export async function clearStudentTransport(formData: FormData) {
  const user = await requireTransportAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const studentId = String(formData.get("studentId") ?? "").trim();
  if (!studentId) throw new Error("Missing student.");

  const st = await prisma.student.findFirst({
    where: { id: studentId, sessionId: session.id },
  });
  if (!st) throw new Error("Student not found.");

  await prisma.studentTransportAssignment.deleteMany({ where: { studentId } });
  await writeAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "StudentTransportAssignment",
    entityId: studentId,
  });
  revalidateTransport();
}
