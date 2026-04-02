import { createHomeworkEntry, deleteHomeworkEntry } from "@/app/(erp)/actions/academics";
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

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseUtc(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

type Props = {
  sectionId: string | undefined;
  fromStr: string | undefined;
  toStr: string | undefined;
};

export async function AcademicsHomeworkPage({ sectionId, fromStr, toStr }: Props) {
  const session = await getCurrentSession();
  const sections = session
    ? await prisma.section.findMany({
        where: { class: { sessionId: session.id } },
        include: { class: true },
        orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
      })
    : [];

  const subjects = session
    ? await prisma.subject.findMany({
        where: { sessionId: session.id },
        orderBy: { name: "asc" },
      })
    : [];

  const sid = sectionId ?? sections[0]?.id;
  const toDefault = todayYmd();
  const fromDefault = (() => {
    const t = parseUtc(toDefault);
    t.setUTCDate(t.getUTCDate() - 14);
    return t.toISOString().slice(0, 10);
  })();

  const fromDate = fromStr && fromStr.length >= 10 ? fromStr.slice(0, 10) : fromDefault;
  const toDate = toStr && toStr.length >= 10 ? toStr.slice(0, 10) : toDefault;
  const fromD = parseUtc(fromDate);
  const toD = parseUtc(toDate);

  const entries =
    session && sid
      ? await prisma.homeworkEntry.findMany({
          where: {
            sessionId: session.id,
            sectionId: sid,
            assignedOn: { gte: fromD, lte: toD },
          },
          include: { subject: true },
          orderBy: [{ assignedOn: "desc" }, { createdAt: "desc" }],
        })
      : [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Assign homework / classwork</CardTitle>
          <CardDescription>
            Log assignments visible to teachers and (later) parents for the selected
            section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No session.</p>
          ) : sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">Add sections under Master Setup.</p>
          ) : (
            <form action={createHomeworkEntry} className="grid max-w-xl gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sectionId">Section</Label>
                <select
                  id="sectionId"
                  name="sectionId"
                  required
                  defaultValue={sid}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.class.name} {sec.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subjectId">Subject (optional)</Label>
                <select
                  id="subjectId"
                  name="subjectId"
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                >
                  <option value="">—</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="kind">Type</Label>
                  <select
                    id="kind"
                    name="kind"
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  >
                    <option value="HOMEWORK">Homework</option>
                    <option value="CLASSWORK">Classwork</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignedOn">Assigned on</Label>
                  <Input
                    id="assignedOn"
                    name="assignedOn"
                    type="date"
                    required
                    defaultValue={todayYmd()}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due date (optional)</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="e.g. Maths worksheet ch. 4" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Details</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[72px] w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                  placeholder="Instructions, links, page numbers…"
                />
              </div>
              <Button type="submit" className="w-fit">
                Publish assignment
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent assignments</CardTitle>
          <CardDescription>Filter by section and date range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session && sections.length > 0 ? (
            <form className="flex flex-wrap items-end gap-3" method="get" action="/academics/homework">
              <div className="grid gap-2">
                <Label>Section</Label>
                <select
                  name="sectionId"
                  defaultValue={sid ?? ""}
                  className="border-input bg-background h-9 min-w-[180px] rounded-md border px-3 text-sm"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.class.name} {sec.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>From</Label>
                <Input name="from" type="date" defaultValue={fromDate} />
              </div>
              <div className="grid gap-2">
                <Label>To</Label>
                <Input name="to" type="date" defaultValue={toDate} />
              </div>
              <Button type="submit" variant="secondary">
                Apply
              </Button>
            </form>
          ) : null}

          {!sid ? null : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No entries in this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {e.assignedOn.toISOString().slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{e.kind}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="font-medium">{e.title}</div>
                        {e.description ? (
                          <div className="text-muted-foreground line-clamp-2 text-xs">
                            {e.description}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{e.subject?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {e.dueDate ? e.dueDate.toISOString().slice(0, 10) : "—"}
                      </TableCell>
                      <TableCell>
                        <form action={deleteHomeworkEntry}>
                          <input type="hidden" name="id" value={e.id} />
                          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                            Delete
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
    </div>
  );
}
