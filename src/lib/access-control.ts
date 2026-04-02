import type { UserRole } from "@prisma/client";

import { navSections, type NavSection } from "@/config/navigation";
import {
  ACCOUNTS_TEAM_ROLES,
  ACADEMIC_TEAM_ROLES,
  HR_TEAM_ROLES,
  INTERNAL_USER_ROLES,
  INVENTORY_ACCESS_ROLES,
  MASTER_ACCESS_ROLES,
  OFFICE_TEAM_ROLES,
  PORTAL_ACCESS_ROLES,
  REPORTS_ACCESS_ROLES,
  STUDENT_ACCESS_ROLES,
  TRANSPORT_TEAM_ROLES,
} from "@/lib/role-groups";

type RouteRule = {
  prefix: string;
  roles: UserRole[];
};

const ROUTE_RULES: RouteRule[] = [
  { prefix: "/dashboard", roles: [...INTERNAL_USER_ROLES] },
  { prefix: "/students", roles: [...STUDENT_ACCESS_ROLES] },
  { prefix: "/admissions", roles: [...OFFICE_TEAM_ROLES] },
  { prefix: "/accounts", roles: [...ACCOUNTS_TEAM_ROLES] },
  { prefix: "/fees", roles: [...ACCOUNTS_TEAM_ROLES] },
  { prefix: "/attendance", roles: [...ACADEMIC_TEAM_ROLES] },
  { prefix: "/academics", roles: [...ACADEMIC_TEAM_ROLES] },
  { prefix: "/exams", roles: [...ACADEMIC_TEAM_ROLES] },
  { prefix: "/timetable", roles: [...ACADEMIC_TEAM_ROLES] },
  { prefix: "/transport", roles: [...TRANSPORT_TEAM_ROLES] },
  { prefix: "/communication", roles: [...INTERNAL_USER_ROLES] },
  { prefix: "/ai", roles: [...INTERNAL_USER_ROLES] },
  { prefix: "/inventory", roles: [...INVENTORY_ACCESS_ROLES] },
  { prefix: "/certificates", roles: [...OFFICE_TEAM_ROLES] },
  { prefix: "/hr", roles: [...HR_TEAM_ROLES] },
  { prefix: "/reports", roles: [...REPORTS_ACCESS_ROLES] },
  { prefix: "/master", roles: [...MASTER_ACCESS_ROLES] },
  { prefix: "/front-office", roles: [...OFFICE_TEAM_ROLES] },
  { prefix: "/settings", roles: [...MASTER_ACCESS_ROLES] },
  { prefix: "/portal", roles: [...PORTAL_ACCESS_ROLES] },
];

export function canAccessErpPath(role: UserRole, pathname: string) {
  const hit = ROUTE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );
  if (!hit) return true;
  return hit.roles.includes(role);
}

export function filterNavSectionsForRole(role: UserRole): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessErpPath(role, item.href)),
    }))
    .filter((section) => section.items.length > 0);
}

export function defaultLandingPathForRole(role: UserRole) {
  if (role === "PARENT" || role === "STUDENT") {
    return "/portal/student";
  }
  return "/dashboard";
}
