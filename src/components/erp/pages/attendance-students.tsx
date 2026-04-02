import { saveSectionAttendance } from "@/app/(erp)/actions/attendance";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const STATUS_OPTIONS = [
  { value: "UNMARKED", label: "—" },
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "HALF_DAY", label: "Half day" },
  { value: "ON_LEAVE", label: "On leave" },
] as const;

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateUtc(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

type Props = {
  sectionId: string | undefined;
  dateStr: string | undefined;
};

export async function AttendanceStudentsPage({ sectionId, dateStr }: Props) {
  const session = await getCurrentSession();
  const dateValue = dateStr && dateStr.length >= 10 ? dateStr.slice(0, 10) : todayYmd();
  const attendanceDate = parseDateUtc(dateValue);

  const sections = session
    ? await prisma.section.findMany({
        where: { class: { sessionId: session.id } },
        include: { class: true },
        orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
      })
    : [];

  const selectedSectionId = sectionId ?? sections[0]?.id;
  const students =
    session && selectedSectionId
      ? await prisma.student.findMany({
          where: {
            sessionId: session.id,
            sectionId: selectedSectionId,
            isActive: true,
          },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        })
      : [];

  const attendanceRows =
    students.length > 0
      ? await prisma.studentAttendance.findMany({
          where: {
            studentId: { in: students.map((s) => s.id) },
            date: attendanceDate,
          },
        })
      : [];

  const statusByStudent = new Map(attendanceRows.map((r) => [r.studentId, r.status]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student attendance</CardTitle>
          <CardDescription>
            Mark one section per date. Saved rows are stored per student per day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add classes and sections under Master Setup.
            </p>
          ) : (
            <>
              <form className="flex flex-wrap items-end gap-4" method="get" action="/attendance/students">
                <div className="grid gap-2">
                  <Label htmlFor="pick-section">Section</Label>
                  <select
                    id="pick-section"
                    name="sectionId"
                    defaultValue={selectedSectionId ?? ""}
                    className="border-input bg-background h-9 min-w-[200px] rounded-md border px-3 text-sm"
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.class.name} {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pick-date">Date</Label>
                  <input
                    id="pick-date"
                    name="date"
                    type="date"
                    defaultValue={dateValue}
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Load
                </Button>
              </form>

              {selectedSectionId && students.length > 0 ? (
                <form action={saveSectionAttendance} className="space-y-4">
                  <input type="hidden" name="sectionId" value={selectedSectionId} />
                  <input type="hidden" name="date" value={dateValue} />
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admission no.</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="min-w-[160px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s) => {
                          const current = statusByStudent.get(s.id);
                          const defaultVal = current ?? "UNMARKED";
                          return (
                            <TableRow key={s.id}>
                              <TableCell className="font-mono text-xs">
                                {s.admissionNo ?? "—"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {[s.firstName, s.lastName].filter(Boolean).join(" ")}
                              </TableCell>
                              <TableCell>
                                <select
                                  name={`status_${s.id}`}
                                  defaultValue={defaultVal}
                                  className="border-input bg-background h-9 w-full max-w-[200px] rounded-md border px-3 text-sm"
                                >
                                  {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <Button type="submit">Save attendance</Button>
                </form>
              ) : selectedSectionId ? (
                <p className="text-muted-foreground text-sm">No students in this section.</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
