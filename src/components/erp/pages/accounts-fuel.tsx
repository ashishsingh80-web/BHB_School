import { createFuelIssue, createFuelPurchase } from "@/app/(erp)/actions/accounts";
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
import { cn } from "@/lib/utils";

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30";

export async function AccountsFuelPage() {
  const [vehicles, purchases, issues] = await Promise.all([
    prisma.vehicle.findMany({
      where: { isBlocked: false },
      orderBy: { registrationNo: "asc" },
    }),
    prisma.fuelPurchase.findMany({
      orderBy: { purchasedAt: "desc" },
      take: 40,
    }),
    prisma.fuelIssue.findMany({
      orderBy: { issuedAt: "desc" },
      take: 40,
      include: { vehicle: true },
    }),
  ]);

  const now = new Date();
  const defaultDt = toDatetimeLocalValue(now);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fuel purchase</CardTitle>
          <CardDescription>
            Bulk diesel/petrol buys (e.g. bowser or pump). Issues to vehicles are logged separately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createFuelPurchase} className="grid max-w-2xl gap-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="qtyL">Litres</Label>
                <Input
                  id="qtyL"
                  name="quantityLiters"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rateL">Rate / litre (₹)</Label>
                <Input
                  id="rateL"
                  name="ratePerLiter"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalAmt">Total (₹)</Label>
                <Input
                  id="totalAmt"
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input id="vendor" name="vendor" placeholder="Pump / supplier" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchasedAt">Purchased at</Label>
                <Input
                  id="purchasedAt"
                  name="purchasedAt"
                  type="datetime-local"
                  defaultValue={defaultDt}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fp-notes">Notes</Label>
              <textarea
                id="fp-notes"
                name="notes"
                rows={2}
                className={cn(
                  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] dark:bg-input/30",
                )}
              />
            </div>
            <Button type="submit" className="w-fit">
              Save purchase
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issue to vehicle</CardTitle>
          <CardDescription>
            Log fuel drawn for a bus or van. Add vehicles in the database until Transport master
            is available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active vehicles. Create a{" "}
              <code className="bg-muted rounded px-1 font-mono text-xs">Vehicle</code> row to
              enable issues.
            </p>
          ) : (
            <form action={createFuelIssue} className="grid max-w-xl gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicleId">Vehicle</Label>
                <select id="vehicleId" name="vehicleId" required className={selectClass}>
                  <option value="">Select…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNo}
                      {v.model ? ` · ${v.model}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="issueQty">Litres</Label>
                  <Input
                    id="issueQty"
                    name="quantityLiters"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="odometerKm">Odometer (km)</Label>
                  <Input
                    id="odometerKm"
                    name="odometerKm"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Optional"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issuedAt">Issued at</Label>
                  <Input
                    id="issuedAt"
                    name="issuedAt"
                    type="datetime-local"
                    defaultValue={defaultDt}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fi-notes">Notes</Label>
                <textarea
                  id="fi-notes"
                  name="notes"
                  rows={2}
                  className={cn(
                    "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] dark:bg-input/30",
                  )}
                />
              </div>
              <Button type="submit" className="w-fit">
                Save issue
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent purchases</CardTitle>
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
                      <TableHead>L</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {p.purchasedAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="tabular-nums">{Number(p.quantityLiters)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          ₹{Number(p.totalAmount).toFixed(2)}
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
            <CardTitle>Recent issues</CardTitle>
            <CardDescription>{issues.length} row(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <p className="text-muted-foreground text-sm">No issues yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>L</TableHead>
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

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
