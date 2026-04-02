import { saveSectionMarks } from "@/app/(erp)/actions/exams";
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
  sectionId: string | undefined;
};

export async function ExamsMarksEntryPage({ examId, sectionId }: Props) {
  const session = await getCurrentSession();

  const exams = session
    ? await prisma.exam.findMany({
        where: { sessionId: session.id },
        orderBy: { examDate: "desc" },
      })
    : [];

  const sections = session
    ? await prisma.section.findMany({
        where: { class: { sessionId: session.id } },
        include: { class: true },
        orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
      })
    : [];

  const subjects = session
    ? await prisma.subject.findMany({
        where: { sessionId: session.id },
        orderBy: { name: "asc" },
      })
    : [];

  const selectedExamId = examId ?? exams[0]?.id;
  const selectedSectionId = sectionId ?? sections[0]?.id;

  const students =
    session && selectedSectionId
      ? await prisma.student.findMany({
          where: {
            sessionId: session.id,
            sectionId: selectedSectionId,
            isActive: true,
          },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        })
      : [];

  const existingMarks =
    selectedExamId && students.length > 0
      ? await prisma.mark.findMany({
          where: {
            examId: selectedExamId,
            studentId: { in: students.map((s) => s.id) },
          },
        })
      : [];

  const markKey = (studentId: string, subjectId: string) =>
    `${studentId}-${subjectId}`;
  const byPair = new Map(
    existingMarks.map((m) => [markKey(m.studentId, m.subjectId), m]),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marks entry</CardTitle>
          <CardDescription>
            Enter marks per student and subject. Leave blank or “—” to clear. Max marks default to 100 for new
            cells; existing rows keep their saved max.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : exams.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Create an exam under Exam Setup first.
            </p>
          ) : sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add classes and sections under Master Setup.
            </p>
          ) : (
            <>
              <form className="flex flex-wrap items-end gap-4" method="get" action="/exams/marks-entry">
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
                        {e.termLabel ? ` (${e.termLabel})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pick-section">Section</Label>
                  <select
                    id="pick-section"
                    name="sectionId"
                    defaultValue={selectedSectionId ?? ""}
                    className="border-input bg-background h-9 min-w-[200px] rounded-md border px-3 text-sm"
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.class.name} {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" variant="secondary">
                  Load
                </Button>
              </form>

              {selectedExamId && selectedSectionId && subjects.length > 0 && students.length > 0 ? (
                <form action={saveSectionMarks} className="space-y-4">
                  <input type="hidden" name="examId" value={selectedExamId} />
                  <input type="hidden" name="sectionId" value={selectedSectionId} />
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 z-10 bg-card">Student</TableHead>
                          {subjects.map((sub) => (
                            <TableHead key={sub.id} className="min-w-[88px] text-center">
                              <span className="line-clamp-2 text-xs font-normal">{sub.name}</span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="sticky left-0 z-10 bg-card font-medium">
                              <div className="max-w-[160px] truncate text-sm">
                                {[s.firstName, s.lastName].filter(Boolean).join(" ")}
                              </div>
                              <div className="text-muted-foreground font-mono text-xs">
                                {s.admissionNo ?? "—"}
                              </div>
                            </TableCell>
                            {subjects.map((sub) => {
                              const ex = byPair.get(markKey(s.id, sub.id));
                              const maxVal = ex?.maxMarks != null ? Number(ex.maxMarks) : 100;
                              const obtainedVal =
                                ex?.marksObtained != null ? String(ex.marksObtained) : "";
                              return (
                                <TableCell key={sub.id} className="p-1">
                                  <input
                                    type="hidden"
                                    name={`max__${s.id}__${sub.id}`}
                                    value={maxVal}
                                  />
                                  <input
                                    name={`obtained__${s.id}__${sub.id}`}
                                    defaultValue={obtainedVal}
                                    placeholder="—"
                                    className="border-input bg-background h-8 w-full min-w-[64px] rounded-md border px-2 text-center text-sm tabular-nums"
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button type="submit">Save marks</Button>
                </form>
              ) : selectedExamId && selectedSectionId && students.length === 0 ? (
                <p className="text-muted-foreground text-sm">No students in this section.</p>
              ) : subjects.length === 0 ? (
                <p className="text-muted-foreground text-sm">Add subjects under Master Setup.</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
