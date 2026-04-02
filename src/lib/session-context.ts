import { prisma } from "@/lib/prisma";

/** Prefer the session flagged current; otherwise the latest by start date. */
export async function getCurrentSession() {
  let session = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
  });
  if (!session) {
    session = await prisma.academicSession.findFirst({
      orderBy: { startDate: "desc" },
    });
  }
  return session;
}
