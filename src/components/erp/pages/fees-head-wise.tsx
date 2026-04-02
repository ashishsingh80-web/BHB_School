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

export async function FeesHeadWisePage() {
  const session = await getCurrentSession();

  const heads = session
    ? await prisma.feeHead.findMany({
        where: { sessionId: session.id },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      })
    : [];

  const payments =
    session &&
    (await prisma.feeTransaction.findMany({
      where: {
        type: "PAYMENT",
        student: { sessionId: session.id },
      },
      select: { amount: true, feeHeadId: true },
    }));

  const byHead = new Map<string | null, { total: number; count: number }>();
  if (payments) {
    for (const p of payments) {
      const key = p.feeHeadId;
      const cur = byHead.get(key) ?? { total: 0, count: 0 };
      cur.total += Number(p.amount);
      cur.count += 1;
      byHead.set(key, cur);
    }
  }

  const unspecified = byHead.get(null) ?? { total: 0, count: 0 };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Head-wise collection</CardTitle>
        <CardDescription>
          Sums of recorded <strong>payments</strong> by fee head. Tag a head when using{" "}
          <strong>Collect fee</strong> so receipts appear here. Older receipts without a head
          show under &quot;Not specified&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No session.</p>
        ) : heads.length === 0 ? (
          <p className="text-muted-foreground text-sm">Define fee heads under Master Setup.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee head</TableHead>
                <TableHead className="text-right">Receipts</TableHead>
                <TableHead className="text-right">Total (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {heads.map((h) => {
                const agg = byHead.get(h.id) ?? { total: 0, count: 0 };
                return (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{agg.count}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {agg.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/30">
                <TableCell className="text-muted-foreground font-medium">
                  Not specified
                </TableCell>
                <TableCell className="text-right tabular-nums">{unspecified.count}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {unspecified.total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
