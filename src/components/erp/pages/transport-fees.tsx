import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
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
import { getCurrentSession } from "@/lib/session-context";
import { cn } from "@/lib/utils";

export async function TransportFeesPage() {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const [assignments, payments, routes] = await Promise.all([
    prisma.studentTransportAssignment.findMany({
      include: {
        student: {
          include: {
            section: { include: { class: true } },
            parents: { include: { parent: true } },
          },
        },
        route: true,
        boardingStop: true,
      },
      orderBy: [{ route: { name: "asc" } }, { student: { firstName: "asc" } }],
    }),
    prisma.feeTransaction.groupBy({
      by: ["studentId"],
      where: {
        student: { sessionId: session.id },
        type: "PAYMENT",
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transportRoute.findMany({
      where: { sessionId: session.id },
      include: {
        defaultVehicle: true,
        studentAssignments: {
          include: {
            student: true,
          },
        },
        stops: {
          include: { busStop: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const paymentMap = new Map(
    payments.map((row) => [
      row.studentId,
      {
        total: Number(row._sum.amount ?? 0),
        count: row._count._all,
      },
    ]),
  );

  const assignedRows = assignments.map((assignment) => {
    const payment = paymentMap.get(assignment.studentId) ?? { total: 0, count: 0 };
    const sectionLabel = assignment.student.section
      ? `${assignment.student.section.class.name} ${assignment.student.section.name}`
      : "—";
    return {
      id: assignment.studentId,
      studentName: [assignment.student.firstName, assignment.student.lastName]
        .filter(Boolean)
        .join(" "),
      admissionNo: assignment.student.admissionNo ?? "—",
      sectionLabel,
      routeName: assignment.route.name,
      stopName: assignment.boardingStop.name,
      parentPhone: assignment.student.parents[0]?.parent.phonePrimary ?? "—",
      paymentTotal: payment.total,
      paymentCount: payment.count,
    };
  });

  const billingReady = assignedRows.filter((row) => row.paymentCount > 0);
  const billingPending = assignedRows.filter((row) => row.paymentCount === 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Transport-assigned students" value={assignedRows.length} />
        <StatCard title="Billing-ready profiles" value={billingReady.length} />
        <StatCard title="Pending fee linkage" value={billingPending.length} />
        <StatCard title="Active routes" value={routes.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transport fees workspace</CardTitle>
          <CardDescription>
            Route assignments, boarding points, and overall fee-payment signals in one place.
            This is a transport-fee readiness layer built on the current schema while a dedicated
            transport charge engine is still pending.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">
            Use route mapping plus fee ledger today; add a dedicated transport fee head next.
          </Badge>
          <Link
            href="/transport/mapping"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Route mapping
          </Link>
          <Link
            href="/fees/collect"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Collect fee
          </Link>
          <Link
            href="/fees/ledger"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Fee ledger
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Assigned student billing queue</CardTitle>
            <CardDescription>
              Students with route assignments, along with whether any fee payments are already
              recorded against the student profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignedRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No transport assignments yet. Map students to routes first.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Route / stop</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Fee linkage</TableHead>
                      <TableHead className="w-[180px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium">{row.studentName}</div>
                          <div className="text-muted-foreground text-xs">
                            {row.admissionNo} • {row.sectionLabel}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.routeName}
                          <span className="text-muted-foreground block text-xs">
                            {row.stopName}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.parentPhone}</TableCell>
                        <TableCell>
                          {row.paymentCount > 0 ? (
                            <div>
                              <Badge variant="secondary">Billing-ready</Badge>
                              <div className="text-muted-foreground mt-1 text-xs">
                                {row.paymentCount} payment entries • ₹{row.paymentTotal.toFixed(0)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <Badge variant="outline">Needs fee linkage</Badge>
                              <div className="text-muted-foreground mt-1 text-xs">
                                No payment history yet
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/fees/collect`}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                              Collect
                            </Link>
                            <Link
                              href={`/fees/ledger?studentId=${row.id}`}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                              Ledger
                            </Link>
                          </div>
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
            <CardTitle>Transport fee operating notes</CardTitle>
            <CardDescription>
              Practical workflow while the repo still uses the shared student fee ledger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PromptBlock text="Create a dedicated transport fee head in master setup if the school wants separate accounting visibility." />
            <PromptBlock text="Use route mapping to define who should be billed, then collect or review payments from the standard fees module." />
            <PromptBlock text="The next upgrade can add route-wise monthly transport charges and fee-head tagging without changing the assignment queue." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Route-wise transport fee review</CardTitle>
            <CardDescription>
              Quick management view of route load and billing readiness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {routes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No transport routes yet.</p>
            ) : (
              <div className="space-y-3">
                {routes.map((route) => {
                  const routeAssigned = assignedRows.filter((row) => row.routeName === route.name);
                  const routeBillingReady = routeAssigned.filter((row) => row.paymentCount > 0).length;
                  return (
                    <div key={route.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{route.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {route.defaultVehicle?.registrationNo ?? "No default vehicle"} •{" "}
                            {route.stops.length} stop(s) • {routeAssigned.length} assigned student(s)
                          </p>
                        </div>
                        <Badge variant={routeBillingReady === routeAssigned.length && routeAssigned.length > 0 ? "secondary" : "outline"}>
                          {routeBillingReady}/{routeAssigned.length} billing-ready
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending fee-linkage students</CardTitle>
            <CardDescription>
              Transport-mapped students with no payment history yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billingPending.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Every assigned student already has some fee-payment history.
              </p>
            ) : (
              <div className="space-y-3">
                {billingPending.map((row) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <p className="font-medium">{row.studentName}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.routeName} • {row.stopName} • {row.parentPhone}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Good candidate for adding or reviewing a transport-linked charge in the fee workflow.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}
