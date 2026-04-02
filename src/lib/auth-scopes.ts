import type { UserRole } from "@prisma/client";

import {
  ACCOUNTS_TEAM_ROLES,
  ACADEMIC_TEAM_ROLES,
  HR_TEAM_ROLES,
  INTERNAL_USER_ROLES,
  INVENTORY_ACCESS_ROLES,
  MASTER_ACCESS_ROLES,
  OFFICE_TEAM_ROLES,
  STUDENT_ACCESS_ROLES,
  TRANSPORT_TEAM_ROLES,
} from "@/lib/role-groups";

export const AUTH_SCOPE_ROLES = {
  master: [...MASTER_ACCESS_ROLES],
  admissions: [...OFFICE_TEAM_ROLES],
  accounts: [...ACCOUNTS_TEAM_ROLES],
  academics: [...ACADEMIC_TEAM_ROLES],
  transport: [...TRANSPORT_TEAM_ROLES],
  hr: [...HR_TEAM_ROLES],
  notices: [...INTERNAL_USER_ROLES],
  complaints: [...INTERNAL_USER_ROLES],
  inventory: [...INVENTORY_ACCESS_ROLES],
  students: [...STUDENT_ACCESS_ROLES],
} as const satisfies Record<string, UserRole[]>;

export type AuthScope = keyof typeof AUTH_SCOPE_ROLES;

export function canAccessAuthScope(role: UserRole, scope: AuthScope) {
  return (AUTH_SCOPE_ROLES[scope] as readonly UserRole[]).includes(role);
}
