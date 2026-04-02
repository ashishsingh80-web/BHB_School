import { createExam, deleteExam } from "@/app/(erp)/actions/exams";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export async function ExamsSetupPage() {
  const session = await getCurrentSession();
  const exams = session
    ? await prisma.exam.findMany({
        where: { sessionId: session.id },
        orderBy: { examDate: "desc" },
        include: { _count: { select: { marks: true } } },
      })
    : [];

  return (
    <div className="space-y-8">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Create exam</CardTitle>
          <CardDescription>
            Unit test, mid-term, annual — used for marks entry and reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No session.</p>
          ) : (
            <form action={createExam} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Exam name</Label>
                <Input id="name" name="name" required placeholder="e.g. UT-1 Mathematics" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="termLabel">Term / phase (optional)</Label>
                <Input id="termLabel" name="termLabel" placeholder="Term 1" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="examDate">Exam date (optional)</Label>
                <Input id="examDate" name="examDate" type="date" />
              </div>
              <Button type="submit" className="w-fit">
                Add exam
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exams this session</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="text-muted-foreground text-sm">No exams yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Marks rows</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.termLabel ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {e.examDate ? e.examDate.toISOString().slice(0, 10) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e._count.marks}
                    </TableCell>
                    <TableCell>
                      <form action={deleteExam}>
                        <input type="hidden" name="id" value={e.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                          Delete
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
