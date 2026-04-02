import Link from "next/link";

import { enrollAdmissionAsStudent } from "@/app/(erp)/actions/admissions";
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

export async function AdmissionsApprovedPage() {
  const session = await getCurrentSession();

  const rows = session
    ? await prisma.admission.findMany({
        where: { sessionId: session.id, status: "APPROVED" },
        orderBy: { updatedAt: "desc" },
        include: {
          enquiry: true,
          proposedSection: { include: { class: true } },
        },
      })
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved admissions</CardTitle>
        <CardDescription>
          Final step: create the student record and link the parent (matched by enquiry phone).
          Admission number must be unique if provided.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No academic session.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No approved applications waiting for enrollment.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Adm. no.</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[200px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {[a.draftFirstName, a.draftLastName].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell>
                      {a.proposedSection
                        ? `${a.proposedSection.class.name} ${a.proposedSection.name}`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.proposedAdmissionNo ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.enquiry?.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/admissions/admission-form?admissionId=${a.id}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                        >
                          Edit draft
                        </Link>
                        <form action={enrollAdmissionAsStudent}>
                          <input type="hidden" name="admissionId" value={a.id} />
                          <Button type="submit" size="sm">
                            Enroll student
                          </Button>
                        </form>
                      </div>
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
