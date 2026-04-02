import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";

export async function StudentsListPage() {
  const session = await getCurrentSession();
  const students = session
    ? await prisma.student.findMany({
        where: { sessionId: session.id, isActive: true },
        include: {
          section: { include: { class: true } },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      })
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Student list</CardTitle>
          <CardDescription>
            {session
              ? `Session ${session.name} · ${students.length} active student(s)`
              : "No session"}
          </CardDescription>
        </div>
        <Link
          href="/students/archived"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View archived
        </Link>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">Configure Master → Sessions first.</p>
        ) : students.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No active students. Seed demo data or complete admissions workflow.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission no.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class / section</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">
                      {s.admissionNo ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {[s.firstName, s.lastName].filter(Boolean).join(" ")}
                    </TableCell>
                    <TableCell>
                      {s.section
                        ? `${s.section.class.name} ${s.section.name}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {s.gender ? <Badge variant="secondary">{s.gender}</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/students/profile?id=${s.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Profile
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
