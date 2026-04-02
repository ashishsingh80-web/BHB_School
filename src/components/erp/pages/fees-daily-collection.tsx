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

export async function FeesDailyCollectionPage() {
  const session = await getCurrentSession();
  const since = new Date();
  since.setDate(since.getDate() - 14);
  since.setHours(0, 0, 0, 0);

  const payments =
    session &&
    (await prisma.feeTransaction.findMany({
      where: {
        type: "PAYMENT",
        paidAt: { gte: since },
        student: { sessionId: session.id },
      },
      select: { amount: true, paidAt: true },
    }));

  const byDay = new Map<string, { total: number; count: number }>();
  if (payments) {
    for (const p of payments) {
      const key = p.paidAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { total: 0, count: 0 };
      cur.total += Number(p.amount);
      cur.count += 1;
      byDay.set(key, cur);
    }
  }

  const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily collection</CardTitle>
        <CardDescription>
          Payment totals by day for the last 14 days (session{" "}
          {session?.name ?? "—"}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No session.</p>
        ) : days.length === 0 ? (
          <p className="text-muted-foreground text-sm">No payments in this window.</p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
