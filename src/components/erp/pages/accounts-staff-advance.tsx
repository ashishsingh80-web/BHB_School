import {
  createStaffAdvance,
  recordAdvanceRecovery,
} from "@/app/(erp)/actions/accounts";
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

export async function AccountsStaffAdvancePage() {
  const [staffList, advances] = await Promise.all([
    prisma.staff.findMany({
      where: { isActive: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.staffAdvance.findMany({
      orderBy: { givenAt: "desc" },
      take: 40,
      include: { staff: true },
    }),
  ]);

  const openAdvances = advances.filter((a) => Number(a.balance) > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issue staff advance</CardTitle>
          <CardDescription>
            Track petty cash given to employees. Recover through salary or cash return — balance
            updates on each recovery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffList.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active staff records. Add staff (e.g. via database or future HR master) before
              issuing advances.
            </p>
          ) : (
            <form action={createStaffAdvance} className="grid max-w-xl gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staffId">Staff</Label>
                <select id="staffId" name="staffId" required className={selectClass}>
                  <option value="">Select…</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {[s.firstName, s.lastName].filter(Boolean).join(" ")}
                      {s.employeeCode ? ` · ${s.employeeCode}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="adv-amount">Amount (₹)</Label>
                  <Input
                    id="adv-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input id="purpose" name="purpose" placeholder="Optional" />
                </div>
              </div>
              <Button type="submit" className="w-fit">
                Record advance
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recover balance</CardTitle>
          <CardDescription>
            {openAdvances.length === 0
              ? "No outstanding advances."
              : `${openAdvances.length} advance(s) with balance due.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {openAdvances.map((a) => (
            <div
              key={a.id}
              className="border-border flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-end md:justify-between"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {[a.staff.firstName, a.staff.lastName].filter(Boolean).join(" ")}
                </p>
                <p className="text-muted-foreground">
                  Given {a.givenAt.toLocaleString()} · original ₹
                  {Number(a.amount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  · balance ₹
                  {Number(a.balance).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {a.purpose ? (
                  <p className="text-muted-foreground mt-1">{a.purpose}</p>
                ) : null}
              </div>
              <form
                action={recordAdvanceRecovery}
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="advanceId" value={a.id} />
                <div className="grid gap-1">
                  <Label htmlFor={`rec-${a.id}`} className="text-xs">
                    Recover ₹
                  </Label>
                  <Input
                    id={`rec-${a.id}`}
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-32"
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`pay-${a.id}`} className="text-xs">
                    Payroll ref
                  </Label>
                  <Input
                    id={`pay-${a.id}`}
                    name="payrollRef"
                    className="w-36"
                    placeholder="Optional"
                  />
                </div>
                <Button type="submit" size="sm">
                  Apply
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent advances</CardTitle>
          <CardDescription>Latest {advances.length} record(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {advances.length === 0 ? (
            <p className="text-muted-foreground text-sm">No advances yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="text-right">Given</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {a.givenAt.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {[a.staff.firstName, a.staff.lastName].filter(Boolean).join(" ")}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">
                        {a.purpose ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{Number(a.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{Number(a.balance).toFixed(2)}
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
