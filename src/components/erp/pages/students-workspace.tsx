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

type StudentsWorkspaceMode = "promote-transfer" | "siblings";

const MODE_META: Record<
  StudentsWorkspaceMode,
  { title: string; description: string; note: string }
> = {
  "promote-transfer": {
    title: "Promote / Transfer Workspace",
    description:
      "Current promotion and transfer readiness based on active placement, section mapping, and archive state.",
    note: "Best for planning student movement before a full year-end promotion engine exists.",
  },
  siblings: {
    title: "Sibling Mapping Workspace",
    description:
      "Sibling groups inferred from shared parent links, with quick visibility into family-level student records.",
    note: "Best for front office, fee support, and family-level student understanding.",
  },
};

export async function StudentsWorkspacePage({
  mode,
}: {
  mode: StudentsWorkspaceMode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const meta = MODE_META[mode];

  const [students, classes, archivedStudents, links] = await Promise.all([
    prisma.student.findMany({
      where: { sessionId: session.id, isActive: true },
      include: {
        section: { include: { class: true } },
        parents: { include: { parent: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 300,
    }),
    prisma.class.findMany({
      where: { sessionId: session.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 100,
    }),
    prisma.student.findMany({
      where: { sessionId: session.id, isActive: false },
      include: { section: { include: { class: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.studentParent.findMany({
      where: { student: { sessionId: session.id } },
      include: {
        student: {
          include: { section: { include: { class: true } } },
        },
        parent: true,
      },
      take: 400,
    }),
  ]);

  const siblingFamilies = new Map<
    string,
    {
      parentLabel: string;
      phone: string;
      students: Array<{
        id: string;
        name: string;
        admissionNo: string | null;
        classLabel: string;
        isActive: boolean;
      }>;
    }
  >();

  for (const link of links) {
    const parentLabel =
      link.parent.guardianName ??
      link.parent.fatherName ??
      link.parent.motherName ??
      "Parent";
    const current = siblingFamilies.get(link.parentId) ?? {
      parentLabel,
      phone: link.parent.phonePrimary,
      students: [],
    };
    current.students.push({
      id: link.student.id,
      name: [link.student.firstName, link.student.lastName].filter(Boolean).join(" "),
      admissionNo: link.student.admissionNo,
      classLabel: link.student.section
        ? `${link.student.section.class.name} ${link.student.section.name}`
        : "Unplaced",
      isActive: link.student.isActive,
    });
    siblingFamilies.set(link.parentId, current);
  }

  const siblingGroups = [...siblingFamilies.entries()]
    .map(([parentId, group]) => ({
      parentId,
      ...group,
    }))
    .filter((group) => group.students.length >= 2)
    .sort((a, b) => b.students.length - a.students.length);

  const promotionRows = students.map((student) => {
    const currentClassIndex = student.section
      ? classes.findIndex((cls) => cls.id === student.section?.classId)
      : -1;
    const nextClass = currentClassIndex >= 0 ? classes[currentClassIndex + 1] : null;
    return {
      id: student.id,
      name: [student.firstName, student.lastName].filter(Boolean).join(" "),
      admissionNo: student.admissionNo ?? "—",
      currentClass: student.section
        ? `${student.section.class.name} ${student.section.name}`
        : "Unplaced",
      nextClass: nextClass?.name ?? "Review manually",
      parentPhone: student.parents[0]?.parent.phonePrimary ?? "—",
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Active students" value={String(students.length)} />
        <MetricCard title="Archived students" value={String(archivedStudents.length)} />
        <MetricCard title="Sibling groups" value={String(siblingGroups.length)} />
        <MetricCard title="Classes in session" value={String(classes.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{meta.note}</Badge>
          <Link href="/students/list" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Students
          </Link>
          <Link href="/students/archived" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Archived
          </Link>
          <Link href="/master/classes" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Classes
          </Link>
        </CardContent>
      </Card>

      {mode === "promote-transfer" ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Promotion and transfer readiness</CardTitle>
              <CardDescription>
                Current class placement with a suggested next-step reference. This is a planning
                layer, not a final bulk-promotion engine.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {promotionRows.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active students in this session.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Current placement</TableHead>
                        <TableHead>Suggested next class</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead className="w-[180px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotionRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div className="font-medium">{row.name}</div>
                            <div className="text-muted-foreground text-xs">{row.admissionNo}</div>
                          </TableCell>
                          <TableCell>{row.currentClass}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.nextClass}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{row.parentPhone}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/students/profile?id=${row.id}`}
                                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                              >
                                Profile
                              </Link>
                              <Link
                                href="/students/archived"
                                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                              >
                                Archive view
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
              <CardTitle>Working notes</CardTitle>
              <CardDescription>
                Practical next step before building a bulk session-promotion engine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <PromptBlock text="Use this page to identify students whose next class mapping should be reviewed before session rollover." />
              <PromptBlock text="Inactive students are natural transfer / exit candidates and should stay out of promotion batches." />
              <PromptBlock text="A future upgrade can add bulk section mapping and new-session student carry-forward on top of this planning layer." />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Sibling groups</CardTitle>
              <CardDescription>
                Families with two or more students linked to the same parent record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {siblingGroups.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sibling groups detected yet.</p>
              ) : (
                <div className="space-y-3">
                  {siblingGroups.map((group) => (
                    <div key={group.parentId} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{group.parentLabel}</p>
                          <p className="text-muted-foreground text-xs">{group.phone}</p>
                        </div>
                        <Badge variant="secondary">{group.students.length} students</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {group.students.map((student) => (
                          <div key={student.id} className="rounded-lg border p-3">
                            <p className="font-medium">{student.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {student.admissionNo ?? "—"} • {student.classLabel}
                            </p>
                            <div className="mt-2">
                              <Link
                                href={`/students/profile?id=${student.id}`}
                                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                              >
                                Profile
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sibling mapping notes</CardTitle>
              <CardDescription>
                How to use family-linked student records today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <PromptBlock text="Sibling groups currently come from shared parent links in StudentParent records." />
              <PromptBlock text="This helps front office, fee support, and certificates work at the family level even before dedicated sibling tools exist." />
              <PromptBlock text="A future upgrade can add sibling-specific filters, family ledger views, and guardian-level dashboards." />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
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
