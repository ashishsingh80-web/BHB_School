import Link from "next/link";

import { setAdmissionDecision } from "@/app/(erp)/actions/admissions";
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

export async function AdmissionsPendingDocumentsPage() {
  const session = await getCurrentSession();

  const rows = session
    ? await prisma.admission.findMany({
        where: {
          sessionId: session.id,
          status: { in: ["REGISTERED", "PENDING_REVIEW"] },
        },
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
        <CardTitle>Review queue</CardTitle>
        <CardDescription>
          Draft registrations and applications submitted for review (documents / verification).
          Approve, waitlist, or reject from here when status is{" "}
          <Badge variant="outline" className="mx-1">
            PENDING_REVIEW
          </Badge>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No academic session.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing in the queue.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Parent / phone</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[280px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.draftFirstName ?? a.enquiry?.childName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{a.enquiry?.parentName ?? "—"}</div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {a.enquiry?.phone ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.proposedSection
                        ? `${a.proposedSection.class.name} ${a.proposedSection.name}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/admissions/admission-form?admissionId=${a.id}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                        >
                          Open form
                        </Link>
                        {a.status === "PENDING_REVIEW" ? (
                          <div className="flex flex-wrap gap-1">
                            <form action={setAdmissionDecision}>
                              <input type="hidden" name="admissionId" value={a.id} />
                              <input type="hidden" name="decision" value="APPROVED" />
                              <Button type="submit" size="sm" variant="default" className="h-8">
                                Approve
                              </Button>
                            </form>
                            <form action={setAdmissionDecision}>
                              <input type="hidden" name="admissionId" value={a.id} />
                              <input type="hidden" name="decision" value="WAITLIST" />
                              <Button type="submit" size="sm" variant="secondary" className="h-8">
                                Waitlist
                              </Button>
                            </form>
                            <form action={setAdmissionDecision}>
                              <input type="hidden" name="admissionId" value={a.id} />
                              <input type="hidden" name="decision" value="REJECTED" />
                              <Button type="submit" size="sm" variant="ghost" className="text-destructive h-8">
                                Reject
                              </Button>
                            </form>
                          </div>
                        ) : null}
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
