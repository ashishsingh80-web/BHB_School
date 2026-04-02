import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session-context";

export type ParentPortalStudent = {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string | null;
  section: {
    name: string;
    class: { name: string };
  } | null;
};

/**
 * Parents are matched to the ERP user by email (case-insensitive). Ensure the parent record
 * uses the same email as the Clerk account.
 */
export async function getParentPortalContext(): Promise<{
  parentId: string;
  displayName: string;
  students: ParentPortalStudent[];
} | null> {
  const user = await ensureAppUser();
  if (!user?.email?.trim()) return null;

  const session = await getCurrentSession();
  if (!session) return null;

  const parent = await prisma.parent.findFirst({
    where: {
      email: { equals: user.email.trim(), mode: "insensitive" },
    },
    select: { id: true, fatherName: true, motherName: true, guardianName: true },
  });
  if (!parent) return null;

  const links = await prisma.studentParent.findMany({
    where: {
      parentId: parent.id,
      student: { sessionId: session.id, isActive: true },
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
          section: { select: { name: true, class: { select: { name: true } } } },
        },
      },
    },
  });

  const displayName =
    parent.guardianName?.trim() ||
    parent.fatherName?.trim() ||
    parent.motherName?.trim() ||
    "Parent";

  return {
    parentId: parent.id,
    displayName,
    students: links.map((l) => l.student),
  };
}

export async function parentCanViewStudent(
  parentId: string,
  studentId: string,
): Promise<boolean> {
  const link = await prisma.studentParent.findFirst({
    where: {
      parentId,
      studentId,
      student: { isActive: true },
    },
    select: { studentId: true },
  });
  return Boolean(link);
}
