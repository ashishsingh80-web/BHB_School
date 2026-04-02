import {
  createContentAsset,
  createContentMapping,
  deleteContentAsset,
  logContentUsage,
  logStudentContentActivity,
} from "@/app/(erp)/actions/content-assets";
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

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function AcademicsSmartContentPage() {
  const session = await getCurrentSession();

  const [assets, subjects, classes, students, mappings, usage, activity] =
    await Promise.all([
      prisma.contentAsset.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      session
        ? prisma.subject.findMany({
            where: { sessionId: session.id },
            orderBy: { name: "asc" },
          })
        : [],
      session
        ? prisma.class.findMany({
            where: { sessionId: session.id },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          })
        : [],
      session
        ? prisma.student.findMany({
            where: { sessionId: session.id, isActive: true },
            include: { section: { include: { class: true } } },
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
            take: 300,
          })
        : [],
      session
        ? prisma.contentMapping.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: {
              contentAsset: true,
              subject: true,
            },
          })
        : [],
      session
        ? prisma.contentUsage.findMany({
            where: { sessionId: session.id },
            orderBy: { usedAt: "desc" },
            take: 100,
            include: {
              contentAsset: true,
              subject: true,
            },
          })
        : [],
      session
        ? prisma.studentContentActivity.findMany({
            where: { sessionId: session.id },
            orderBy: { occurredAt: "desc" },
            take: 100,
            include: {
              contentAsset: true,
              subject: true,
              student: {
                include: { section: { include: { class: true } } },
              },
            },
          })
        : [],
    ]);

  const usageByAsset = new Map<string, number>();
  const studentActivityByAsset = new Map<string, number>();
  for (const row of usage) {
    usageByAsset.set(row.contentAssetId, (usageByAsset.get(row.contentAssetId) ?? 0) + 1);
  }
  for (const row of activity) {
    studentActivityByAsset.set(
      row.contentAssetId,
      (studentActivityByAsset.get(row.contentAssetId) ?? 0) + 1,
    );
  }

  const now = toDatetimeLocalValue(new Date());

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Catalog assets</CardDescription>
            <CardTitle className="text-2xl">{assets.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Curriculum mappings</CardDescription>
            <CardTitle className="text-2xl">{mappings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usage logs</CardDescription>
            <CardTitle className="text-2xl">{usage.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Student activity logs</CardDescription>
            <CardTitle className="text-2xl">{activity.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content catalog</CardTitle>
            <CardDescription>
              Curate Pearson, LEAD, NCERT, YouTube, or internal content before mapping it into
              teaching plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createContentAsset} className="mb-8 grid max-w-2xl gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Resource name" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Input id="provider" name="provider" placeholder="e.g. Pearson, LEAD, NCERT" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="externalUrl">External URL</Label>
                  <Input id="externalUrl" name="externalUrl" type="url" placeholder="https://…" />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="subjectHint">Subject hint</Label>
                  <Input id="subjectHint" name="subjectHint" placeholder="e.g. Mathematics" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gradeHint">Grade / class hint</Label>
                  <Input id="gradeHint" name="gradeHint" placeholder="e.g. Class 7" />
                </div>
              </div>
              <Button type="submit" className="w-fit">
                Add to catalog
              </Button>
            </form>

            {assets.length === 0 ? (
              <p className="text-muted-foreground text-sm">No catalog entries yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Mapped</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div className="font-medium">{asset.title}</div>
                          {asset.externalUrl ? (
                            <a
                              href={asset.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary text-xs underline-offset-4 hover:underline"
                            >
                              Open source
                            </a>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">{asset.provider ?? "—"}</TableCell>
                        <TableCell className="text-sm">{asset.subjectHint ?? "—"}</TableCell>
                        <TableCell className="tabular-nums">
                          {mappings.filter((row) => row.contentAssetId === asset.id).length}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {(usageByAsset.get(asset.id) ?? 0) +
                            (studentActivityByAsset.get(asset.id) ?? 0)}
                        </TableCell>
                        <TableCell>
                          <form action={deleteContentAsset}>
                            <input type="hidden" name="id" value={asset.id} />
                            <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                              Remove
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

        <Card>
          <CardHeader>
            <CardTitle>Curriculum mapping</CardTitle>
            <CardDescription>
              Link content assets to subject, class, chapter, and topic so teachers can discover
              the right resource faster.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!session ? (
              <p className="text-muted-foreground text-sm">No academic session.</p>
            ) : assets.length === 0 ? (
              <p className="text-muted-foreground text-sm">Add a catalog asset first.</p>
            ) : (
              <form action={createContentMapping} className="grid max-w-2xl gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contentAssetId">Content asset</Label>
                  <select id="contentAssetId" name="contentAssetId" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="subjectId">Subject</Label>
                    <select id="subjectId" name="subjectId" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                      <option value="">—</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="className">Class</Label>
                    <select id="className" name="className" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                      <option value="">—</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.name}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="chapterName">Chapter</Label>
                    <Input id="chapterName" name="chapterName" placeholder="e.g. Fractions" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="topicName">Topic</Label>
                    <Input id="topicName" name="topicName" placeholder="e.g. Equivalent fractions" />
                  </div>
                </div>
                <Button type="submit" className="w-fit">
                  Save mapping
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usage logging</CardTitle>
            <CardDescription>
              Record when a teacher uses smart content in class for visibility and reporting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!session ? (
              <p className="text-muted-foreground text-sm">No academic session.</p>
            ) : assets.length === 0 ? (
              <p className="text-muted-foreground text-sm">Add a catalog asset first.</p>
            ) : (
              <form action={logContentUsage} className="grid max-w-2xl gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="usageContentAssetId">Content asset</Label>
                  <select id="usageContentAssetId" name="contentAssetId" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="usageSubjectId">Subject</Label>
                    <select id="usageSubjectId" name="subjectId" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                      <option value="">—</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="usedByName">Used by</Label>
                    <Input id="usedByName" name="usedByName" placeholder="Teacher name" />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="usedForClass">Class</Label>
                    <Input id="usedForClass" name="usedForClass" placeholder="e.g. Class 6" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="usedForSection">Section</Label>
                    <Input id="usedForSection" name="usedForSection" placeholder="e.g. A" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="durationMinutes">Duration (min)</Label>
                    <Input id="durationMinutes" name="durationMinutes" type="number" min="0" step="1" />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="usageType">Usage type</Label>
                    <select id="usageType" name="usageType" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                      <option value="CLASSROOM">Classroom</option>
                      <option value="HOMEWORK_SUPPORT">Homework support</option>
                      <option value="REMEDIAL">Remedial</option>
                      <option value="REVISION">Revision</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="usedAt">Used at</Label>
                    <Input id="usedAt" name="usedAt" type="datetime-local" defaultValue={now} />
                  </div>
                </div>
                <Button type="submit" className="w-fit">
                  Log usage
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student engagement</CardTitle>
            <CardDescription>
              Capture student-level interaction so smart content can support weak-area detection
              and follow-up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!session ? (
              <p className="text-muted-foreground text-sm">No academic session.</p>
            ) : assets.length === 0 ? (
              <p className="text-muted-foreground text-sm">Add a catalog asset first.</p>
            ) : (
              <form action={logStudentContentActivity} className="grid max-w-2xl gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="activityContentAssetId">Content asset</Label>
                  <select id="activityContentAssetId" name="contentAssetId" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentId">Student</Label>
                  <select id="studentId" name="studentId" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {[student.firstName, student.lastName].filter(Boolean).join(" ")}
                        {student.section ? ` · ${student.section.class.name} ${student.section.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="activitySubjectId">Subject</Label>
                    <select id="activitySubjectId" name="subjectId" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                      <option value="">—</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="activityType">Activity type</Label>
                    <select id="activityType" name="activityType" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
                      <option value="VIEWED">Viewed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="PRACTICE">Practice</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="progressPercent">Progress %</Label>
                    <Input id="progressPercent" name="progressPercent" type="number" min="0" max="100" step="0.01" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scorePercent">Score %</Label>
                    <Input id="scorePercent" name="scorePercent" type="number" min="0" max="100" step="0.01" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="occurredAt">Occurred at</Label>
                    <Input id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={now} />
                  </div>
                </div>
                <Button type="submit" className="w-fit">
                  Log student activity
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent mappings</CardTitle>
            <CardDescription>{mappings.length} mapping row(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {mappings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No mappings yet.</p>
            ) : (
              <div className="space-y-3">
                {mappings.slice(0, 8).map((row) => (
                  <div key={row.id} className="rounded-lg border p-3 text-sm">
                    <div className="font-medium">{row.contentAsset.title}</div>
                    <div className="text-muted-foreground mt-1">
                      {[row.subject?.name, row.className, row.chapterName, row.topicName]
                        .filter(Boolean)
                        .join(" · ") || "Unspecified mapping"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent usage</CardTitle>
            <CardDescription>{usage.length} classroom/support log(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {usage.length === 0 ? (
              <p className="text-muted-foreground text-sm">No usage logs yet.</p>
            ) : (
              <div className="space-y-3">
                {usage.slice(0, 8).map((row) => (
                  <div key={row.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{row.contentAsset.title}</div>
                      <Badge variant="outline">{row.usageType}</Badge>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {[row.usedByName, row.usedForClass, row.usedForSection].filter(Boolean).join(" · ") || "Usage log"}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {row.usedAt.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Student activity</CardTitle>
            <CardDescription>{activity.length} engagement row(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">No student activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 8).map((row) => (
                  <div key={row.id} className="rounded-lg border p-3 text-sm">
                    <div className="font-medium">
                      {[row.student.firstName, row.student.lastName].filter(Boolean).join(" ")}
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {row.contentAsset.title} · {row.activityType}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {[
                        row.progressPercent != null ? `Progress ${Number(row.progressPercent)}%` : null,
                        row.scorePercent != null ? `Score ${Number(row.scorePercent)}%` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || row.occurredAt.toLocaleString()}
                    </div>
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
