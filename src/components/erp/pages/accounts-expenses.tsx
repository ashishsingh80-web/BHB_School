import Link from "next/link";

import { createExpense } from "@/app/(erp)/actions/accounts";
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
import { getCurrentSession } from "@/lib/session-context";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Stationery",
  "Electricity",
  "Internet",
  "Fuel",
  "Maintenance",
  "Printing",
  "Cleaning",
  "Events",
  "Hospitality",
  "Miscellaneous",
] as const;

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30";

function padMonth(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function currentCalendarMonth() {
  const d = new Date();
  return padMonth(d.getFullYear(), d.getMonth() + 1);
}

function shiftMonth(ym: string, delta: number) {
  const [yStr, mStr] = ym.split("-");
  let y = Number(yStr);
  let mo = Number(mStr) + delta;
  while (mo < 1) {
    mo += 12;
    y -= 1;
  }
  while (mo > 12) {
    mo -= 12;
    y += 1;
  }
  return padMonth(y, mo);
}

function monthBounds(ym: string) {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end };
}

type Props = {
  month?: string;
};

export async function AccountsExpensesPage({ month }: Props) {
  const session = await getCurrentSession();
  const ym =
    month && /^\d{4}-\d{2}$/.test(month) ? month : currentCalendarMonth();
  const { start, end } = monthBounds(ym);

  const expenses = session
    ? await prisma.expense.findMany({
        where: {
          sessionId: session.id,
          paidAt: { gte: start, lte: end },
        },
        orderBy: { paidAt: "desc" },
      })
    : [];

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const nowLocal = new Date();
  const defaultPaidAt = toDatetimeLocalValue(nowLocal);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Daily expenses</CardTitle>
              <CardDescription>
                Session-scoped ledger. Use categories aligned with school ops; attach receipt URL
                when available.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/accounts/expenses?month=${shiftMonth(ym, -1)}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Previous month
              </Link>
              <span className="text-muted-foreground font-mono text-sm">{ym}</span>
              <Link
                href={`/accounts/expenses?month=${shiftMonth(ym, 1)}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Next month
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session configured.</p>
          ) : (
            <form action={createExpense} className="grid max-w-xl gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <select id="category" name="category" required className={selectClass}>
                    <option value="">Select…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="vendor">Vendor / payee</Label>
                  <Input id="vendor" name="vendor" placeholder="Optional" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paidAt">Paid at</Label>
                  <Input
                    id="paidAt"
                    name="paidAt"
                    type="datetime-local"
                    defaultValue={defaultPaidAt}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className={cn(
                    "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] dark:bg-input/30",
                  )}
                  placeholder="Bill ref, purpose…"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="receiptUrl">Receipt URL</Label>
                <Input
                  id="receiptUrl"
                  name="receiptUrl"
                  type="url"
                  placeholder="https://… (optional)"
                />
              </div>
              <Button type="submit" className="w-fit">
                Save expense
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {ym} · {expenses.length} row(s)
          </CardTitle>
          <CardDescription className="tabular-nums">
            Month total: ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? null : expenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No expenses in this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {e.paidAt.toLocaleString()}
                      </TableCell>
                      <TableCell>{e.category}</TableCell>
                      <TableCell>{e.vendor ?? "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {e.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{Number(e.amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
