import Link from "next/link";

import { enrollAdmissionAsStudent } from "@/app/(erp)/actions/admissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { cn } from "@/lib/utils";

export async function AdmissionsFinalAdmissionPage() {
  const session = await getCurrentSession();

  const rows = session
    ? await prisma.admission.findMany({
        where: { sessionId: session.id, status: "APPROVED" },
        orderBy: { updatedAt: "desc" },
        include: {
          enquiry: true,
          proposedSection: { include: { class: true } },
          feePayments: { orderBy: { paidAt: "desc" } },
          documents: {
            include: { documentType: true },
          },
        },
      })
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final admission</CardTitle>
        <CardDescription>
          Step 6 of the admission pipeline. Only approved applications with recorded fee payment
          should be enrolled as students.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No academic session.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No approved applications waiting for final admission.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead className="w-[220px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const hasFee = row.feePayments.length > 0;
                  const blockingDocs = row.documents.filter(
                    (doc) =>
                      doc.documentType?.requiredForAdmission === true &&
                      doc.status !== "VERIFIED" &&
                      doc.status !== "WAIVED",
                  );
                  const canEnroll = hasFee && blockingDocs.length === 0;

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {[row.draftFirstName, row.draftLastName].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell>
                        {row.proposedSection
                          ? `${row.proposedSection.class.name} ${row.proposedSection.name}`
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.enquiry?.phone ?? "—"}
                      </TableCell>
                      <TableCell>
                        {hasFee ? (
                          <Badge variant="secondary">Recorded</Badge>
                        ) : (
                          <Badge variant="outline">Pending fee</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {blockingDocs.length === 0 ? (
                          <Badge variant="secondary">Verified</Badge>
                        ) : (
                          <Badge variant="outline">{blockingDocs.length} blocking</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admissions/admission-form?admissionId=${row.id}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                          >
                            Open admission form
                          </Link>
                          {canEnroll ? (
                            <form action={enrollAdmissionAsStudent}>
                              <input type="hidden" name="admissionId" value={row.id} />
                              <Button type="submit" size="sm">
                                Final admit student
                              </Button>
                            </form>
                          ) : (
                            <p className="text-muted-foreground text-xs">
                              {!hasFee
                                ? "Record admission fee first."
                                : `Verify required docs: ${blockingDocs.map((d) => d.label).join(", ")}`}
                            </p>
                          )}
                        </div>
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
