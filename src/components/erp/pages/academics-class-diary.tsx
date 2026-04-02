import { upsertClassDiary } from "@/app/(erp)/actions/academics";
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
  dateStr: string | undefined;
};

export async function AcademicsClassDiaryPage({ sectionId, dateStr }: Props) {
  const session = await getCurrentSession();
  const sections = session
    ? await prisma.section.findMany({
        where: { class: { sessionId: session.id } },
        include: { class: true },
        orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
      })
    : [];

  const sid = sectionId ?? sections[0]?.id;
  const dateVal = dateStr && dateStr.length >= 10 ? dateStr.slice(0, 10) : todayYmd();
  const entryDate = parseUtc(dateVal);

  let existing: Awaited<
    ReturnType<typeof prisma.classDiaryEntry.findUnique>
  > = null;
  if (sid) {
    existing = await prisma.classDiaryEntry.findUnique({
      where: { sectionId_entryDate: { sectionId: sid, entryDate } },
    });
  }

  const recent =
    session && sid
      ? await prisma.classDiaryEntry.findMany({
          where: { sectionId: sid },
          orderBy: { entryDate: "desc" },
          take: 20,
        })
      : [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Class diary</CardTitle>
          <CardDescription>
            One note per section per day — topics covered, behaviour, reminders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session || sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">Session and sections required.</p>
          ) : (
            <form action={upsertClassDiary} className="grid max-w-2xl gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
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
                  <Label htmlFor="entryDate">Date</Label>
                  <Input
                    id="entryDate"
                    name="entryDate"
                    type="date"
                    required
                    defaultValue={dateVal}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">Diary entry</Label>
                <textarea
                  id="summary"
                  name="summary"
                  rows={6}
                  required
                  defaultValue={existing?.summary ?? ""}
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                  placeholder="What was taught today, homework given, class notes…"
                />
              </div>
              <Button type="submit" className="w-fit">
                {existing ? "Update diary" : "Save diary"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {sid ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last 20 entries (this section)</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">No diary history yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {r.entryDate.toISOString().slice(0, 10)}
                      </TableCell>
                      <TableCell className="max-w-xl text-sm whitespace-pre-wrap">
                        {r.summary}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
