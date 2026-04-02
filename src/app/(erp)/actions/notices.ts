"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireNoticeAccess } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { parseOptionalDateTimeOrUndefined } from "@/lib/form-helpers";
import { getCurrentSession } from "@/lib/session-context";

export async function createSchoolNotice(formData: FormData) {
  const user = await requireNoticeAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) throw new Error("Title and body are required.");

  const pinned = formData.get("pinned") === "on";

  const row = await prisma.schoolNotice.create({
    data: {
      sessionId: session.id,
      title,
      body,
      pinned,
      publishedAt: parseOptionalDateTimeOrUndefined(formData.get("publishedAt")) ?? new Date(),
    },
    select: { id: true },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "SchoolNotice",
    entityId: row.id,
    meta: { title, pinned },
  });

  revalidatePath("/communication/notices");
  revalidatePath("/dashboard");
}

export async function deleteSchoolNotice(formData: FormData) {
  const user = await requireNoticeAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing notice.");

  const deleted = await prisma.schoolNotice.deleteMany({
    where: { id, sessionId: session.id },
  });
  if (deleted.count === 0) throw new Error("Notice not found.");

  await writeAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "SchoolNotice",
    entityId: id,
  });

  revalidatePath("/communication/notices");
  revalidatePath("/dashboard");
}
