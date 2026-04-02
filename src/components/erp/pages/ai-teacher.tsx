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

function buildWeakStudentRows(
  marks: Array<{
    studentId: string;
    marksObtained: unknown;
    maxMarks: unknown;
    student: {
      id: string;
      firstName: string;
      lastName: string | null;
      admissionNo: string | null;
      section: { name: string; class: { name: string } } | null;
    };
  }>,
) {
  const byStudent = new Map<
    string,
    {
      student: (typeof marks)[number]["student"];
      sumGot: number;
      sumMax: number;
    }
  >();

  for (const row of marks) {
    const max = Number(row.maxMarks);
    const got = Number(row.marksObtained);
    if (max <= 0) continue;
    const current = byStudent.get(row.studentId) ?? {
      student: row.student,
      sumGot: 0,
      sumMax: 0,
    };
    current.sumGot += got;
    current.sumMax += max;
    byStudent.set(row.studentId, current);
  }

  return [...byStudent.values()]
    .filter((row) => row.sumMax > 0)
    .map((row) => ({
      ...row,
      pct: (row.sumGot / row.sumMax) * 100,
    }))
    .filter((row) => row.pct < 40)
    .sort((a, b) => a.pct - b.pct);
}

export async function AiTeacherPage() {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const todayYmd = localCalendarYmd();
  const today = parseUtcDate(todayYmd);
  const lastWeek = new Date(today);
  lastWeek.setUTCDate(lastWeek.getUTCDate() - 6);

  const [sections, diaryToday, homeworkRecent, latestExam, contentSummary] =
    await Promise.all([
      prisma.section.findMany({
        where: { class: { sessionId: session.id } },
        include: { class: true },
        orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
      }),
      prisma.classDiaryEntry.findMany({
        where: { sessionId: session.id, entryDate: today },
        select: { sectionId: true },
      }),
      prisma.homeworkEntry.findMany({
        where: { sessionId: session.id, assignedOn: { gte: lastWeek, lte: today } },
        include: {
          section: { include: { class: true } },
          subject: true,
        },
        orderBy: { assignedOn: "desc" },
        take: 30,
      }),
      prisma.exam.findFirst({
        where: { sessionId: session.id },
        orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
        include: {
          marks: {
            include: {
              student: {
                include: { section: { include: { class: true } } },
              },
            },
          },
        },
      }),
      Promise.all([
        prisma.contentAsset.count(),
        prisma.contentMapping.count({ where: { sessionId: session.id } }),
        prisma.contentUsage.count({
          where: { sessionId: session.id, usedAt: { gte: lastWeek } },
        }),
      ]),
    ]);

  const diarySectionIds = new Set(diaryToday.map((row) => row.sectionId));
  const diaryGaps = sections.filter((section) => !diarySectionIds.has(section.id));
  const weakStudents = buildWeakStudentRows(latestExam?.marks ?? []).slice(0, 8);
  const [contentAssetCount, contentMappingCount, contentUsageLast7d] = contentSummary;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sections pending class diary</CardDescription>
            <CardTitle className="text-2xl">{diaryGaps.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Homework posted in 7 days</CardDescription>
            <CardTitle className="text-2xl">{homeworkRecent.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weak students in latest exam</CardDescription>
            <CardTitle className="text-2xl">{weakStudents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Smart content usage (7d)</CardDescription>
            <CardTitle className="text-2xl">{contentUsageLast7d}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Teacher AI action queue</CardTitle>
            <CardDescription>
              AI-ready teaching priorities built from live diary, homework, smart content, and exam
              data for session {session.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <ActionCard
              title="Close teaching-day gaps"
              description={`${diaryGaps.length} section${diaryGaps.length === 1 ? "" : "s"} still need a daily class note for ${todayYmd}.`}
              href={diaryGaps[0] ? `/academics/daily-class-taken?sectionId=${diaryGaps[0].id}&date=${todayYmd}` : "/academics/daily-class-taken"}
              cta="Open class diary"
            />
            <ActionCard
              title="Assign targeted homework"
              description={`${weakStudents.length} students are below 40% in the latest exam and should receive remedial worksheets or chapter-level follow-up.`}
              href="/academics/homework"
              cta="Plan homework"
            />
            <ActionCard
              title="Use mapped smart content"
              description={`${contentMappingCount} curriculum mappings and ${contentAssetCount} catalog assets are available for AI-assisted lesson planning.`}
              href="/academics/smart-content"
              cta="Open smart content"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teacher AI prompt starters</CardTitle>
            <CardDescription>
              Reuse these prompts inside your AI tools or future in-product copilots.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PromptBlock text="Create a remedial lesson plan for students below 40% in the latest exam, grouped by chapter weakness and section." />
            <PromptBlock text="Generate differentiated homework from this week's class diary topics, with easy, standard, and challenge tasks." />
            <PromptBlock text="Recommend Pearson or LEAD content for the next class based on subject, class, and recent usage gaps." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Daily class diary coverage</CardTitle>
            <CardDescription>
              Sections without a diary entry today are good candidates for teacher AI nudges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diaryGaps.length === 0 ? (
              <p className="text-muted-foreground text-sm">All sections have a diary entry for today.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>AI suggestion</TableHead>
                      <TableHead className="w-[120px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diaryGaps.map((section) => (
                      <TableRow key={section.id}>
                        <TableCell className="font-medium">
                          {section.class.name} {section.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          Draft a class summary, topics covered, and homework before day close.
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/academics/daily-class-taken?sectionId=${section.id}&date=${todayYmd}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Open
                          </Link>
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
            <CardTitle>Remedial priority list</CardTitle>
            <CardDescription>
              Based on the latest exam {latestExam ? `(${latestExam.name})` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weakStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No weak-student signal is available right now.</p>
            ) : (
              <div className="space-y-3">
                {weakStudents.map((row) => {
                  const studentName = [row.student.firstName, row.student.lastName]
                    .filter(Boolean)
                    .join(" ");
                  const sectionLabel = row.student.section
                    ? `${row.student.section.class.name} ${row.student.section.name}`
                    : "—";
                  return (
                    <div key={row.student.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{studentName}</p>
                          <p className="text-muted-foreground text-xs">
                            {row.student.admissionNo ?? "—"} • {sectionLabel}
                          </p>
                        </div>
                        <Badge variant="outline">{row.pct.toFixed(1)}%</Badge>
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm">
                        Suggest a chapter-wise worksheet, parent note, and one follow-up content asset.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      <Link
        href={href}
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 inline-flex")}
      >
        {cta}
      </Link>
    </div>
  );
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}
