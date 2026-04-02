"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireMasterAccess } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session-context";

export async function updateSchoolProfile(formData: FormData) {
  await requireMasterAccess();
  const existing = await prisma.schoolProfile.findFirst();
  const id = existing?.id ?? "school-profile-singleton";
  const data = {
    name: String(formData.get("name") ?? "").trim() || "BHB International School",
    board: String(formData.get("board") ?? "").trim() || "CBSE",
    tagline: emptyToUndefined(formData.get("tagline")),
    established: parseIntOrUndefined(formData.get("established")),
    addressLine1: emptyToUndefined(formData.get("addressLine1")),
    addressLine2: emptyToUndefined(formData.get("addressLine2")),
    city: emptyToUndefined(formData.get("city")),
    state: emptyToUndefined(formData.get("state")),
    pincode: emptyToUndefined(formData.get("pincode")),
    phone: emptyToUndefined(formData.get("phone")),
    email: emptyToUndefined(formData.get("email")),
    website: emptyToUndefined(formData.get("website")),
  };

  await prisma.schoolProfile.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
  revalidatePath("/master/school-profile");
}

export async function createAcademicSession(formData: FormData) {
  await requireMasterAccess();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Session name is required");
  const start = new Date(String(formData.get("startDate")));
  const end = new Date(String(formData.get("endDate")));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid dates");
  }

  await prisma.academicSession.create({
    data: { name, startDate: start, endDate: end, isCurrent: false },
  });
  revalidatePath("/master/sessions");
}

export async function setCurrentSession(formData: FormData) {
  await requireMasterAccess();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) throw new Error("Missing session");
  await prisma.$transaction([
    prisma.academicSession.updateMany({ data: { isCurrent: false } }),
    prisma.academicSession.update({
      where: { id: sessionId },
      data: { isCurrent: true },
    }),
  ]);
  revalidatePath("/master/sessions");
  revalidatePath("/dashboard");
}

export async function createClass(formData: FormData) {
  await requireMasterAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("Create an academic session first");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Class name is required");
  const maxOrder = await prisma.class.aggregate({
    where: { sessionId: session.id },
    _max: { sortOrder: true },
  });
  await prisma.class.create({
    data: {
      sessionId: session.id,
      name,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/master/classes");
}

export async function createSection(formData: FormData) {
  await requireMasterAccess();
  const classId = String(formData.get("classId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!classId || !name) throw new Error("Class and section name are required");
  await prisma.section.create({
    data: { classId, name },
  });
  revalidatePath("/master/sections");
}

export async function createSubject(formData: FormData) {
  await requireMasterAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("Create an academic session first");
  const name = String(formData.get("name") ?? "").trim();
  const code = emptyToUndefined(formData.get("code"));
  if (!name) throw new Error("Subject name is required");
  await prisma.subject.create({
    data: { sessionId: session.id, name, code: code ?? null },
  });
  revalidatePath("/master/subjects");
}

export async function createFeeHead(formData: FormData) {
  await requireMasterAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("Create an academic session first");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Fee head name is required");
  const maxOrder = await prisma.feeHead.aggregate({
    where: { sessionId: session.id },
    _max: { sortOrder: true },
  });
  await prisma.feeHead.create({
    data: {
      sessionId: session.id,
      name,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/master/fee-heads");
}

function emptyToUndefined(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
}

function parseIntOrUndefined(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (s === "") return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
}
