import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

function currentYm() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthUtcRange(ym: string) {
  const parts = ym.split("-").map(Number);
  const y = parts[0];
  const mo = parts[1];
  if (!y || !mo || mo < 1 || mo > 12) return null;
  const start = new Date(Date.UTC(y, mo - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, mo, 1, 0, 0, 0, 0));
  return { start, end };
}

type Props = {
  month: string | undefined;
};

export async function FeesMonthlyCollectionPage({ month }: Props) {
  const session = await getCurrentSession();
  const ym = month && /^\d{4}-\d{2}$/.test(month) ? month : currentYm();
  const range = monthUtcRange(ym);

  const payments =
    session && range
      ? await prisma.feeTransaction.findMany({
          where: {
            type: "PAYMENT",
            paidAt: { gte: range.start, lt: range.end },
            student: { sessionId: session.id },
          },
          select: { amount: true, paidAt: true },
        })
      : [];

  let total = 0;
  const byDay = new Map<string, { total: number; count: number }>();
  for (const p of payments) {
    total += Number(p.amount);
    const key = p.paidAt.toISOString().slice(0, 10);
    const cur = byDay.get(key) ?? { total: 0, count: 0 };
    cur.total += Number(p.amount);
    cur.count += 1;
    byDay.set(key, cur);
  }

  const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly collection</CardTitle>
        <CardDescription>
          Payment totals for a calendar month (UTC dates), session{" "}
          {session?.name ?? "—"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!session ? (
          <p className="text-muted-foreground text-sm">No session.</p>
        ) : (
          <>
            <form className="flex flex-wrap items-end gap-4" method="get" action="/fees/monthly-collection">
              <div className="grid gap-2">
                <Label htmlFor="month">Month</Label>
                <input
                  id="month"
                  name="month"
                  type="month"
                  defaultValue={ym}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                />
              </div>
              <Button type="submit" variant="secondary">
                Load
              </Button>
            </form>

            {payments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No payments in this month.</p>
            ) : (
              <>
                <div className="bg-muted/40 flex flex-wrap items-baseline gap-4 rounded-lg border p-4">
                  <span className="text-muted-foreground text-sm">Month total</span>
                  <span className="font-mono text-2xl font-semibold tabular-nums">
                    ₹ {total.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {payments.length} receipt{payments.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div>
                  <p className="text-muted-foreground mb-2 text-sm font-medium">By day</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Receipts</TableHead>
                        <TableHead className="text-right">Total (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {days.map(([date, v]) => (
                        <TableRow key={date}>
                          <TableCell className="font-mono text-sm">{date}</TableCell>
                          <TableCell className="text-right">{v.count}</TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {v.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
