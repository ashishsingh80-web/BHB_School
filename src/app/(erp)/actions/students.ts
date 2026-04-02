"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStudentAccess } from "@/lib/auth";
import type { Gender } from "@prisma/client";

export async function updateStudentProfile(formData: FormData) {
  await requireStudentAccess();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing student");

  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName) throw new Error("First name is required");

  const genderRaw = String(formData.get("gender") ?? "").trim();
  const gender =
    genderRaw === "MALE" || genderRaw === "FEMALE" || genderRaw === "OTHER"
      ? (genderRaw as Gender)
      : null;

  await prisma.student.update({
    where: { id },
    data: {
      firstName,
      lastName: emptyToNull(formData.get("lastName")),
      category: emptyToNull(formData.get("category")),
      religion: emptyToNull(formData.get("religion")),
      bloodGroup: emptyToNull(formData.get("bloodGroup")),
      aadhaarLast4: emptyToNull(formData.get("aadhaarLast4")),
      gender,
      dob: parseOptionalDate(formData.get("dob")),
    },
  });

  revalidatePath("/students/list");
  revalidatePath("/students/profile");
  revalidatePath("/students/archived");
}

export async function setStudentActive(formData: FormData) {
  await requireStudentAccess();
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";
  if (!id) throw new Error("Missing student");

  await prisma.student.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/students/list");
  revalidatePath("/students/profile");
  revalidatePath("/students/archived");
  revalidatePath("/dashboard");
}

function emptyToNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function parseOptionalDate(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
