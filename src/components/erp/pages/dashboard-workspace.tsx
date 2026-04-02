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

type DashboardMode = "ai-summary" | "alerts" | "activity";

const MODE_META: Record<
  DashboardMode,
  { title: string; description: string; note: string }
> = {
  "ai-summary": {
    title: "AI Summary",
    description:
      "Cross-module AI and workflow signals from admissions, academics, parent outreach, automation, and reports.",
    note: "Best for management-level prioritization.",
  },
  alerts: {
    title: "Alerts and Tasks",
    description:
      "Exception queues that need action now across admissions, attendance, fees, transport, and payroll.",
    note: "Best for office follow-up and daily review.",
  },
  activity: {
    title: "Recent Activity",
    description:
      "Recent operational events drawn from audits, notices, complaints, and follow-up logs.",
    note: "Best for understanding what changed recently.",
  },
};

function localCalendarYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseUtcDate(ymd: string) {
  const [y, mo, da] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, da));
}

export async function DashboardWorkspacePage({ mode }: { mode: DashboardMode }) {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const meta = MODE_META[mode];
  const today = parseUtcDate(localCalendarYmd());
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const nextThirtyDays = new Date(today);
  nextThirtyDays.setUTCDate(nextThirtyDays.getUTCDate() + 30);

  const [
    enquiriesDue,
    lowAttendanceGroups,
    defaulterCount,
    pendingAdmissions,
    onlineLeadCount,
    smartContentActivityCount,
    payrollDraftCount,
    transportExpiryCount,
    notices,
    complaints,
    followUpEvents,
    auditLogs,
  ] = await Promise.all([
    prisma.enquiry.count({
      where: { sessionId: session.id, nextFollowUp: { lte: today } },
    }),
    prisma.studentAttendance.groupBy({
      by: ["studentId"],
      where: {
        status: "ABSENT",
        date: { gte: fourteenDaysAgo, lte: today },
        student: { sessionId: session.id, isActive: true },
      },
      _count: { _all: true },
    }),
    prisma.student.count({
      where: {
        sessionId: session.id,
        isActive: true,
        feeTxns: { none: { type: "PAYMENT" } },
      },
    }),
    prisma.admission.count({
      where: {
        sessionId: session.id,
        status: { in: ["REGISTERED", "PENDING_REVIEW", "APPROVED"] },
      },
    }),
    prisma.onlineLead.count({ where: { sessionId: session.id } }),
    prisma.studentContentActivity.count({
      where: { sessionId: session.id, occurredAt: { gte: sevenDaysAgo, lte: today } },
    }),
    prisma.payrollRun.count({
      where: { sessionId: session.id, status: "DRAFT" },
    }),
    Promise.all([
      prisma.vehicleDocument.count({
        where: { expiresOn: { gte: today, lte: nextThirtyDays } },
      }),
      prisma.driverDocument.count({
        where: { expiresOn: { gte: today, lte: nextThirtyDays } },
      }),
    ]).then(([vehicle, driver]) => vehicle + driver),
    prisma.schoolNotice.findMany({
      where: { sessionId: session.id },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.complaintTicket.findMany({
      where: { sessionId: session.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.enquiryFollowUp.findMany({
      where: {
        enquiry: { sessionId: session.id },
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        enquiry: true,
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const lowAttendanceCount = lowAttendanceGroups.filter((row) => row._count._all >= 2).length;

  const aiRows = [
    {
      label: "Admissions follow-up pressure",
      value: enquiriesDue,
      href: "/ai/automation",
      note: "Enquiries due for follow-up today or earlier.",
    },
    {
      label: "Student AI engagement",
      value: smartContentActivityCount,
      href: "/ai/student",
      note: "Student content activity logs in the last 7 days.",
    },
    {
      label: "Marketing lead volume",
      value: onlineLeadCount,
      href: "/admissions/online-leads",
      note: "Tracked online leads in the active session.",
    },
    {
      label: "Pending admissions",
      value: pendingAdmissions,
      href: "/admissions/final-admission",
      note: "Registered, review, and approval pipeline load.",
    },
  ];

  const alertRows = [
    {
      label: "Enquiries due for follow-up",
      value: enquiriesDue,
      href: "/admissions/follow-up",
    },
    {
      label: "Low attendance alerts",
      value: lowAttendanceCount,
      href: "/attendance/alerts",
    },
    {
      label: "Fee defaulters",
      value: defaulterCount,
      href: "/fees/defaulters",
    },
    {
      label: "Transport compliance expiries",
      value: transportExpiryCount,
      href: "/transport/compliance",
    },
    {
      label: "Draft payroll runs",
      value: payrollDraftCount,
      href: "/hr/payroll",
    },
  ];

  const showAiSummary = mode === "ai-summary";
  const showAlerts = mode === "alerts";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="AI-ready queues" value={String(aiRows.reduce((sum, row) => sum + row.value, 0))} />
        <MetricCard title="Alerts" value={String(alertRows.reduce((sum, row) => sum + row.value, 0))} />
        <MetricCard title="Recent notices" value={String(notices.length)} />
        <MetricCard title="Recent complaint updates" value={String(complaints.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{meta.note}</Badge>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Overview
          </Link>
          <Link href="/reports/ai-mis" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            AI MIS
          </Link>
          <Link href="/communication/logs" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Communication logs
          </Link>
        </CardContent>
      </Card>

      {showAiSummary || showAlerts ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>{showAiSummary ? "AI summary queues" : "Alerts and tasks"}</CardTitle>
              <CardDescription>
                {showAiSummary
                  ? "Where the AI-assisted workflows now have the strongest signal."
                  : "Queues that need attention across the ERP today."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Queue</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead className="w-[120px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showAiSummary ? aiRows : alertRows).map((row) => {
                      const signal =
                        "note" in row && typeof row.note === "string"
                          ? row.note
                          : "Operational task queue";

                      return (
                        <TableRow key={row.label}>
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.value}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {signal}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={row.href}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                              Open
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{showAiSummary ? "AI-linked next steps" : "Fast action routes"}</CardTitle>
              <CardDescription>
                {showAiSummary
                  ? "Shortcuts into the modules that now have real AI or automation surfaces."
                  : "Use these routes to clear the queues above faster."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href="/ai/teacher" className={cn(buttonVariants({ variant: "secondary" }))}>
                Teacher AI
              </Link>
              <Link href="/ai/student" className={cn(buttonVariants({ variant: "secondary" }))}>
                Student AI
              </Link>
              <Link href="/ai/parent" className={cn(buttonVariants({ variant: "secondary" }))}>
                Parent AI
              </Link>
              <Link href="/ai/automation" className={cn(buttonVariants({ variant: "secondary" }))}>
                Automation Engine
              </Link>
              <Link href="/reports/ai-mis" className={cn(buttonVariants({ variant: "secondary" }))}>
                MIS Summary
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <TimelineCard
            title="Audit trail"
            rows={auditLogs.map((row) => ({
              id: row.id,
              title: `${row.action} • ${row.entity}`,
              meta: `${row.user?.name ?? row.user?.email ?? "System"} • ${row.createdAt.toLocaleString()}`,
              body: row.entityId ?? "No entity id",
            }))}
            empty="No audit activity yet."
          />
          <TimelineCard
            title="Complaint updates"
            rows={complaints.map((row) => ({
              id: row.id,
              title: row.subject,
              meta: `${row.status} • ${row.updatedAt.toLocaleString()}`,
              body: row.body,
            }))}
            empty="No complaint updates yet."
          />
          <TimelineCard
            title="Follow-up activity"
            rows={followUpEvents.map((row) => ({
              id: row.id,
              title: `${row.channel} • ${row.enquiry.childName}`,
              meta: `${row.createdBy?.name ?? row.createdBy?.email ?? "Office"} • ${row.createdAt.toLocaleString()}`,
              body: row.summary,
            }))}
            empty="No recent follow-up activity."
          />
        </div>
      )}
    </div>
  );
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

function TimelineCard({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Array<{ id: string; title: string; meta: string; body: string }>;
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-xl border p-4">
                <p className="font-medium">{row.title}</p>
                <p className="text-muted-foreground text-xs">{row.meta}</p>
                <p className="text-muted-foreground mt-2 line-clamp-4 text-sm">{row.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
