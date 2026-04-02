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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { cn } from "@/lib/utils";

export async function AdmissionsAdmissionFeePage() {
  const session = await getCurrentSession();

  const rows = session
    ? await prisma.admission.findMany({
        where: {
          sessionId: session.id,
          status: { in: ["REGISTERED", "PENDING_REVIEW", "APPROVED"] },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          enquiry: true,
          proposedSection: { include: { class: true } },
          feePayments: { orderBy: { paidAt: "desc" } },
        },
      })
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admission fee</CardTitle>
        <CardDescription>
          Step 5 of the admission pipeline. Record registration or admission fee before the final
          admission step. This queue includes applications from draft through approved state until
          they become students.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No academic session.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No admissions waiting on fee workflow.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fee status</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="w-[180px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const totalPaid = row.feePayments.reduce(
                    (sum, payment) => sum + Number(payment.amount),
                    0,
                  );
                  const latest = row.feePayments[0] ?? null;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {[row.draftFirstName, row.draftLastName].filter(Boolean).join(" ") ||
                          row.enquiry?.childName ||
                          "—"}
                      </TableCell>
                      <TableCell>
                        {row.proposedSection
                          ? `${row.proposedSection.class.name} ${row.proposedSection.name}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {latest ? (
                          <div className="text-sm">
                            <Badge variant={latest.isFull ? "secondary" : "outline"}>
                              {latest.isFull ? "Full paid" : "Partial paid"}
                            </Badge>
                            <div className="text-muted-foreground mt-1 text-xs">
                              {latest.paidAt.toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        ₹{totalPaid.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admissions/admission-form?admissionId=${row.id}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                        >
                          Open fee form
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
