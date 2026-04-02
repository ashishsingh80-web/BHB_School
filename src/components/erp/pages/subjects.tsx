import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { createSubject } from "@/app/(erp)/actions/master";
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

export async function SubjectsPage() {
  const session = await getCurrentSession();
  const subjects = session
    ? await prisma.subject.findMany({
        where: { sessionId: session.id },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Add subject</CardTitle>
          <CardDescription>Session-scoped subject master (CBSE-aligned).</CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <form action={createSubject} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code (optional)</Label>
                <Input id="code" name="code" placeholder="MAT" />
              </div>
              <Button type="submit" className="w-fit">
                Add subject
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">Create a session first.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.code ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
