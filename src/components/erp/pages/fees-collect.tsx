import { recordFeePayment } from "@/app/(erp)/actions/fees";
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

export async function FeesCollectPage() {
  const session = await getCurrentSession();
  const [students, feeHeads] = session
    ? await Promise.all([
        prisma.student.findMany({
          where: { sessionId: session.id, isActive: true },
          include: { section: { include: { class: true } } },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        }),
        prisma.feeHead.findMany({
          where: { sessionId: session.id },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
      ])
    : [[], []];

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Collect fee</CardTitle>
        <CardDescription>
          Record a payment against a student. Receipt number is auto-generated if left
          blank.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">No session configured.</p>
        ) : students.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active students in this session.</p>
        ) : (
          <form action={recordFeePayment} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student</Label>
              <select
                id="studentId"
                name="studentId"
                required
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="">Select student…</option>
                {students.map((s) => {
                  const label = [
                    s.admissionNo ? `[${s.admissionNo}]` : "",
                    s.firstName,
                    s.lastName,
                    s.section
                      ? `— ${s.section.class.name} ${s.section.name}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <option key={s.id} value={s.id}>
                      {label}
                    </option>
                  );
                })}
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
                placeholder="5000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feeHeadId">Fee head (for reports)</Label>
              <select
                id="feeHeadId"
                name="feeHeadId"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="">Not specified</option>
                {feeHeads.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g. Tuition Q1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receiptNo">Receipt no. (optional)</Label>
              <Input id="receiptNo" name="receiptNo" placeholder="Auto if empty" />
            </div>
            <Button type="submit" className="w-fit">
              Record payment
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
