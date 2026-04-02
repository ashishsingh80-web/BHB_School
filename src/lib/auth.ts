import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import {
  type AuthScope,
  canAccessAuthScope,
} from "@/lib/auth-scopes";

/** Serialize first-user bootstrap so only one account becomes SUPER_ADMIN (Postgres advisory lock). */
const USER_BOOTSTRAP_LOCK_KEY = BigInt(582_947_103);

export async function ensureAppUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;
  const name =
    clerkUser?.fullName?.trim() ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    "User";

  const existingByClerk = await prisma.user.findUnique({
    where: { clerkId: userId },
  });
  if (existingByClerk) {
    return prisma.user.update({
      where: { clerkId: userId },
      data: { email, name },
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(${USER_BOOTSTRAP_LOCK_KEY})`,
    );

    const again = await tx.user.findUnique({ where: { clerkId: userId } });
    if (again) {
      return tx.user.update({
        where: { clerkId: userId },
        data: { email, name },
      });
    }

    const existingCount = await tx.user.count();
    const role = (existingCount === 0 ? "SUPER_ADMIN" : "OFFICE_ADMIN") as UserRole;

    return tx.user.create({
      data: {
        clerkId: userId,
        email,
        name,
        role,
      },
    });
  });
}

export async function requireAppUser() {
  const user = await ensureAppUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAnyRole(...roles: UserRole[]) {
  const user = await requireAppUser();
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireScopeAccess(scope: AuthScope) {
  const user = await requireAppUser();
  if (!canAccessAuthScope(user.role, scope)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireMasterAccess() {
  return requireScopeAccess("master");
}

export async function requireAdmissionsAccess() {
  return requireScopeAccess("admissions");
}

export async function requireAccountsAccess() {
  return requireScopeAccess("accounts");
}

export async function requireAcademicAccess() {
  return requireScopeAccess("academics");
}

export async function requireExamAccess() {
  return requireAcademicAccess();
}

export async function requireAttendanceAccess() {
  return requireAcademicAccess();
}

export async function requireTransportAccess() {
  return requireScopeAccess("transport");
}

export async function requireHrAccess() {
  return requireScopeAccess("hr");
}

export async function requireNoticeAccess() {
  return requireScopeAccess("notices");
}

export async function requireComplaintAccess() {
  return requireScopeAccess("complaints");
}

export async function requireInventoryAccess() {
  return requireScopeAccess("inventory");
}

export async function requireStudentAccess() {
  return requireScopeAccess("students");
}

export async function requireDocumentTypeAccess() {
  return requireMasterAccess();
}
