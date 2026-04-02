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
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";

const DEFAULT_THRESHOLD_PCT = 40;

type Props = {
  examId: string | undefined;
};

export async function ExamsWeakStudentsPage({ examId }: Props) {
  const session = await getCurrentSession();

  const exams = session
    ? await prisma.exam.findMany({
        where: { sessionId: session.id },
        orderBy: { examDate: "desc" },
      })
    : [];

  const selectedExamId = examId ?? exams[0]?.id;

  const marks =
    selectedExamId
      ? await prisma.mark.findMany({
          where: { examId: selectedExamId },
          include: {
            student: { include: { section: { include: { class: true } } } },
          },
        })
      : [];

  const byStudent = new Map<
    string,
    { student: (typeof marks)[0]["student"]; sumGot: number; sumMax: number }
  >();

  for (const m of marks) {
    const max = Number(m.maxMarks);
    const got = Number(m.marksObtained);
    if (max <= 0) continue;
    const cur = byStudent.get(m.studentId) ?? {
      student: m.student,
      sumGot: 0,
      sumMax: 0,
    };
    cur.sumGot += got;
    cur.sumMax += max;
    byStudent.set(m.studentId, cur);
  }

  const weak = [...byStudent.values()]
    .filter((r) => r.sumMax > 0 && (r.sumGot / r.sumMax) * 100 < DEFAULT_THRESHOLD_PCT)
    .map((r) => ({
      ...r,
      pct: (r.sumGot / r.sumMax) * 100,
    }))
    .sort((a, b) => a.pct - b.pct);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weak students</CardTitle>
          <CardDescription>
            Students with overall average below {DEFAULT_THRESHOLD_PCT}% for the selected exam
            (weighted by max marks across subjects with entries).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : exams.length === 0 ? (
            <p className="text-muted-foreground text-sm">No exams yet.</p>
          ) : (
            <>
              <form className="flex flex-wrap items-end gap-4" method="get" action="/exams/weak-students">
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
                <Button type="submit" variant="secondary">
                  Load
                </Button>
              </form>

              {marks.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No marks for this exam yet.
                </p>
              ) : weak.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No students below {DEFAULT_THRESHOLD_PCT}% overall for this exam.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-right">Overall %</TableHead>
                      <TableHead className="text-right">Total / Max</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weak.map((r) => {
                      const s = r.student;
                      const sec = s.section;
                      const label = sec
                        ? `${sec.class.name} ${sec.name}`
                        : "—";
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="font-medium">
                              {[s.firstName, s.lastName].filter(Boolean).join(" ")}
                            </div>
                            <div className="text-muted-foreground font-mono text-xs">
                              {s.admissionNo ?? "—"}
                            </div>
                          </TableCell>
                          <TableCell>{label}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.pct.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums">
                            {r.sumGot.toFixed(1)} / {r.sumMax.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
