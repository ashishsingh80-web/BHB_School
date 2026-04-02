import { prisma } from "@/lib/prisma";
import {
  createAcademicSession,
  setCurrentSession,
} from "@/app/(erp)/actions/master";
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
import { Badge } from "@/components/ui/badge";

export async function SessionsPage() {
  const sessions = await prisma.academicSession.findMany({
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-8">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Add session</CardTitle>
          <CardDescription>
            Academic year boundaries for enquiry, admissions, and reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAcademicSession} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="name">Session name</Label>
              <Input id="name" name="name" placeholder="2026-27" required />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start</Label>
                <Input id="startDate" name="startDate" type="date" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End</Label>
                <Input id="endDate" name="endDate" type="date" required />
              </div>
            </div>
            <Button type="submit" className="w-fit">
              Create session
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Mark one session as current for new operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="w-[140px]">Current</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.startDate.toLocaleDateString()}</TableCell>
                  <TableCell>{s.endDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    {s.isCurrent ? (
                      <Badge>Current</Badge>
                    ) : (
                      <form action={setCurrentSession} className="inline">
                        <input type="hidden" name="sessionId" value={s.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Set current
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              No sessions yet. Run <code className="font-mono">npm run db:seed</code> or
              create one above.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
