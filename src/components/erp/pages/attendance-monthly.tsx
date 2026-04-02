import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

function currentMonthYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return { start, end };
}

type Props = { month: string | undefined };

export async function AttendanceMonthlyPage({ month }: Props) {
  const session = await getCurrentSession();
  const monthVal =
    month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonthYmd();
  const { start, end } = monthRange(monthVal);

  const students = session
    ? await prisma.student.findMany({
        where: { sessionId: session.id, isActive: true },
        include: { section: { include: { class: true } } },
        orderBy: [{ firstName: "asc" }],
      })
    : [];

  const records =
    session && students.length
      ? await prisma.studentAttendance.findMany({
          where: {
            date: { gte: start, lte: end },
            studentId: { in: students.map((s) => s.id) },
          },
        })
      : [];

  const counts = new Map<
    string,
    { PRESENT: number; ABSENT: number; LATE: number; HALF_DAY: number; ON_LEAVE: number }
  >();

  for (const s of students) {
    counts.set(s.id, {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      HALF_DAY: 0,
      ON_LEAVE: 0,
    });
  }

  for (const r of records) {
    const c = counts.get(r.studentId);
    if (!c) continue;
    if (r.status === "PRESENT") c.PRESENT++;
    else if (r.status === "ABSENT") c.ABSENT++;
    else if (r.status === "LATE") c.LATE++;
    else if (r.status === "HALF_DAY") c.HALF_DAY++;
    else if (r.status === "ON_LEAVE") c.ON_LEAVE++;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly attendance summary</CardTitle>
        <CardDescription>
          Counts of marked days in the selected calendar month (not calendar days — only
          days with a saved mark).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!session ? (
          <p className="text-muted-foreground text-sm">No session.</p>
        ) : (
          <>
            <form className="flex flex-wrap items-end gap-4" method="get" action="/attendance/monthly">
              <div className="grid gap-2">
                <Label htmlFor="m">Month</Label>
                <input
                  id="m"
                  name="month"
                  type="month"
                  defaultValue={monthVal}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                />
              </div>
              <Button type="submit" variant="secondary">
                Apply
              </Button>
            </form>

            {students.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active students.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Absent</TableHead>
                      <TableHead className="text-right">Late</TableHead>
                      <TableHead className="text-right">Half</TableHead>
                      <TableHead className="text-right">Leave</TableHead>
                      <TableHead className="text-right">Marked days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => {
                      const c = counts.get(s.id)!;
                      const marked =
                        c.PRESENT +
                        c.ABSENT +
                        c.LATE +
                        c.HALF_DAY +
                        c.ON_LEAVE;
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {[s.firstName, s.lastName].filter(Boolean).join(" ")}
                            {s.admissionNo ? (
                              <span className="text-muted-foreground ml-1 font-mono text-xs">
                                {s.admissionNo}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {s.section
                              ? `${s.section.class.name} ${s.section.name}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.PRESENT}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.ABSENT}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.LATE}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.HALF_DAY}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.ON_LEAVE}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {marked}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
