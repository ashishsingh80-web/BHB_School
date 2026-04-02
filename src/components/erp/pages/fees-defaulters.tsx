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

/** V1: students with no PAYMENT transactions yet (strict; refine with fee structure later). */
export async function FeesDefaultersPage() {
  const session = await getCurrentSession();
  if (!session) {
    return (
      <p className="text-muted-foreground text-sm">No session configured.</p>
    );
  }

  const active = await prisma.student.findMany({
    where: { sessionId: session.id, isActive: true },
    include: { section: { include: { class: true } } },
    orderBy: [{ firstName: "asc" }],
  });

  const paidGroups = await prisma.feeTransaction.groupBy({
    by: ["studentId"],
    where: {
      type: "PAYMENT",
      student: { sessionId: session.id },
    },
  });
  const paidStudentIds = new Set(paidGroups.map((g) => g.studentId));

  const defaulters = active.filter((s) => !paidStudentIds.has(s.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defaulter list (v1)</CardTitle>
        <CardDescription>
          Active students who have <strong>no fee payment</strong> recorded yet. This is a
          simple rule; later we can compare against annual fee structure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {defaulters.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Every active student has at least one payment — or there are no students.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission no.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaulters.map((s) => (
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
                        href={`/fees/collect`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Collect
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
