"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireComplaintAccess } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { getCurrentSession } from "@/lib/session-context";

function emptyToNull(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

const STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"] as const;

export async function createComplaintTicket(formData: FormData) {
  const user = await requireComplaintAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) throw new Error("Subject and description are required.");

  const row = await prisma.complaintTicket.create({
    data: {
      sessionId: session.id,
      raisedByName: emptyToNull(formData.get("raisedByName")),
      phone: emptyToNull(formData.get("phone")),
      email: emptyToNull(formData.get("email")),
      subject,
      body,
    },
    select: { id: true },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "ComplaintTicket",
    entityId: row.id,
    meta: { subject },
  });

  revalidatePath("/communication/complaints");
  revalidatePath("/dashboard");
}

export async function updateComplaintTicketStatus(formData: FormData) {
  const user = await requireComplaintAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) throw new Error("Invalid update.");
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    throw new Error("Invalid status.");
  }

  const updated = await prisma.complaintTicket.updateMany({
    where: { id, sessionId: session.id },
    data: { status },
  });
  if (updated.count === 0) throw new Error("Ticket not found.");

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entity: "ComplaintTicket",
    entityId: id,
    meta: { status },
  });

  revalidatePath("/communication/complaints");
  revalidatePath("/dashboard");
}
