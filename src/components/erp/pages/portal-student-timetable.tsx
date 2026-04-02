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
import { getParentPortalContext, parentCanViewStudent } from "@/lib/parent-portal";
import { getCurrentSession } from "@/lib/session-context";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type Props = { studentId?: string };

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

export async function PortalStudentTimetablePage({ studentId }: Props) {
  const ctx = await getParentPortalContext();
  const session = await getCurrentSession();

  if (!ctx) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timetable</CardTitle>
          <CardDescription>
            <Link
              href="/portal/student"
              className="text-primary text-sm underline-offset-4 hover:underline"
            >
              Open student portal
            </Link>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!studentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timetable</CardTitle>
          <CardDescription>Pick a student from the portal home.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/portal/student" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Back
          </Link>
        </CardContent>
      </Card>
    );
  }

  const allowed = await parentCanViewStudent(ctx.parentId, studentId);
  if (!allowed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not available</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      section: { include: { class: true } },
      parents: { include: { parent: true } },
    },
  });

  const today = parseUtcDate(localCalendarYmd());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const [recentHomework, recentDiary, recentExams, sectionStudentCount] =
    student?.sectionId && session
      ? await Promise.all([
          prisma.homeworkEntry.findMany({
            where: {
              sessionId: session.id,
              sectionId: student.sectionId,
              assignedOn: { gte: sevenDaysAgo, lte: today },
            },
            include: { subject: true },
            orderBy: { assignedOn: "desc" },
            take: 8,
          }),
          prisma.classDiaryEntry.findMany({
            where: {
              sessionId: session.id,
              sectionId: student.sectionId,
              entryDate: { gte: sevenDaysAgo, lte: today },
            },
            orderBy: { entryDate: "desc" },
            take: 5,
          }),
          prisma.exam.findMany({
            where: { sessionId: session.id },
            orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
            take: 5,
          }),
          prisma.student.count({
            where: { sessionId: session.id, sectionId: student.sectionId, isActive: true },
          }),
        ])
      : [[], [], [], 0];

  const studentName = [student?.firstName, student?.lastName].filter(Boolean).join(" ");
  const sectionLabel = student?.section
    ? `${student.section.class.name} ${student.section.name}`
    : "Section not assigned";
  const parentPhone = student?.parents[0]?.parent.phonePrimary ?? null;

  return (
    <div className="space-y-6">
      <Link href="/portal/student" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        ← Student portal
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Timetable · {studentName}</CardTitle>
          <CardDescription>
            {sectionLabel}. The detailed period grid is still pending in the database, but the
            portal can already show timetable-readiness signals for this student’s class.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Session-aware timetable preview</Badge>
          <Link
            href={`/portal/student/homework?studentId=${studentId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Homework
          </Link>
          <Link
            href={`/portal/student/attendance?studentId=${studentId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Attendance
          </Link>
          {studentId ? (
            <Link
              href={`/portal/student/fees?studentId=${studentId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Fees
            </Link>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Section" value={sectionLabel} />
        <MetricCard title="Class size" value={String(sectionStudentCount)} />
        <MetricCard title="Homework in 7 days" value={String(recentHomework.length)} />
        <MetricCard title="Diary entries in 7 days" value={String(recentDiary.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>What the portal can show now</CardTitle>
            <CardDescription>
              Until the period-by-period timetable schema is added, the portal uses live academic
              activity to help families understand class rhythm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label="Recent class rhythm"
              value={
                recentDiary.length > 0
                  ? `${recentDiary.length} diary updates in the last 7 days`
                  : "No recent class diary updates recorded"
              }
            />
            <InfoRow
              label="Recent homework flow"
              value={
                recentHomework.length > 0
                  ? `${recentHomework.length} homework entries in the last 7 days`
                  : "No recent homework entries recorded"
              }
            />
            <InfoRow
              label="Exam calendar"
              value={
                recentExams.length > 0
                  ? `${recentExams.length} exam setup record(s) available in the current session`
                  : "No exam setup records available yet"
              }
            />
            <InfoRow
              label="Parent support route"
              value={
                parentPhone
                  ? `Primary parent contact on file: ${parentPhone}`
                  : "Parent contact is not linked on the student profile"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What’s coming next</CardTitle>
            <CardDescription>
              The full timetable grid will appear once period, weekday, room, and teacher-slot
              tables are added.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PromptBlock text="The portal will later show a day-wise period grid for this class and section." />
            <PromptBlock text="Teacher names, substitute updates, and room mapping can plug into this page once timetable tables exist." />
            <PromptBlock text="Until then, homework, attendance, notices, and class activity remain the best live guidance for daily planning." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent homework linked to timetable planning</CardTitle>
            <CardDescription>
              Helpful for parents and students until the period grid lands.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentHomework.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent homework recorded for this section.</p>
            ) : (
              <div className="space-y-3">
                {recentHomework.map((row) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.subject?.name ?? "General"} • {row.assignedOn.toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">
                      This is one of the latest academic tasks given to the section.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent class updates</CardTitle>
            <CardDescription>
              Diary and exam signals that help explain the current school rhythm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentDiary.length === 0 && recentExams.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent class or exam updates available yet.</p>
            ) : (
              <div className="space-y-3">
                {recentDiary.map((row) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <p className="font-medium">Class diary update</p>
                    <p className="text-muted-foreground text-xs">
                      {row.entryDate.toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">{row.summary}</p>
                  </div>
                ))}
                {recentExams.slice(0, 3).map((row) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Upcoming or recent exam planning is active for this session.
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

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground mt-1 text-sm">{value}</p>
    </div>
  );
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}
