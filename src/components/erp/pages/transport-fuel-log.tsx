import Link from "next/link";

import { addFuelStockAdjustment } from "@/app/(erp)/actions/transport";
import { buttonVariants } from "@/components/ui/button-variants";
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

export async function TransportFuelLogPage() {
  const [vehicles, purchases, issues, stockEntries] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { registrationNo: "asc" },
      select: { id: true, registrationNo: true },
    }),
    prisma.fuelPurchase.findMany({
      orderBy: { purchasedAt: "desc" },
      take: 25,
    }),
    prisma.fuelIssue.findMany({
      orderBy: { issuedAt: "desc" },
      take: 25,
      include: { vehicle: true },
    }),
    prisma.fuelStockEntry.findMany({
      orderBy: { recordedAt: "desc" },
      take: 25,
      include: { vehicle: true },
    }),
  ]);

  const totalPurchased = purchases.reduce((sum, row) => sum + Number(row.quantityLiters), 0);
  const totalIssued = issues.reduce((sum, row) => sum + Number(row.quantityLiters), 0);
  const totalAdjustedIn = stockEntries
    .filter((row) => row.referenceType !== "FUEL_PURCHASE" && row.direction === "IN")
    .reduce((sum, row) => sum + Number(row.quantityLiters), 0);
  const totalAdjustedOut = stockEntries
    .filter((row) => row.referenceType !== "FUEL_ISSUE" && row.direction === "OUT")
    .reduce((sum, row) => sum + Number(row.quantityLiters), 0);
  const stockOnHand = totalPurchased - totalIssued + totalAdjustedIn - totalAdjustedOut;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Transport fuel log</CardTitle>
              <CardDescription>
                Read-only view of purchases and issues. Record new entries under Accounts → Fuel
                (same underlying data).
              </CardDescription>
            </div>
            <Link href="/accounts/fuel" className={buttonVariants({ variant: "default", size: "sm" })}>
              Add purchase / issue
            </Link>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Purchased</CardDescription>
            <CardTitle className="text-2xl">{totalPurchased.toFixed(2)} L</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Issued</CardDescription>
            <CardTitle className="text-2xl">{totalIssued.toFixed(2)} L</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Manual adjustments</CardDescription>
            <CardTitle className="text-2xl">
              {(totalAdjustedIn - totalAdjustedOut).toFixed(2)} L
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estimated stock on hand</CardDescription>
            <CardTitle className="text-2xl">{stockOnHand.toFixed(2)} L</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual stock adjustment</CardTitle>
          <CardDescription>
            Use this only for tank opening balance, stock correction, or verified wastage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addFuelStockAdjustment} className="grid max-w-3xl gap-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="direction">Direction</Label>
                <select id="direction" name="direction" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30">
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantityLiters">Litres</Label>
                <Input id="quantityLiters" name="quantityLiters" type="number" step="0.01" min="0" required />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="vehicleId">Vehicle (optional)</Label>
                <select id="vehicleId" name="vehicleId" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30">
                  <option value="">Store / general stock</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registrationNo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="recordedAt">Recorded on</Label>
                <Input id="recordedAt" name="recordedAt" type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" placeholder="Opening balance, evaporation, stock audit…" />
              </div>
            </div>
            <Button type="submit" className="w-fit" size="sm">
              Save adjustment
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent issues (by vehicle)</CardTitle>
            <CardDescription>{issues.length} row(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <p className="text-muted-foreground text-sm">No fuel issues yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Litres</TableHead>
                      <TableHead>Odo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {i.issuedAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {i.vehicle.registrationNo}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {Number(i.quantityLiters)}
                        </TableCell>
                        <TableCell className="tabular-nums text-xs">
                          {i.odometerKm != null ? Number(i.odometerKm) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent bulk purchases</CardTitle>
            <CardDescription>{purchases.length} row(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <p className="text-muted-foreground text-sm">No purchases yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Litres</TableHead>
                      <TableHead className="text-right">Total ₹</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {p.purchasedAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {Number(p.quantityLiters)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(p.totalAmount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent stock movements</CardTitle>
            <CardDescription>{stockEntries.length} row(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {stockEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No stock movements yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Litres</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {entry.recordedAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {entry.direction}
                          {entry.referenceType ? ` · ${entry.referenceType}` : ""}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.vehicle?.registrationNo ?? "Store"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {Number(entry.quantityLiters)}
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
    </div>
  );
}
