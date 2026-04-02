import { createPayrollRun, setPayrollRunStatus } from "@/app/(erp)/actions/hr";
import { Badge } from "@/components/ui/badge";
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

function monthInputDefault() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromInput(month: string) {
  if (!month) return "";
  const [year, mm] = month.split("-");
  return `${year}-${mm}`;
}

export async function HrPayrollPage() {
  const session = await getCurrentSession();

  const [runs, outstandingAdvances, recentRecoveries] = session
    ? await Promise.all([
        prisma.payrollRun.findMany({
          where: { sessionId: session.id },
          orderBy: [{ monthLabel: "desc" }, { createdAt: "desc" }],
          take: 24,
        }),
        prisma.staffAdvance.findMany({
          where: { balance: { gt: 0 } },
          include: { staff: true },
          orderBy: [{ givenAt: "desc" }],
          take: 20,
        }),
        prisma.advanceRecovery.findMany({
          where: { payrollRef: { not: null } },
          include: {
            advance: {
              include: { staff: true },
            },
          },
          orderBy: { recoveredAt: "desc" },
          take: 30,
        }),
      ])
    : [[], [], []];

  const outstandingAmount = outstandingAdvances.reduce(
    (sum, row) => sum + Number(row.balance),
    0,
  );

  const processedRuns = runs.filter((row) => row.status === "PROCESSED").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Payroll runs</CardDescription>
            <CardTitle className="text-2xl">{runs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processed runs</CardDescription>
            <CardTitle className="text-2xl">{processedRuns}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open staff advances</CardDescription>
            <CardTitle className="text-2xl">{outstandingAdvances.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding advance amount</CardDescription>
            <CardTitle className="text-2xl">₹{outstandingAmount.toFixed(0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create payroll run</CardTitle>
          <CardDescription>
            Start a monthly payroll run for the active academic session. This is a management-level
            summary run and can be marked draft or processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : (
            <form
              action={async (formData) => {
                "use server";
                const monthInput = String(formData.get("monthInput") ?? "");
                formData.set("monthLabel", monthLabelFromInput(monthInput));
                await createPayrollRun(formData);
              }}
              className="grid max-w-3xl gap-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="monthInput">Month</Label>
                  <Input
                    id="monthInput"
                    name="monthInput"
                    type="month"
                    defaultValue={monthInputDefault()}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Initial status</Label>
                  <select
                    id="status"
                    name="status"
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    defaultValue="DRAFT"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PROCESSED">Processed</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="grossAmount">Gross amount</Label>
                  <Input id="grossAmount" name="grossAmount" type="number" min="0" step="0.01" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deductionsAmount">Deductions amount</Label>
                  <Input
                    id="deductionsAmount"
                    name="deductionsAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="netAmount">Net amount</Label>
                  <Input id="netAmount" name="netAmount" type="number" min="0" step="0.01" />
                </div>
              </div>
              <Button type="submit" className="w-fit">
                Create payroll run
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll register</CardTitle>
          <CardDescription>
            Monthly run history for session {session?.name ?? "—"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payroll runs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Processed at</TableHead>
                    <TableHead className="w-[130px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">{run.monthLabel}</TableCell>
                      <TableCell>
                        <Badge variant={run.status === "PROCESSED" ? "secondary" : "outline"}>
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {run.grossAmount != null ? `₹${Number(run.grossAmount).toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {run.deductionsAmount != null
                          ? `₹${Number(run.deductionsAmount).toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {run.netAmount != null ? `₹${Number(run.netAmount).toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {run.processedAt ? run.processedAt.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        <form action={setPayrollRunStatus}>
                          <input type="hidden" name="id" value={run.id} />
                          <Button type="submit" variant="outline" size="sm">
                            {run.status === "PROCESSED" ? "Mark draft" : "Process"}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding staff advances</CardTitle>
            <CardDescription>
              Recovery references can be linked from the staff advance screen using the month label.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {outstandingAdvances.length === 0 ? (
              <p className="text-muted-foreground text-sm">No open staff advances.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Given</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingAdvances.map((advance) => (
                      <TableRow key={advance.id}>
                        <TableCell className="font-medium">
                          {[advance.staff.firstName, advance.staff.lastName].filter(Boolean).join(" ")}
                        </TableCell>
                        <TableCell className="text-sm">{advance.purpose ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          ₹{Number(advance.balance).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm">{advance.givenAt.toLocaleDateString()}</TableCell>
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
            <CardTitle>Recent payroll-linked recoveries</CardTitle>
            <CardDescription>
              Advance recoveries already tagged with a payroll reference from Accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecoveries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No payroll-linked recoveries yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payroll ref</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Recovered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecoveries.map((recovery) => (
                      <TableRow key={recovery.id}>
                        <TableCell className="font-medium">{recovery.payrollRef ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          {[recovery.advance.staff.firstName, recovery.advance.staff.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ₹{Number(recovery.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {recovery.recoveredAt.toLocaleString()}
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
