import { recordInventoryTxn } from "@/app/(erp)/actions/inventory";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30";

export async function InventoryStockPage() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true, qtyOnHand: true },
  });

  return (
    <div className="space-y-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Stock in / out</CardTitle>
          <CardDescription>
            Record receipts (IN) and consumption or transfers (OUT). On-hand quantity updates
            atomically; OUT is rejected if stock is insufficient.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add items under Item master first.
            </p>
          ) : (
            <form action={recordInventoryTxn} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="itemId">Item</Label>
                <select id="itemId" name="itemId" required className={selectClass}>
                  <option value="">Select…</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} — {Number(i.qtyOnHand)} {i.unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="direction">Direction</Label>
                  <select id="direction" name="direction" required className={selectClass}>
                    <option value="IN">Stock in (receipt)</option>
                    <option value="OUT">Stock out (issue)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input id="qty" name="qty" type="number" step="0.01" min="0" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ref">Reference</Label>
                <Input
                  id="ref"
                  name="ref"
                  placeholder="PO no., department, class…"
                />
              </div>
              <Button type="submit" className="w-fit">
                Post movement
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
