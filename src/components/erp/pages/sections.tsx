import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { createSection } from "@/app/(erp)/actions/master";
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

export async function SectionsPage() {
  const session = await getCurrentSession();
  const classes = session
    ? await prisma.class.findMany({
        where: { sessionId: session.id },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  const sections =
    session && classes.length
      ? await prisma.section.findMany({
          where: { classId: { in: classes.map((c) => c.id) } },
          include: { class: true },
          orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
        })
      : [];

  return (
    <div className="space-y-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Add section</CardTitle>
          <CardDescription>A, B, C… per class.</CardDescription>
        </CardHeader>
        <CardContent>
          {session && classes.length ? (
            <form action={createSection} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="classId">Class</Label>
                <select
                  id="classId"
                  name="classId"
                  required
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Section</Label>
                <Input id="name" name="name" placeholder="A" required />
              </div>
              <Button type="submit" className="w-fit">
                Add section
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">
              Need at least one class and session. Complete Master → Classes first.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>Combined view for the active session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.class.name}</TableCell>
                  <TableCell>{s.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sections.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">No sections found.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
