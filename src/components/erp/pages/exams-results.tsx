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

type Props = {
  examId: string | undefined;
};

export async function ExamsResultsPage({ examId }: Props) {
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
          include: { subject: true },
        })
      : [];

  const bySubject = new Map<
    string,
    { name: string; pcts: number[] }
  >();

  for (const m of marks) {
    const max = Number(m.maxMarks);
    const got = Number(m.marksObtained);
    if (max <= 0) continue;
    const pct = (got / max) * 100;
    const cur = bySubject.get(m.subjectId) ?? { name: m.subject.name, pcts: [] };
    cur.pcts.push(pct);
    bySubject.set(m.subjectId, cur);
  }

  const rows = [...bySubject.entries()].map(([subjectId, v]) => {
    const avg =
      v.pcts.length === 0
        ? 0
        : v.pcts.reduce((a, b) => a + b, 0) / v.pcts.length;
    return { subjectId, name: v.name, avg, count: v.pcts.length };
  });
  rows.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Result summary</CardTitle>
          <CardDescription>
            Average percentage per subject (across all entered marks for this exam).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : exams.length === 0 ? (
            <p className="text-muted-foreground text-sm">No exams yet.</p>
          ) : (
            <>
              <form className="flex flex-wrap items-end gap-4" method="get" action="/exams/results">
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

              {rows.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No marks entered for this exam yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Students (cells)</TableHead>
                      <TableHead className="text-right">Avg %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.subjectId}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.avg.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
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
