import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type Props = { studentId: string | undefined };

export async function FeesLedgerPage({ studentId }: Props) {
  const session = await getCurrentSession();
  const students = session
    ? await prisma.student.findMany({
        where: { sessionId: session.id, isActive: true },
        orderBy: [{ firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
        },
      })
    : [];

  const ledger =
    studentId && session
      ? await prisma.feeTransaction.findMany({
          where: { studentId },
          orderBy: { paidAt: "asc" },
        })
      : [];

  const student =
    studentId && session
      ? await prisma.student.findFirst({
          where: { id: studentId, sessionId: session.id },
        })
      : null;

  const rowsWithBalance = ledger.reduce<Array<(typeof ledger)[number] & {
    running: number;
    delta: number;
  }>>((rows, t) => {
    const amt = Number(t.amount);
    let delta = 0;
    switch (t.type) {
      case "INVOICE":
      case "LATE_FEE":
        delta = amt;
        break;
      case "PAYMENT":
      case "CONCESSION":
        delta = -amt;
        break;
      case "REFUND":
        delta = amt;
        break;
      case "ADJUSTMENT":
        delta = amt;
        break;
      default:
        delta = 0;
    }
    const previousBalance = rows.at(-1)?.running ?? 0;
    const running = previousBalance + delta;
    rows.push({ ...t, running, delta });
    return rows;
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student ledger</CardTitle>
          <CardDescription>
            Full fee transaction history and running balance (charges increase balance,
            payments and concessions reduce it).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!session ? (
            <p className="text-muted-foreground text-sm">No session.</p>
          ) : (
            <form className="flex flex-wrap items-end gap-3" method="get" action="/fees/ledger">
              <div className="grid gap-2">
                <label htmlFor="sid" className="text-sm font-medium">
                  Student
                </label>
                <select
                  id="sid"
                  name="studentId"
                  defaultValue={studentId ?? ""}
                  className="border-input bg-background h-9 min-w-[240px] rounded-md border px-3 text-sm"
                >
                  <option value="">Choose…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s.admissionNo ? `[${s.admissionNo}] ` : "") +
                        [s.firstName, s.lastName].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="secondary">
                Load ledger
              </Button>
            </form>
          )}

          {studentId && !student ? (
            <p className="text-destructive text-sm">Student not found in this session.</p>
          ) : null}

          {student && rowsWithBalance.length === 0 ? (
            <p className="text-muted-foreground text-sm">No ledger entries yet.</p>
          ) : null}

          {student && rowsWithBalance.length > 0 ? (
            <>
              <p className="text-sm">
                <span className="font-medium">
                  {[student.firstName, student.lastName].filter(Boolean).join(" ")}
                </span>
                {student.admissionNo ? (
                  <span className="text-muted-foreground font-mono text-xs">
                    {" "}
                    · {student.admissionNo}
                  </span>
                ) : null}
                {" · "}
                <Link
                  href={`/students/profile?id=${student.id}`}
                  className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0")}
                >
                  Open profile
                </Link>
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rowsWithBalance.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {r.paidAt.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">
                          {r.description ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.receiptNo ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {r.delta >= 0 ? "+" : ""}
                          {r.delta.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {r.running.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
