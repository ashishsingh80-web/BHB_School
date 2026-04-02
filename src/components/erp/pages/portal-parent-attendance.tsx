import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
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
import { getParentPortalContext, parentCanViewStudent } from "@/lib/parent-portal";
import { prisma } from "@/lib/prisma";

type Props = { studentId?: string; basePath?: string };

export async function PortalParentAttendancePage({
  studentId,
  basePath = "/portal/parent",
}: Props) {
  const ctx = await getParentPortalContext();
  const portalHomeLabel =
    basePath === "/portal/student" ? "student portal" : "parent home";

  if (!ctx) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>
            <Link
              href={basePath}
              className="text-primary text-sm underline-offset-4 hover:underline"
            >
              Open {portalHomeLabel}
            </Link>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!studentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>Select a student from the portal home.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={basePath} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Back
          </Link>
        </CardContent>
      </Card>
    );
  }

  const allowed = await parentCanViewStudent(ctx.parentId, studentId);
  if (!allowed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not available</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { firstName: true, lastName: true },
  });

  const rows = await prisma.studentAttendance.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
    take: 90,
  });

  const backLabel = basePath === "/portal/student" ? "← Student portal" : "← Parent home";

  return (
    <div className="space-y-6">
      <Link href={basePath} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        {backLabel}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            Attendance · {[student?.firstName, student?.lastName].filter(Boolean).join(" ")}
          </CardTitle>
          <CardDescription>Last {rows.length} day(s) on file</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendance marks yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {r.date.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">{r.status}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.remarks ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
