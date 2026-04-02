import { createInventoryItem } from "@/app/(erp)/actions/inventory";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30";

export async function InventoryItemsPage() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Item master</CardTitle>
          <CardDescription>
            Define stock items (stationery, lab material, uniforms, etc.). Use Stock in / out to
            move quantities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createInventoryItem} className="mb-8 grid max-w-xl gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="e.g. A4 paper ream" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU / code</Label>
                <Input id="sku" name="sku" placeholder="Optional" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <select id="unit" name="unit" className={selectClass} defaultValue="PCS">
                  <option value="PCS">PCS</option>
                  <option value="BOX">BOX</option>
                  <option value="REAM">REAM</option>
                  <option value="KG">KG</option>
                  <option value="L">L</option>
                  <option value="SET">SET</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reorderLevel">Reorder level (optional)</Label>
              <Input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                step="0.01"
                min="0"
                placeholder="Alert when on-hand ≤ this"
              />
            </div>
            <Button type="submit" className="w-fit">
              Add item
            </Button>
          </form>

          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No items yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">Reorder at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {i.sku ?? "—"}
                      </TableCell>
                      <TableCell>{i.unit}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(i.qtyOnHand)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {i.reorderLevel != null ? Number(i.reorderLevel) : "—"}
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
