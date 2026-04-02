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

type ReportsFocus =
  | "admissions"
  | "students"
  | "fees"
  | "attendance"
  | "exams"
  | "ai-mis";

const REPORT_META: Record<
  ReportsFocus,
  {
    title: string;
    description: string;
    highlight: string;
  }
> = {
  admissions: {
    title: "Admission Reports",
    description:
      "Conversion funnel, follow-up workload, and new-admission signals for management review.",
    highlight: "Admissions funnel and lead conversion",
  },
  students: {
    title: "Student Reports",
    description:
      "Student base, section spread, recent admissions, and active-vs-archived operational view.",
    highlight: "Student distribution and active roll strength",
  },
  fees: {
    title: "Fee Reports",
    description:
      "Collection, defaulter, and daily/monthly payment visibility for accounts and management.",
    highlight: "Collection health and pending payment load",
  },
  attendance: {
    title: "Attendance Reports",
    description:
      "Attendance exceptions, low-attendance warning counts, and risk patterns across the session.",
    highlight: "Attendance alert load and absence trends",
  },
  exams: {
    title: "Exam Reports",
    description:
      "Latest exam participation, weak-student volume, and performance signals for academic review.",
    highlight: "Latest exam performance snapshot",
  },
  "ai-mis": {
    title: "AI MIS Summary",
    description:
      "Management-ready summary of AI-assisted action queues across admissions, academics, parent outreach, and automation.",
    highlight: "Cross-module AI and automation readiness",
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

export async function ReportsMisPage({
  focus = "ai-mis",
}: {
  focus?: ReportsFocus;
}) {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const meta = REPORT_META[focus];
  const today = parseUtcDate(localCalendarYmd());
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  const nextThirtyDays = new Date(today);
  nextThirtyDays.setUTCDate(nextThirtyDays.getUTCDate() + 30);
  const monthStart = new Date(today);
  monthStart.setUTCDate(1);

  const [
    studentTotal,
    activeStudentTotal,
    archivedStudentTotal,
    enquiriesTotal,
    enquiriesPendingFollowUp,
    admissionsByStatus,
    onlineLeadsTotal,
    campaignsTotal,
    paymentTodayAgg,
    paymentMonthAgg,
    defaulterCount,
    absentGroups,
    recentAdmissions,
    latestExam,
    smartContentActivityCount,
    contentUsageCount,
    payrollDrafts,
    expiringVehicleDocs,
    expiringDriverDocs,
    sectionRollup,
  ] = await Promise.all([
    prisma.student.count({ where: { sessionId: session.id } }),
    prisma.student.count({ where: { sessionId: session.id, isActive: true } }),
    prisma.student.count({ where: { sessionId: session.id, isActive: false } }),
    prisma.enquiry.count({ where: { sessionId: session.id } }),
    prisma.enquiry.count({
      where: { sessionId: session.id, nextFollowUp: { lte: today } },
    }),
    prisma.admission.groupBy({
      by: ["status"],
      where: { sessionId: session.id },
      _count: { _all: true },
    }),
    prisma.onlineLead.count({ where: { sessionId: session.id } }),
    prisma.campaignTracking.count({ where: { sessionId: session.id } }),
    prisma.feeTransaction.aggregate({
      where: { type: "PAYMENT", paidAt: { gte: startOfToday } },
      _sum: { amount: true },
    }),
    prisma.feeTransaction.aggregate({
      where: {
        type: "PAYMENT",
        paidAt: { gte: monthStart },
        student: { sessionId: session.id },
      },
      _sum: { amount: true },
    }),
    prisma.student.count({
      where: {
        sessionId: session.id,
        isActive: true,
        feeTxns: { none: { type: "PAYMENT" } },
      },
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
    prisma.admission.findMany({
      where: {
        sessionId: session.id,
        status: "ADMITTED",
        updatedAt: { gte: thirtyDaysAgo },
      },
      include: {
        student: {
          include: { section: { include: { class: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.exam.findFirst({
      where: { sessionId: session.id },
      orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
      include: { marks: true },
    }),
    prisma.studentContentActivity.count({
      where: { sessionId: session.id, occurredAt: { gte: thirtyDaysAgo, lte: today } },
    }),
    prisma.contentUsage.count({
      where: { sessionId: session.id, usedAt: { gte: thirtyDaysAgo, lte: today } },
    }),
    prisma.payrollRun.count({
      where: { sessionId: session.id, status: "DRAFT" },
    }),
    prisma.vehicleDocument.count({
      where: { expiresOn: { gte: today, lte: nextThirtyDays } },
    }),
    prisma.driverDocument.count({
      where: { expiresOn: { gte: today, lte: nextThirtyDays } },
    }),
    prisma.section.findMany({
      where: { class: { sessionId: session.id } },
      include: {
        class: true,
        students: {
          where: { isActive: true },
          select: { id: true },
        },
      },
      orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
      take: 12,
    }),
  ]);

  const admissionsMap = new Map(
    admissionsByStatus.map((row) => [row.status, row._count._all]),
  );
  const lowAttendanceCount = absentGroups.filter((row) => row._count._all >= 2).length;

  let weakStudents = 0;
  let examAverage = 0;
  if (latestExam) {
    const byStudent = new Map<string, { sumGot: number; sumMax: number }>();
    for (const row of latestExam.marks) {
      const max = Number(row.maxMarks);
      const got = Number(row.marksObtained);
      if (max <= 0) continue;
      const current = byStudent.get(row.studentId) ?? { sumGot: 0, sumMax: 0 };
      current.sumGot += got;
      current.sumMax += max;
      byStudent.set(row.studentId, current);
    }
    const percentages = [...byStudent.values()]
      .filter((row) => row.sumMax > 0)
      .map((row) => (row.sumGot / row.sumMax) * 100);
    weakStudents = percentages.filter((pct) => pct < 40).length;
    examAverage =
      percentages.length > 0
        ? percentages.reduce((sum, pct) => sum + pct, 0) / percentages.length
        : 0;
  }

  const stats = [
    { label: "Active students", value: String(activeStudentTotal) },
    { label: "Enquiries", value: String(enquiriesTotal) },
    {
      label: "Monthly collection",
      value: `₹${Number(paymentMonthAgg._sum.amount ?? 0).toFixed(0)}`,
    },
    { label: "Low attendance alerts", value: String(lowAttendanceCount) },
  ];

  const modules = [
    {
      name: "Admissions",
      summary: `${enquiriesTotal} enquiries, ${enquiriesPendingFollowUp} due follow-ups, ${admissionsMap.get("ADMITTED") ?? 0} admitted`,
      href: "/reports/admissions",
      active: focus === "admissions" || focus === "ai-mis",
    },
    {
      name: "Students",
      summary: `${activeStudentTotal} active, ${archivedStudentTotal} inactive, ${sectionRollup.length} tracked sections`,
      href: "/reports/students",
      active: focus === "students" || focus === "ai-mis",
    },
    {
      name: "Fees",
      summary: `₹${Number(paymentTodayAgg._sum.amount ?? 0).toFixed(0)} today, ${defaulterCount} defaulters`,
      href: "/reports/fees",
      active: focus === "fees" || focus === "ai-mis",
    },
    {
      name: "Attendance",
      summary: `${lowAttendanceCount} low-attendance cases in 14 days`,
      href: "/reports/attendance",
      active: focus === "attendance" || focus === "ai-mis",
    },
    {
      name: "Exams",
      summary: `${weakStudents} weak students, ${examAverage.toFixed(1)}% average in latest exam`,
      href: "/reports/exams",
      active: focus === "exams" || focus === "ai-mis",
    },
    {
      name: "AI / Automation",
      summary: `${smartContentActivityCount} student AI interactions, ${payrollDrafts} payroll drafts`,
      href: "/reports/ai-mis",
      active: focus === "ai-mis",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">Session: {session.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{meta.highlight}</Badge>
          <Link
            href="/reports/ai-mis"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Full MIS view
          </Link>
          <Link
            href="/settings/audit-logs"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Audit logs
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Cross-module management summary</CardTitle>
            <CardDescription>
              The strongest live signals from the synced blueprint modules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {modules.map((module) => (
              <div
                key={module.name}
                className={cn(
                  "rounded-xl border p-4",
                  module.active ? "border-primary/40 bg-muted/30" : "",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{module.name}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{module.summary}</p>
                  </div>
                  <Link
                    href={module.href}
                    className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admission funnel snapshot</CardTitle>
            <CardDescription>
              Strict pipeline view aligned to enquiry → follow-up → registration → document → fee → final admission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FunnelRow label="Enquiries" value={enquiriesTotal} />
            <FunnelRow label="Pending follow-up" value={enquiriesPendingFollowUp} />
            <FunnelRow label="Registered" value={admissionsMap.get("REGISTERED") ?? 0} />
            <FunnelRow label="Pending review" value={admissionsMap.get("PENDING_REVIEW") ?? 0} />
            <FunnelRow label="Approved" value={admissionsMap.get("APPROVED") ?? 0} />
            <FunnelRow label="Admitted" value={admissionsMap.get("ADMITTED") ?? 0} />
            <FunnelRow label="Rejected / waitlist" value={(admissionsMap.get("REJECTED") ?? 0) + (admissionsMap.get("WAITLIST") ?? 0)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Operational exception table</CardTitle>
            <CardDescription>
              High-signal queues that can drive management reviews and automation runs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <ReportRow
                    label="Enquiries due for follow-up"
                    count={enquiriesPendingFollowUp}
                    source="Admissions CRM"
                    href="/admissions/follow-up"
                  />
                  <ReportRow
                    label="Students with no fee payment"
                    count={defaulterCount}
                    source="Fees"
                    href="/fees/defaulters"
                  />
                  <ReportRow
                    label="Low attendance alerts"
                    count={lowAttendanceCount}
                    source="Attendance"
                    href="/attendance/alerts"
                  />
                  <ReportRow
                    label="Weak students in latest exam"
                    count={weakStudents}
                    source="Exams / AI"
                    href="/exams/weak-students"
                  />
                  <ReportRow
                    label="Online leads tracked"
                    count={onlineLeadsTotal}
                    source="Marketing"
                    href="/admissions/online-leads"
                  />
                  <ReportRow
                    label="Compliance expiries due soon"
                    count={expiringVehicleDocs + expiringDriverDocs}
                    source="Transport"
                    href="/transport/compliance"
                  />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent admission movement</CardTitle>
            <CardDescription>
              Students admitted in the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAdmissions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent admissions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAdmissions.map((admission) => {
                      const student = admission.student;
                      const studentName = student
                        ? [student.firstName, student.lastName].filter(Boolean).join(" ")
                        : admission.draftFirstName ?? "Draft";
                      const sectionLabel = student?.section
                        ? `${student.section.class.name} ${student.section.name}`
                        : "—";
                      return (
                        <TableRow key={admission.id}>
                          <TableCell className="font-medium">{studentName}</TableCell>
                          <TableCell>{sectionLabel}</TableCell>
                          <TableCell className="text-sm">
                            {admission.updatedAt.toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Section roll strength</CardTitle>
            <CardDescription>
              Active-student distribution across sections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Active students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionRollup.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell className="font-medium">
                        {section.class.name} {section.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {section.students.length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI and automation readiness</CardTitle>
            <CardDescription>
              Signals already available for management summaries and future scheduled jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AiSignalRow label="Campaigns tracked" value={campaignsTotal} />
            <AiSignalRow label="Student content activity (30d)" value={smartContentActivityCount} />
            <AiSignalRow label="Teacher content usage (30d)" value={contentUsageCount} />
            <AiSignalRow label="Draft payroll runs" value={payrollDrafts} />
            <AiSignalRow
              label="Transport compliance alerts"
              value={expiringVehicleDocs + expiringDriverDocs}
            />
            <AiSignalRow label="Total student base" value={studentTotal} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FunnelRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function ReportRow({
  label,
  count,
  source,
  href,
}: {
  label: string;
  count: number;
  source: string;
  href: string;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right tabular-nums">{count}</TableCell>
      <TableCell>{source}</TableCell>
      <TableCell>
        <Link
          href={href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Open
        </Link>
      </TableCell>
    </TableRow>
  );
}

function AiSignalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}
