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

export async function FeesReceiptsPage() {
  const session = await getCurrentSession();
  const rows = session
        ? await prisma.feeTransaction.findMany({
        where: {
          type: "PAYMENT",
          student: { sessionId: session.id },
        },
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
          feeHead: { select: { name: true } },
        },
        orderBy: { paidAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts</CardTitle>
        <CardDescription>
          Latest fee payments for session{" "}
          {session ? <strong>{session.name}</strong> : "—"} (last 100).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No session.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {r.paidAt.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {[r.student.firstName, r.student.lastName].filter(Boolean).join(" ")}
                      </span>
                      {r.student.admissionNo ? (
                        <span className="text-muted-foreground ml-1 font-mono text-xs">
                          {r.student.admissionNo}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.receiptNo ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.feeHead?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                      {r.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ₹ {r.amount.toString()}
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
