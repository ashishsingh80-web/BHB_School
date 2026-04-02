import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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

export async function AdmissionsWaitlistPage() {
  const session = await getCurrentSession();

  const rows = session
    ? await prisma.admission.findMany({
        where: { sessionId: session.id, status: "WAITLIST" },
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
        <CardTitle>Waitlist</CardTitle>
        <CardDescription>
          Applications on hold. Open a row to view saved details (editing is limited until status
          is reset in the database).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No academic session.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No waitlisted applications.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.draftFirstName ?? a.enquiry?.childName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {a.proposedSection
                        ? `${a.proposedSection.class.name} ${a.proposedSection.name}`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.enquiry?.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">WAITLIST</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admissions/admission-form?admissionId=${a.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        View
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
