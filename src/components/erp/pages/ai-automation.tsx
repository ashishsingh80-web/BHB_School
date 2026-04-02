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

export async function AiAutomationPage() {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const todayYmd = localCalendarYmd();
  const today = parseUtcDate(todayYmd);
  const next30Days = new Date(today);
  next30Days.setUTCDate(next30Days.getUTCDate() + 30);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);

  const [
    followUpsDue,
    pendingDocuments,
    defaulterCount,
    absentGroups,
    vehicleDocsExpiring,
    driverDocsExpiring,
    draftPayrollRuns,
  ] = await Promise.all([
    prisma.enquiry.count({
      where: {
        sessionId: session.id,
        nextFollowUp: { lte: today },
      },
    }),
    prisma.admissionDocument.count({
      where: {
        admission: { sessionId: session.id, status: { in: ["REGISTERED", "PENDING_REVIEW", "APPROVED"] } },
        status: "PENDING",
      },
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
    prisma.vehicleDocument.count({
      where: { expiresOn: { gte: today, lte: next30Days } },
    }),
    prisma.driverDocument.count({
      where: { expiresOn: { gte: today, lte: next30Days } },
    }),
    prisma.payrollRun.count({
      where: { sessionId: session.id, status: "DRAFT" },
    }),
  ]);

  const lowAttendanceCount = absentGroups.filter((row) => row._count._all >= 2).length;

  const rules = [
    {
      name: "Follow-up reminders",
      cadence: "Daily",
      queue: followUpsDue,
      status: followUpsDue > 0 ? "Ready" : "Quiet",
      href: "/admissions/follow-up",
      action: "Send reminder batch",
    },
    {
      name: "Missing document alerts",
      cadence: "Daily",
      queue: pendingDocuments,
      status: pendingDocuments > 0 ? "Ready" : "Quiet",
      href: "/admissions/documents",
      action: "Open document queue",
    },
    {
      name: "Fee due nudges",
      cadence: "Weekly",
      queue: defaulterCount,
      status: defaulterCount > 0 ? "Ready" : "Quiet",
      href: "/fees/defaulters",
      action: "Review defaulters",
    },
    {
      name: "Low attendance warnings",
      cadence: "Daily",
      queue: lowAttendanceCount,
      status: lowAttendanceCount > 0 ? "Ready" : "Quiet",
      href: "/attendance/alerts",
      action: "Open attendance alerts",
    },
    {
      name: "Transport compliance alerts",
      cadence: "Weekly",
      queue: vehicleDocsExpiring + driverDocsExpiring,
      status: vehicleDocsExpiring + driverDocsExpiring > 0 ? "Ready" : "Quiet",
      href: "/transport/compliance",
      action: "Check compliance",
    },
    {
      name: "Payroll review",
      cadence: "Monthly",
      queue: draftPayrollRuns,
      status: draftPayrollRuns > 0 ? "Ready" : "Quiet",
      href: "/hr/payroll",
      action: "Review payroll runs",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Follow-ups due" value={followUpsDue} />
        <StatCard title="Pending documents" value={pendingDocuments} />
        <StatCard title="Fee reminder cases" value={defaulterCount} />
        <StatCard title="Low attendance cases" value={lowAttendanceCount} />
        <StatCard title="Compliance expiries (30d)" value={vehicleDocsExpiring + driverDocsExpiring} />
        <StatCard title="Draft payroll runs" value={draftPayrollRuns} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automation engine readiness</CardTitle>
          <CardDescription>
            These rule groups match the blueprint automation layer and show where the ERP already
            has queueable reminders and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Cadence</TableHead>
                  <TableHead className="text-right">Queue size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.name}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.cadence}</TableCell>
                    <TableCell className="text-right tabular-nums">{rule.queue}</TableCell>
                    <TableCell>
                      <Badge variant={rule.queue > 0 ? "secondary" : "outline"}>{rule.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={rule.href}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        {rule.action}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blueprint-aligned automation prompts</CardTitle>
            <CardDescription>
              Good starting instructions for later WhatsApp, email, or job-run integrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PromptBlock text="Prepare today’s follow-up reminder digest for admission staff, grouped by assignee and lead temperature." />
            <PromptBlock text="Draft attendance-alert messages only for students with 2 or more absences in the last 14 days." />
            <PromptBlock text="Generate a weekly MIS summary covering enquiries, admissions, fee collection, transport compliance, and payroll status." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What this page unlocks next</CardTitle>
            <CardDescription>
              The queue signals are live already; the remaining work is delivery automation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>WhatsApp/SMS/email dispatch can be layered onto the ready queues without changing their business logic.</p>
            <p>Scheduled jobs can use these same counts and filters for daily, weekly, and monthly automation runs.</p>
            <p>Management dashboards can reuse the same rule groups for MIS and exception reporting.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}
