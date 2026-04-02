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

function describeRisk(score: number) {
  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

function suggestionFromSignals({
  lowAttendance,
  weakMarks,
  noRecentActivity,
}: {
  lowAttendance: boolean;
  weakMarks: boolean;
  noRecentActivity: boolean;
}) {
  if (lowAttendance && weakMarks) {
    return "Start a structured recovery plan with parent contact, remedial practice, and attendance follow-up.";
  }
  if (weakMarks && noRecentActivity) {
    return "Assign chapter-wise practice and one guided smart-content session this week.";
  }
  if (lowAttendance) {
    return "Check absence reasons and push a gentle restart plan before the gap widens.";
  }
  if (weakMarks) {
    return "Generate topic-level practice questions and track progress after the next test.";
  }
  return "Encourage regular content use and short practice cycles to sustain momentum.";
}

export async function AiStudentPage() {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const todayYmd = localCalendarYmd();
  const today = parseUtcDate(todayYmd);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const [students, absentGroups, latestExam, recentActivity] = await Promise.all([
    prisma.student.findMany({
      where: { sessionId: session.id, isActive: true },
      include: { section: { include: { class: true } } },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 300,
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
    prisma.exam.findFirst({
      where: { sessionId: session.id },
      orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
      include: {
        marks: true,
      },
    }),
    prisma.studentContentActivity.groupBy({
      by: ["studentId"],
      where: { sessionId: session.id, occurredAt: { gte: thirtyDaysAgo, lte: today } },
      _count: { _all: true },
    }),
  ]);

  const absenceMap = new Map(absentGroups.map((row) => [row.studentId, row._count._all]));
  const activityMap = new Map(recentActivity.map((row) => [row.studentId, row._count._all]));
  const markAgg = new Map<string, { sumGot: number; sumMax: number }>();
  for (const row of latestExam?.marks ?? []) {
    const max = Number(row.maxMarks);
    const got = Number(row.marksObtained);
    if (max <= 0) continue;
    const current = markAgg.get(row.studentId) ?? { sumGot: 0, sumMax: 0 };
    current.sumGot += got;
    current.sumMax += max;
    markAgg.set(row.studentId, current);
  }

  const rows = students
    .map((student) => {
      const absents14d = absenceMap.get(student.id) ?? 0;
      const activity30d = activityMap.get(student.id) ?? 0;
      const marks = markAgg.get(student.id);
      const percentage = marks && marks.sumMax > 0 ? (marks.sumGot / marks.sumMax) * 100 : null;
      const lowAttendance = absents14d >= 2;
      const weakMarks = percentage !== null && percentage < 40;
      const noRecentActivity = activity30d === 0;
      const riskScore =
        (lowAttendance ? 2 : 0) + (weakMarks ? 2 : 0) + (noRecentActivity ? 1 : 0);

      return {
        student,
        absents14d,
        activity30d,
        percentage,
        lowAttendance,
        weakMarks,
        noRecentActivity,
        riskScore,
      };
    })
    .filter((row) => row.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore || b.absents14d - a.absents14d)
    .slice(0, 20);

  const highRisk = rows.filter((row) => row.riskScore >= 4).length;
  const attendanceRisk = rows.filter((row) => row.lowAttendance).length;
  const practiceRisk = rows.filter((row) => row.weakMarks || row.noRecentActivity).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Students in AI queue</CardDescription>
            <CardTitle className="text-2xl">{rows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High-risk students</CardDescription>
            <CardTitle className="text-2xl">{highRisk}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attendance risk</CardDescription>
            <CardTitle className="text-2xl">{attendanceRisk}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Practice / engagement risk</CardDescription>
            <CardTitle className="text-2xl">{practiceRisk}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student AI intervention queue</CardTitle>
          <CardDescription>
            Combines low attendance, weak marks, and content inactivity into a single support list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No student AI interventions are suggested right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Signals</TableHead>
                    <TableHead className="text-right">Risk</TableHead>
                    <TableHead>AI recommendation</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const sectionLabel = row.student.section
                      ? `${row.student.section.class.name} ${row.student.section.name}`
                      : "—";
                    return (
                      <TableRow key={row.student.id}>
                        <TableCell>
                          <div className="font-medium">
                            {[row.student.firstName, row.student.lastName].filter(Boolean).join(" ")}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {row.student.admissionNo ?? "—"} • {sectionLabel}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.absents14d > 0 ? `${row.absents14d} absent in 14d` : "No attendance issue"}
                          <br />
                          {row.percentage != null ? `${row.percentage.toFixed(1)}% in latest exam` : "No exam score yet"}
                          <br />
                          {row.activity30d === 0 ? "No smart-content activity in 30d" : `${row.activity30d} activity logs in 30d`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={row.riskScore >= 4 ? "secondary" : "outline"}>
                            {describeRisk(row.riskScore)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {suggestionFromSignals(row)}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/students/profile?id=${row.student.id}`}
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
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student AI prompt starters</CardTitle>
            <CardDescription>
              Ready-made prompt ideas for practice plans and learning support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PromptBlock text="Create a 7-day practice plan for a student with low attendance and weak marks, keeping each task under 20 minutes." />
            <PromptBlock text="Explain the likely concept gaps from the latest exam in simple student-friendly language and suggest revision order." />
            <PromptBlock text="Recommend the next best smart-content activity for a student with zero usage in the last 30 days." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-through routes</CardTitle>
            <CardDescription>
              Use the operational modules to act on the AI suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/attendance/alerts" className={cn(buttonVariants({ variant: "secondary" }))}>
              Attendance alerts
            </Link>
            <Link href="/exams/weak-students" className={cn(buttonVariants({ variant: "secondary" }))}>
              Weak students
            </Link>
            <Link href="/academics/homework" className={cn(buttonVariants({ variant: "secondary" }))}>
              Homework
            </Link>
            <Link href="/academics/smart-content" className={cn(buttonVariants({ variant: "secondary" }))}>
              Smart content
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}
