import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { gradeLabelForPercent } from "@/lib/grades";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";

type Props = {
  examId: string | undefined;
  studentId: string | undefined;
};

export async function ExamsReportCardPage({ examId, studentId }: Props) {
  const session = await getCurrentSession();

  const exams = session
    ? await prisma.exam.findMany({
        where: { sessionId: session.id },
        orderBy: { examDate: "desc" },
      })
    : [];

  const students = session
    ? await prisma.student.findMany({
        where: { sessionId: session.id, isActive: true },
        include: { section: { include: { class: true } } },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      })
    : [];

  const bands = session
    ? await prisma.gradeBand.findMany({
        where: { sessionId: session.id },
      })
    : [];

  const selectedExamId = examId ?? exams[0]?.id;
  const selectedStudentId = studentId ?? students[0]?.id;

  const marks =
    session && selectedExamId && selectedStudentId
      ? await prisma.mark.findMany({
          where: { examId: selectedExamId, studentId: selectedStudentId },
          include: { subject: true, exam: true },
          orderBy: { subject: { name: "asc" } },
        })
      : [];

  const studentRow = students.find((s) => s.id === selectedStudentId);
  let sumGot = 0;
  let sumMax = 0;
  for (const m of marks) {
    sumGot += Number(m.marksObtained);
    sumMax += Number(m.maxMarks);
  }
  const overallPct = sumMax > 0 ? (sumGot / sumMax) * 100 : null;
  const overallGrade =
    overallPct != null ? gradeLabelForPercent(overallPct, bands) : "—";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report card</CardTitle>
          <CardDescription>
            Per-exam marks with percentage and grade from{" "}
            <Link href="/exams/grade-rules" className="text-primary underline">
              Grade rules
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : exams.length === 0 || students.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Need at least one exam and one active student (with marks entry).
            </p>
          ) : (
            <>
              <form className="flex flex-wrap items-end gap-4" method="get" action="/exams/report-card">
                <div className="grid gap-2">
                  <Label htmlFor="pick-exam">Exam</Label>
                  <select
                    id="pick-exam"
                    name="examId"
                    defaultValue={selectedExamId ?? ""}
                    className="border-input bg-background h-9 min-w-[220px] rounded-md border px-3 text-sm"
                  >
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pick-student">Student</Label>
                  <select
                    id="pick-student"
                    name="studentId"
                    defaultValue={selectedStudentId ?? ""}
                    className="border-input bg-background h-9 min-w-[260px] rounded-md border px-3 text-sm"
                  >
                    {students.map((s) => {
                      const sec = s.section
                        ? `${s.section.class.name} ${s.section.name}`
                        : "No section";
                      const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
                      return (
                        <option key={s.id} value={s.id}>
                          {name} · {sec}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <Button type="submit" variant="secondary">
                  Load
                </Button>
              </form>

              {studentRow ? (
                <div className="text-sm">
                  <p className="font-medium">
                    {[studentRow.firstName, studentRow.lastName].filter(Boolean).join(" ")}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {studentRow.admissionNo ?? "—"} ·{" "}
                    {studentRow.section
                      ? `${studentRow.section.class.name} ${studentRow.section.name}`
                      : "—"}
                  </p>
                </div>
              ) : null}

              {marks.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No marks for this student in this exam. Use Marks entry to add scores.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Marks</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marks.map((m) => {
                        const max = Number(m.maxMarks);
                        const got = Number(m.marksObtained);
                        const pct = max > 0 ? (got / max) * 100 : 0;
                        const g = gradeLabelForPercent(pct, bands);
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.subject.name}</TableCell>
                            <TableCell className="text-right font-mono text-sm tabular-nums">
                              {got} / {max}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {pct.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right">{g}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <div className="bg-muted/40 flex flex-wrap items-baseline justify-end gap-4 rounded-lg border p-4 text-sm">
                    <span className="text-muted-foreground">Overall</span>
                    <span className="font-mono tabular-nums">
                      {sumGot.toFixed(1)} / {sumMax.toFixed(1)}
                    </span>
                    <span className="tabular-nums">
                      {overallPct != null ? `${overallPct.toFixed(1)}%` : "—"}
                    </span>
                    <span className="text-lg font-semibold">{overallGrade}</span>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
