import Link from "next/link";

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

export async function StudentsArchivedPage() {
  const session = await getCurrentSession();
  const students = session
    ? await prisma.student.findMany({
        where: { sessionId: session.id, isActive: false },
        include: {
          section: { include: { class: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Archived / inactive students</CardTitle>
          <CardDescription>
            {session
              ? `Session ${session.name} · ${students.length} inactive`
              : "No session"}
          </CardDescription>
        </div>
        <Link href="/students/list" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Active list
        </Link>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">Configure sessions first.</p>
        ) : students.length === 0 ? (
          <p className="text-muted-foreground text-sm">No inactive students in this session.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission no.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Was in</TableHead>
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
