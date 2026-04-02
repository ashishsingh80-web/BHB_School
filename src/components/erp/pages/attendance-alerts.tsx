import Link from "next/link";

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
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";

function localYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateUtc(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Students with 2+ ABSENT marks in the last 14 calendar days (rolling). */
export async function AttendanceAlertsPage() {
  const session = await getCurrentSession();
  const end = parseDateUtc(localYmd());
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 13);

  if (!session) {
    return (
      <p className="text-muted-foreground text-sm">No academic session.</p>
    );
  }

  const absentGroups = await prisma.studentAttendance.groupBy({
    by: ["studentId"],
    where: {
      status: "ABSENT",
      date: { gte: start, lte: end },
      student: { sessionId: session.id, isActive: true },
    },
    _count: { _all: true },
  });

  const flagged = absentGroups.filter((g) => g._count._all >= 2);
  const students =
    flagged.length > 0
      ? await prisma.student.findMany({
          where: { id: { in: flagged.map((f) => f.studentId) } },
          include: { section: { include: { class: true } } },
        })
      : [];

  const byId = new Map(students.map((s) => [s.id, s]));
  const rows = flagged
    .map((f) => ({ student: byId.get(f.studentId), count: f._count._all }))
    .filter((r): r is { student: NonNullable<typeof r.student>; count: number } => !!r.student)
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Low attendance alert (v1)</CardTitle>
        <CardDescription>
          Active students with <strong>2 or more absent</strong> marks in the last 14
          days. Tune thresholds and notifications in a later sprint.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No students match this rule right now.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Absents (14d)</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ student: s, count }) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {[s.firstName, s.lastName].filter(Boolean).join(" ")}
                  </TableCell>
                  <TableCell>
                    {s.section
                      ? `${s.section.class.name} ${s.section.name}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {count}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={
                        s.sectionId
                          ? `/attendance/students?sectionId=${s.sectionId}&date=${localYmd()}`
                          : `/attendance/students?date=${localYmd()}`
                      }
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Mark
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
