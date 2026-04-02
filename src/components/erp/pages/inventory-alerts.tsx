import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
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

export async function InventoryAlertsPage() {
  const items = await prisma.inventoryItem.findMany({
    where: { reorderLevel: { not: null } },
    orderBy: { name: "asc" },
  });

  const low = items.filter(
    (i) => i.reorderLevel != null && Number(i.qtyOnHand) <= Number(i.reorderLevel),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Low stock alerts</CardTitle>
          <CardDescription>
            Items with a reorder level set where on-hand quantity is at or below that threshold.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {items.filter((i) => i.reorderLevel != null).length} item(s) have a reorder level
            configured · <strong>{low.length}</strong> currently at or below threshold.
          </p>
          <Link
            href="/inventory/stock"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Record stock in
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Below reorder level</CardTitle>
        </CardHeader>
        <CardContent>
          {low.length === 0 ? (
            <p className="text-muted-foreground text-sm">No low-stock rows right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">Reorder at</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {low.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(i.qtyOnHand)} {i.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(i.reorderLevel)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">Low</Badge>
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
