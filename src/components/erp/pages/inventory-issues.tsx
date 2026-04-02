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

export async function InventoryIssuesPage() {
  const txns = await prisma.inventoryTxn.findMany({
    where: { direction: "OUT" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { item: { select: { name: true, unit: true } } },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issue register</CardTitle>
          <CardDescription>
            Recent stock-out movements (consumption, issue to class, transfer). Last 100 rows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {txns.length === 0 ? (
            <p className="text-muted-foreground text-sm">No issues posted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txns.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {t.createdAt.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {t.item.name}
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({t.item.unit})
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(t.qty)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {t.ref ?? "—"}
                      </TableCell>
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
