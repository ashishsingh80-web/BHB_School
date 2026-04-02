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

export async function PortalParentFeesPage({
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
          <CardTitle>Fees</CardTitle>
          <CardDescription>
            <Link
              href={basePath}
              className="text-primary text-sm underline-offset-4 hover:underline"
            >
              Open {portalHomeLabel}
            </Link>{" "}
            — account must match a parent email.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!studentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fees</CardTitle>
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
          <CardDescription>This student is not linked to your profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      firstName: true,
      lastName: true,
      admissionNo: true,
    },
  });

  const txns = await prisma.feeTransaction.findMany({
    where: { studentId },
    orderBy: { paidAt: "desc" },
    take: 80,
    include: { feeHead: { select: { name: true } } },
  });

  const payments = txns
    .filter((t) => t.type === "PAYMENT")
    .reduce((s, t) => s + Number(t.amount), 0);
  const charges = txns
    .filter((t) => t.type === "INVOICE" || t.type === "LATE_FEE")
    .reduce((s, t) => s + Number(t.amount), 0);
  const credits = txns
    .filter((t) => t.type === "REFUND" || t.type === "CONCESSION" || t.type === "ADJUSTMENT")
    .reduce((s, t) => s + Number(t.amount), 0);

  const backLabel = basePath === "/portal/student" ? "← Student portal" : "← Parent home";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={basePath} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {backLabel}
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            Fee activity · {[student?.firstName, student?.lastName].filter(Boolean).join(" ")}
          </CardTitle>
          <CardDescription>
            Recent ledger lines (informational). Balances depend on how your school posts invoices
            and concessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-3">
            <p>
              Payments recorded:{" "}
              <span className="text-foreground font-medium tabular-nums">₹{payments.toFixed(2)}</span>
            </p>
            <p>
              Invoices / late fee:{" "}
              <span className="text-foreground font-medium tabular-nums">₹{charges.toFixed(2)}</span>
            </p>
            <p>
              Refunds / concessions / adj.:{" "}
              <span className="text-foreground font-medium tabular-nums">₹{credits.toFixed(2)}</span>
            </p>
          </div>
          {txns.length === 0 ? (
            <p className="text-muted-foreground text-sm">No fee rows yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Head</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txns.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {t.paidAt.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">{t.type}</TableCell>
                      <TableCell className="text-sm">{t.feeHead?.name ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{Number(t.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{t.receiptNo ?? "—"}</TableCell>
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
