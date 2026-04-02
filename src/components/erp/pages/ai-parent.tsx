import Link from "next/link";

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

function localCalendarYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseUtcDate(ymd: string) {
  const [y, mo, da] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, da));
}

export async function AiParentPage() {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const today = parseUtcDate(localCalendarYmd());
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);
  const recentAdmissionStart = new Date(today);
  recentAdmissionStart.setUTCDate(recentAdmissionStart.getUTCDate() - 29);

  const [students, paidGroups, absentGroups, recentAdmissions] = await Promise.all([
    prisma.student.findMany({
      where: { sessionId: session.id, isActive: true },
      include: {
        section: { include: { class: true } },
        parents: { include: { parent: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 300,
    }),
    prisma.feeTransaction.groupBy({
      by: ["studentId"],
      where: { type: "PAYMENT", student: { sessionId: session.id } },
    }),
    prisma.studentAttendance.groupBy({
      by: ["studentId"],
      where: {
        status: "ABSENT",
        date: { gte: fourteenDaysAgo, lte: today },
        student: { sessionId: session.id, isActive: true },
      },
      _count: { _all: true },
    }),
    prisma.admission.findMany({
      where: {
        sessionId: session.id,
        status: "ADMITTED",
        updatedAt: { gte: recentAdmissionStart },
        studentId: { not: null },
      },
      include: {
        student: {
          include: {
            parents: { include: { parent: true } },
            section: { include: { class: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const paidStudentIds = new Set(paidGroups.map((row) => row.studentId));
  const absenceMap = new Map(absentGroups.map((row) => [row.studentId, row._count._all]));

  const outreachQueue = students
    .map((student) => {
      const absents14d = absenceMap.get(student.id) ?? 0;
      const noPaymentYet = !paidStudentIds.has(student.id);
      const parent = student.parents[0]?.parent;
      const triggers = [
        absents14d >= 2 ? `${absents14d} absences in last 14 days` : null,
        noPaymentYet ? "No fee payment recorded yet" : null,
      ].filter(Boolean);

      if (triggers.length === 0) return null;

      return {
        student,
        parent,
        absents14d,
        noPaymentYet,
        triggers: triggers.join(" • "),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.absents14d - a.absents14d || Number(b.noPaymentYet) - Number(a.noPaymentYet))
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Parent outreach queue</CardDescription>
            <CardTitle className="text-2xl">{outreachQueue.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attendance-driven nudges</CardDescription>
            <CardTitle className="text-2xl">
              {outreachQueue.filter((row) => row.absents14d >= 2).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fee reminder cases</CardDescription>
            <CardTitle className="text-2xl">
              {outreachQueue.filter((row) => row.noPaymentYet).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recent admitted families</CardDescription>
            <CardTitle className="text-2xl">{recentAdmissions.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parent AI communication queue</CardTitle>
          <CardDescription>
            Parent-facing improvement suggestions and reminder opportunities built from attendance,
            fee, and recent-admission signals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {outreachQueue.length === 0 ? (
            <p className="text-muted-foreground text-sm">No parent AI outreach suggestions are pending.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student / parent</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Suggested message angle</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outreachQueue.map((row) => {
                    const studentName = [row.student.firstName, row.student.lastName]
                      .filter(Boolean)
                      .join(" ");
                    const sectionLabel = row.student.section
                      ? `${row.student.section.class.name} ${row.student.section.name}`
                      : "—";
                    return (
                      <TableRow key={row.student.id}>
                        <TableCell>
                          <div className="font-medium">{studentName}</div>
                          <div className="text-muted-foreground text-xs">
                            {row.parent?.guardianName ??
                              row.parent?.fatherName ??
                              row.parent?.motherName ??
                              "Parent contact not linked"}{" "}
                            • {row.parent?.phonePrimary ?? "No phone"} • {sectionLabel}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.triggers}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.absents14d >= 2 && row.noPaymentYet
                            ? "Blend care with clarity: attendance concern, fee support reminder, and one concrete next step."
                            : row.absents14d >= 2
                              ? "Use a supportive attendance-improvement tone and ask if home support is needed."
                              : "Send a polite fee reminder with receipt/helpdesk guidance."}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/students/profile?id=${row.student.id}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome and onboarding suggestions</CardTitle>
            <CardDescription>
              Families admitted in the last 30 days are good candidates for a guided welcome flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAdmissions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent admitted families found.</p>
            ) : (
              <div className="space-y-3">
                {recentAdmissions.map((admission) => {
                  const student = admission.student;
                  if (!student) return null;
                  const studentName = [student.firstName, student.lastName].filter(Boolean).join(" ");
                  const guardian =
                    student.parents[0]?.parent.guardianName ??
                    student.parents[0]?.parent.fatherName ??
                    student.parents[0]?.parent.motherName ??
                    "Parent";
                  return (
                    <div key={admission.id} className="rounded-lg border p-3">
                      <p className="font-medium">{studentName}</p>
                      <p className="text-muted-foreground text-sm">
                        Welcome {guardian} with portal guidance, transport confirmation, and first-week expectations.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parent AI prompt starters</CardTitle>
            <CardDescription>
              Message ideas for a future parent assistant or staff copilots.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PromptBlock text="Write a warm but clear message to a parent about repeated absences, with two practical improvement suggestions." />
            <PromptBlock text="Draft a fee reminder that sounds supportive, includes help options, and avoids sounding harsh." />
            <PromptBlock text="Generate a welcome message for a newly admitted family covering login, timetable, homework, and transport readiness." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}
