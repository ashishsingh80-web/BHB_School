import type { UserRole } from "@prisma/client";

export const LEADERSHIP_ROLES = ["SUPER_ADMIN", "MANAGEMENT", "PRINCIPAL"] as const satisfies UserRole[];

export const MASTER_ACCESS_ROLES = [...LEADERSHIP_ROLES, "OFFICE_ADMIN"] as const satisfies UserRole[];

export const OFFICE_TEAM_ROLES = [
  ...MASTER_ACCESS_ROLES,
  "ADMISSION_DESK",
  "RECEPTION",
] as const satisfies UserRole[];

export const ACCOUNTS_TEAM_ROLES = [...MASTER_ACCESS_ROLES, "ACCOUNTS"] as const satisfies UserRole[];

export const ACADEMIC_TEAM_ROLES = [
  ...MASTER_ACCESS_ROLES,
  "TEACHER",
  "CLASS_TEACHER",
] as const satisfies UserRole[];

export const TRANSPORT_TEAM_ROLES = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "OFFICE_ADMIN",
  "RECEPTION",
  "TRANSPORT_MANAGER",
] as const satisfies UserRole[];

export const HR_TEAM_ROLES = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "OFFICE_ADMIN",
  "HR_ADMIN",
] as const satisfies UserRole[];

export const INTERNAL_USER_ROLES = [
  ...MASTER_ACCESS_ROLES,
  "ADMISSION_DESK",
  "ACCOUNTS",
  "TEACHER",
  "CLASS_TEACHER",
  "RECEPTION",
  "TRANSPORT_MANAGER",
  "HR_ADMIN",
] as const satisfies UserRole[];

export const INVENTORY_ACCESS_ROLES = [...OFFICE_TEAM_ROLES, "ACCOUNTS"] as const satisfies UserRole[];

export const STUDENT_ACCESS_ROLES = [...OFFICE_TEAM_ROLES, "HR_ADMIN"] as const satisfies UserRole[];

export const REPORTS_ACCESS_ROLES = [
  ...LEADERSHIP_ROLES,
  "OFFICE_ADMIN",
  "ACCOUNTS",
  "HR_ADMIN",
] as const satisfies UserRole[];

export const PORTAL_ACCESS_ROLES = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "PRINCIPAL",
  "OFFICE_ADMIN",
  "PARENT",
  "STUDENT",
] as const satisfies UserRole[];
