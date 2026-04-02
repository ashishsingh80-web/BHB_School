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

type TimetableMode =
  | "class"
  | "teacher"
  | "auto-generate"
  | "conflicts"
  | "substitutes"
  | "rooms";

const MODE_META: Record<
  TimetableMode,
  { title: string; description: string; note: string }
> = {
  class: {
    title: "Class Timetable Planning",
    description:
      "Use classes, sections, subjects, and recent teaching activity to prepare class-wise timetable planning.",
    note: "Best for building section-first period plans.",
  },
  teacher: {
    title: "Teacher Timetable Planning",
    description:
      "Use active staff, subject masters, and section load to prepare teacher allocation plans.",
    note: "Best for balancing teacher workload and section coverage.",
  },
  "auto-generate": {
    title: "Auto Generation Readiness",
    description:
      "Review the master data needed before a future timetable auto-generation engine can run safely.",
    note: "Best for validating scheduling prerequisites before automation.",
  },
  conflicts: {
    title: "Conflict Detection Workspace",
    description:
      "Spot likely scheduling conflicts from missing staff structure, unbalanced class counts, and incomplete master coverage.",
    note: "Best for identifying timetable risks before publishing.",
  },
  substitutes: {
    title: "Substitute Management",
    description:
      "Use recent class-diary and homework activity to identify where substitute-ready planning matters most.",
    note: "Best for managing teacher absence impact operationally.",
  },
  rooms: {
    title: "Room and Period Allocation",
    description:
      "Review class/section footprint and academic load until dedicated room-period tables are added.",
    note: "Best for space planning and future room-allocation setup.",
  },
};

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

export async function TimetableWorkspacePage({ mode }: { mode: TimetableMode }) {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const meta = MODE_META[mode];
  const today = parseUtcDate(localCalendarYmd());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const [classes, sections, subjects, staff, recentHomework, recentDiary, exams] =
    await Promise.all([
      prisma.class.findMany({
        where: { sessionId: session.id },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.section.findMany({
        where: { class: { sessionId: session.id } },
        include: { class: true },
        orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
      }),
      prisma.subject.findMany({
        where: { sessionId: session.id },
        orderBy: { name: "asc" },
      }),
      prisma.staff.findMany({
        where: { isActive: true },
        orderBy: [{ designation: "asc" }, { firstName: "asc" }],
        take: 100,
      }),
      prisma.homeworkEntry.findMany({
        where: {
          sessionId: session.id,
          assignedOn: { gte: sevenDaysAgo, lte: today },
        },
        include: {
          section: { include: { class: true } },
          subject: true,
        },
        orderBy: { assignedOn: "desc" },
        take: 60,
      }),
      prisma.classDiaryEntry.findMany({
        where: {
          sessionId: session.id,
          entryDate: { gte: sevenDaysAgo, lte: today },
        },
        include: {
          section: { include: { class: true } },
        },
        orderBy: { entryDate: "desc" },
        take: 60,
      }),
      prisma.exam.findMany({
        where: { sessionId: session.id },
        orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
        take: 10,
      }),
    ]);

  const sectionCounts = new Map<string, number>();
  for (const section of sections) {
    sectionCounts.set(section.classId, (sectionCounts.get(section.classId) ?? 0) + 1);
  }

  const diarySectionIds = new Set(recentDiary.map((row) => row.sectionId));
  const sectionsMissingDiary = sections.filter((section) => !diarySectionIds.has(section.id));
  const subjectDensity = subjects.length / Math.max(classes.length, 1);
  const teacherPool = staff.filter((row) =>
    ["TEACHER", "CLASS_TEACHER"].includes(row.designation ?? ""),
  );

  const routeCards = [
    {
      label: "Classes",
      value: classes.length,
      note: "Timetable blocks",
    },
    {
      label: "Sections",
      value: sections.length,
      note: "Scheduling units",
    },
    {
      label: "Subjects",
      value: subjects.length,
      note: "Academic load",
    },
    {
      label: "Teacher pool",
      value: teacherPool.length,
      note: "Teacher-designation staff",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {routeCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">{card.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{meta.note}</Badge>
          <Link
            href="/master/classes"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Classes
          </Link>
          <Link
            href="/master/sections"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Sections
          </Link>
          <Link
            href="/master/subjects"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Subjects
          </Link>
          <Link
            href="/hr/directory"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Staff
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Timetable readiness checks</CardTitle>
            <CardDescription>
              A practical substitute for a schedule engine until period and room schema lands.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ReadinessRow
              label="Class master coverage"
              value={`${classes.length} classes / ${sections.length} sections`}
              tone={classes.length > 0 && sections.length > 0 ? "good" : "warn"}
            />
            <ReadinessRow
              label="Subject spread"
              value={`${subjects.length} subjects (${subjectDensity.toFixed(1)} per class avg.)`}
              tone={subjects.length > 0 ? "good" : "warn"}
            />
            <ReadinessRow
              label="Teacher-designation staff"
              value={`${teacherPool.length} active staff`}
              tone={teacherPool.length > 0 ? "good" : "warn"}
            />
            <ReadinessRow
              label="Recent class diary coverage"
              value={`${recentDiary.length} diary entries / ${sectionsMissingDiary.length} sections without recent diary`}
              tone={sectionsMissingDiary.length === 0 ? "good" : "warn"}
            />
            <ReadinessRow
              label="Recent homework flow"
              value={`${recentHomework.length} homework entries in 7 days`}
              tone={recentHomework.length > 0 ? "good" : "warn"}
            />
            <ReadinessRow
              label="Exam-calendar pressure"
              value={`${exams.length} recent exam setup record(s)`}
              tone={exams.length > 0 ? "good" : "neutral"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planning guidance</CardTitle>
            <CardDescription>
              What to do now, depending on the timetable workflow you opened.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {guidanceForMode(mode).map((text) => (
              <PromptBlock key={text} text={text} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Class and section planning table</CardTitle>
            <CardDescription>
              Useful for class-wise timetable, room allocation, and auto-generation prep.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No classes configured yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Sections</TableHead>
                      <TableHead className="text-right">Subject density</TableHead>
                      <TableHead>Timetable cue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {sectionCounts.get(cls.id) ?? 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {subjects.length}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mode === "rooms"
                            ? "Estimate room slots and shared-space pressure."
                            : mode === "conflicts"
                              ? "Check whether the class has enough sections and teacher coverage."
                              : "Use this as the starting block for period planning."}
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
            <CardTitle>
              {mode === "teacher" || mode === "substitutes"
                ? "Teacher and substitute signals"
                : "Recent teaching activity"}
            </CardTitle>
            <CardDescription>
              Use recent academic activity as a proxy for where timetable visibility matters most.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "teacher" || mode === "substitutes" ? (
              teacherPool.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active teacher-designation staff found.</p>
              ) : (
                <div className="space-y-3">
                  {teacherPool.slice(0, 12).map((staffRow) => (
                    <div key={staffRow.id} className="rounded-xl border p-4">
                      <p className="font-medium">
                        {[staffRow.firstName, staffRow.lastName].filter(Boolean).join(" ")}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {staffRow.designation ?? "Staff"} • {staffRow.phone ?? "No phone"}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : recentHomework.length === 0 && recentDiary.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent diary or homework activity found.</p>
            ) : (
              <div className="space-y-3">
                {recentHomework.slice(0, 8).map((row) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.section.class.name} {row.section.name}
                      {row.subject ? ` • ${row.subject.name}` : ""}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Recent homework signal that this class is actively using academic planning.
                    </p>
                  </div>
                ))}
                {recentHomework.length === 0
                  ? recentDiary.slice(0, 8).map((row) => (
                      <div key={row.id} className="rounded-xl border p-4">
                        <p className="font-medium">
                          {row.section.class.name} {row.section.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {row.entryDate.toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground mt-2 text-sm">
                          Recent class diary entry can guide timetable balancing.
                        </p>
                      </div>
                    ))
                  : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function guidanceForMode(mode: TimetableMode) {
  switch (mode) {
    case "class":
      return [
        "Group sections by class and identify which subjects need daily vs alternate-day placement.",
        "Use recent homework and diary activity to understand which sections are already operating with stronger teaching rhythm.",
        "The next schema layer can store periods, weekdays, and section-subject slots on top of this planning page.",
      ];
    case "teacher":
      return [
        "Verify the teacher-designation staff pool before assigning periods.",
        "Balance subject-heavy classes first so teacher collisions are easier to detect later.",
        "A future teacher-allocation table can plug into this page without replacing its readiness checks.",
      ];
    case "auto-generate":
      return [
        "Make sure classes, sections, subjects, and teacher masters are complete before generating anything.",
        "Treat missing diary/homework rhythm as a sign the academic structure may still be incomplete.",
        "The next upgrade can add rules like max periods/day, room blocks, and teacher availability.",
      ];
    case "conflicts":
      return [
        "Review low teacher counts, uneven section spread, and missing academic activity before finalizing a timetable.",
        "Use this page to spot risk early even before hard conflict logic exists.",
        "Room and substitute data can later strengthen conflict detection without changing this workflow.",
      ];
    case "substitutes":
      return [
        "Keep a visible teacher pool and recent class activity list to respond faster to absences.",
        "Sections with active diary/homework patterns are good candidates for substitute-prep priority.",
        "A later leave/substitute action layer can attach directly to this workspace.",
      ];
    case "rooms":
      return [
        "Use class and section spread as the first indicator for room pressure.",
        "Track shared spaces and special rooms once dedicated room masters are added.",
        "This page can evolve into a room-period allocation board when timetable schema lands.",
      ];
  }
}

function ReadinessRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "neutral";
}) {
  const variant = tone === "good" ? "secondary" : "outline";
  return (
    <div className="flex items-center justify-between rounded-xl border p-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground text-sm">{value}</p>
      </div>
      <Badge variant={variant}>{tone === "good" ? "Ready" : tone === "warn" ? "Watch" : "Info"}</Badge>
    </div>
  );
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}
