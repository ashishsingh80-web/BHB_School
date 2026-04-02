import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { cn } from "@/lib/utils";

type SettingsMode = "roles" | "permissions" | "system" | "integrations";

const MODE_META: Record<
  SettingsMode,
  { title: string; description: string; note: string }
> = {
  roles: {
    title: "Roles Workspace",
    description:
      "Current role distribution and linked ERP accounts, ready for tighter gating in future middleware and menu policies.",
    note: "Best for reviewing role coverage before access-control hardening.",
  },
  permissions: {
    title: "Permissions Workspace",
    description:
      "Operational permission guidance based on the roles already used across ERP modules today.",
    note: "Best for mapping who should access what before adding a full permission matrix.",
  },
  system: {
    title: "System Settings Workspace",
    description:
      "Current school/session/system health view using live profile, session, and data coverage signals.",
    note: "Best for admin sanity-checks and environment readiness.",
  },
  integrations: {
    title: "Integrations Workspace",
    description:
      "Readiness view for communication, leads, smart content, and automation integrations already implied by the current ERP slices.",
    note: "Best for planning external connectors without adding fake settings.",
  },
};

export async function SettingsWorkspacePage({ mode }: { mode: SettingsMode }) {
  const session = await getCurrentSession();
  const meta = MODE_META[mode];

  const [
    schoolProfile,
    users,
    roleGroups,
    auditCount,
    onlineLeadCount,
    campaignCount,
    smartContentCount,
    noticeCount,
    complaintCount,
  ] = await Promise.all([
    prisma.schoolProfile.findFirst({
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        staffProfile: { select: { employeeCode: true, designation: true } },
      },
      take: 200,
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.auditLog.count(),
    session ? prisma.onlineLead.count({ where: { sessionId: session.id } }) : 0,
    session ? prisma.campaignTracking.count({ where: { sessionId: session.id } }) : 0,
    session ? prisma.contentAsset.count() : 0,
    session ? prisma.schoolNotice.count({ where: { sessionId: session.id } }) : 0,
    session ? prisma.complaintTicket.count({ where: { sessionId: session.id } }) : 0,
  ]);

  const roleRows = roleGroups
    .map((row) => ({
      role: row.role,
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Users" value={String(users.length)} />
        <MetricCard title="Distinct roles" value={String(roleRows.length)} />
        <MetricCard title="Audit records" value={String(auditCount)} />
        <MetricCard title="Active session" value={session?.name ?? "No session"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{meta.note}</Badge>
          <Link href="/settings/users" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Users
          </Link>
          <Link href="/settings/audit-logs" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Audit logs
          </Link>
          <Link href="/master/school-profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            School profile
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "roles" || mode === "permissions"
                ? "Role and access view"
                : mode === "system"
                  ? "System health view"
                  : "Integration readiness"}
            </CardTitle>
            <CardDescription>
              {mode === "roles" || mode === "permissions"
                ? "Role distribution and practical access planning with the current user base."
                : mode === "system"
                  ? "School profile, session, and baseline data-health visibility."
                  : "Signals from the slices already prepared for connector work."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "roles" || mode === "permissions" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead>Practical scope</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleRows.map((row) => (
                      <TableRow key={row.role}>
                        <TableCell className="font-medium">{row.role}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {scopeForRole(row.role)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : mode === "system" ? (
              <div className="space-y-3">
                <InfoRow
                  label="School profile"
                  value={
                    schoolProfile
                      ? `${schoolProfile.name} • ${schoolProfile.board} • ${schoolProfile.city ?? "City not set"}`
                      : "School profile not configured"
                  }
                />
                <InfoRow
                  label="Academic session"
                  value={session ? `${session.name} is active` : "No active session"}
                />
                <InfoRow
                  label="Audit instrumentation"
                  value={`${auditCount} audit event(s) recorded`}
                />
                <InfoRow
                  label="Core admin accounts"
                  value={`${users.length} ERP user account(s) available`}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <InfoRow
                  label="Online lead ingestion"
                  value={`${onlineLeadCount} leads and ${campaignCount} campaigns tracked`}
                />
                <InfoRow
                  label="Communication layer"
                  value={`${noticeCount} notices and ${complaintCount} complaint tickets available`}
                />
                <InfoRow
                  label="Smart content"
                  value={`${smartContentCount} content asset(s) available for future provider integrations`}
                />
                <InfoRow
                  label="Automation anchor"
                  value="AI, reports, communication, and payroll slices now expose queue-ready signals"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "roles"
                ? "User detail"
                : mode === "permissions"
                  ? "Permission notes"
                  : mode === "system"
                    ? "System notes"
                    : "Connector notes"}
            </CardTitle>
            <CardDescription>
              {mode === "roles"
                ? "Current ERP accounts and their staff links."
                : "Implementation notes for the next access-control or integration layer."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "roles" ? (
              users.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Staff link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                          <TableCell className="text-sm">{user.email ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.role}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {user.staffProfile?.employeeCode ?? "—"}
                            {user.staffProfile?.designation ? (
                              <span className="text-muted-foreground block">
                                {user.staffProfile.designation}
                              </span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (
              <div className="space-y-3 text-sm">
                {notesForMode(mode).map((text) => (
                  <PromptBlock key={text} text={text} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function scopeForRole(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
    case "MANAGEMENT":
      return "Cross-module control, reports, settings, and approvals.";
    case "PRINCIPAL":
      return "Academic oversight, reports, communication, and approvals.";
    case "OFFICE_ADMIN":
    case "RECEPTION":
      return "Admissions desk, front office, communication, and documents.";
    case "ADMISSION_DESK":
      return "Enquiry intake, follow-up, registration, and final admission routing.";
    case "ACCOUNTS":
      return "Fees, expenses, staff advances, and payroll-related finance checks.";
    case "TEACHER":
    case "CLASS_TEACHER":
      return "Academics, attendance, homework, exams, and timetable-facing workflows.";
    case "TRANSPORT_MANAGER":
      return "Routes, mapping, vehicles, compliance, fuel, and transport fees.";
    case "HR_ADMIN":
      return "Staff directory, payroll, and linked account governance.";
    case "PARENT":
    case "STUDENT":
      return "Portal-only view after full access gating is enforced.";
    default:
      return "General ERP access pending tighter permission mapping.";
  }
}

function notesForMode(mode: Exclude<SettingsMode, "roles">) {
  switch (mode) {
    case "permissions":
      return [
        "Current role values already support a real permission matrix; the next step is enforcing them in navigation and server actions.",
        "Users and audit logs give enough visibility to start access hardening safely.",
        "A dedicated permission table is optional; static policy mapping by role would already be a big improvement.",
      ];
    case "system":
      return [
        "Use school profile plus academic session as the current baseline system settings surface.",
        "This route is a good place to add env/config diagnostics once you want deeper deployment checks.",
        "System-wide toggles can later be stored separately without replacing this health view.",
      ];
    case "integrations":
      return [
        "Admissions webhook, communication workspaces, smart content, and AI automation now give this route real integration context.",
        "The next step can add provider credentials and webhook status panels for channels like WhatsApp, email, or content providers.",
        "Keep connector state here, while letting operational queues remain inside their domain modules.",
      ];
  }
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground mt-1 text-sm">{value}</p>
    </div>
  );
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}
