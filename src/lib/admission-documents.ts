import { prisma } from "@/lib/prisma";

/** Create missing checklist rows from session document-type master. */
export async function ensureAdmissionChecklist(
  sessionId: string,
  admissionId: string,
) {
  const types = await prisma.documentTypeMaster.findMany({
    where: { sessionId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  if (types.length === 0) return;

  const existing = await prisma.admissionDocument.findMany({
    where: { admissionId },
    select: { documentTypeId: true },
  });
  const have = new Set(
    existing
      .map((e) => e.documentTypeId)
      .filter((id): id is string => id != null),
  );

  for (const t of types) {
    if (!have.has(t.id)) {
      await prisma.admissionDocument.create({
        data: {
          admissionId,
          documentTypeId: t.id,
          label: t.name,
          status: "PENDING",
        },
      });
    }
  }
}
