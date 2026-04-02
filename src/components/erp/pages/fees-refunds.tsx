import { recordFeeLedgerEntry } from "@/app/(erp)/actions/fees";
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
import { getCurrentSession } from "@/lib/session-context";

export async function FeesRefundsPage() {
  const session = await getCurrentSession();
  const students = session
    ? await prisma.student.findMany({
        where: { sessionId: session.id, isActive: true },
        orderBy: [{ firstName: "asc" }],
      })
    : [];

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Refunds & adjustments</CardTitle>
        <CardDescription>
          Post a refund, manual adjustment, concession, late fee, or invoice line to the
          student ledger.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No session.</p>
        ) : students.length === 0 ? (
          <p className="text-muted-foreground text-sm">No students.</p>
        ) : (
          <form action={recordFeeLedgerEntry} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student</Label>
              <select
                id="studentId"
                name="studentId"
                required
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="">Select…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {(s.admissionNo ? `[${s.admissionNo}] ` : "") + s.firstName}{" "}
                    {s.lastName ?? ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                required
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="REFUND">Refund</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="CONCESSION">Concession</option>
                <option value="LATE_FEE">Late fee</option>
                <option value="INVOICE">Invoice / charge</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" required placeholder="Reason" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receiptNo">Reference / receipt (optional)</Label>
              <Input id="receiptNo" name="receiptNo" />
            </div>
            <Button type="submit" className="w-fit">
              Post to ledger
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
