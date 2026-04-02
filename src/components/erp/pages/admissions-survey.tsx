import Link from "next/link";

import { addSurveyEntry, startSurvey } from "@/app/(erp)/actions/surveys";
import { SurveyLocationFields } from "@/components/erp/survey-location-fields";
import { buttonVariants } from "@/components/ui/button-variants";
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
import { cn } from "@/lib/utils";

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30";

type Props = {
  surveyId?: string;
};

export async function AdmissionsSurveyPage({ surveyId }: Props) {
  const session = await getCurrentSession();

  const surveys = session
    ? await prisma.survey.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          staffUser: { select: { name: true } },
          _count: { select: { entries: true } },
        },
      })
    : [];

  const activeSurvey =
    surveyId && session
      ? await prisma.survey.findFirst({
          where: { id: surveyId, sessionId: session.id },
          include: {
            staffUser: { select: { name: true } },
            entries: {
              orderBy: { createdAt: "desc" },
              include: {
                enquiry: { select: { id: true, childName: true } },
              },
            },
          },
        })
      : null;

  const classes = session
    ? await prisma.class.findMany({
        where: { sessionId: session.id },
        orderBy: { sortOrder: "asc" },
        select: { name: true },
      })
    : [];

  return (
    <div className="space-y-6">
      {!session ? (
        <p className="text-muted-foreground text-sm">
          Create an academic session under Master Setup before running field surveys.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Start a survey run</CardTitle>
              <CardDescription>
                Log each outing (area or route). Then open the run to add households with optional
                GPS and one-click enquiry creation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={startSurvey} className="grid max-w-xl gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="areaTag">Area / route tag</Label>
                  <Input
                    id="areaTag"
                    name="areaTag"
                    placeholder="e.g. Sector 12 · Rohini"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="surveyNotes">Notes</Label>
                  <textarea
                    id="surveyNotes"
                    name="notes"
                    rows={3}
                    className={cn(
                      "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] dark:bg-input/30",
                    )}
                    placeholder="Team, vehicle, weather, etc."
                  />
                </div>
                <Button type="submit">Start survey</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent survey runs</CardTitle>
              <CardDescription>
                Session {session.name} · {surveys.length} run(s) listed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {surveys.length === 0 ? (
                <p className="text-muted-foreground text-sm">No surveys yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Started</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Staff</TableHead>
                        <TableHead className="text-right">Entries</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {surveys.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {s.createdAt.toLocaleString()}
                          </TableCell>
                          <TableCell>{s.areaTag ?? "—"}</TableCell>
                          <TableCell>{s.staffUser?.name ?? "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {s._count.entries}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/admissions/survey?surveyId=${s.id}`}
                              className={buttonVariants({ variant: "outline", size: "sm" })}
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

          {activeSurvey ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Survey run</CardTitle>
                    <CardDescription>
                      {activeSurvey.areaTag ?? "No area tag"} · started{" "}
                      {activeSurvey.createdAt.toLocaleString()} ·{" "}
                      {activeSurvey.staffUser?.name ?? "Unknown staff"}
                    </CardDescription>
                  </div>
                  <Link
                    href="/admissions/survey"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Back to list
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="mb-3 text-sm font-medium">Add household / lead</h3>
                  <form action={addSurveyEntry} className="grid max-w-2xl gap-4">
                    <input type="hidden" name="surveyId" value={activeSurvey.id} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="childName">Child name</Label>
                        <Input id="childName" name="childName" required placeholder="Full name" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          placeholder="+91…"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="parentName">Parent / guardian</Label>
                        <Input id="parentName" name="parentName" placeholder="Optional" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="classSeeking">Class seeking</Label>
                        <select id="classSeeking" name="classSeeking" className={selectClass}>
                          <option value="">Select…</option>
                          {classes.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="interestLevel">Interest</Label>
                        <select id="interestLevel" name="interestLevel" className={selectClass}>
                          <option value="">Select…</option>
                          <option value="Hot">Hot</option>
                          <option value="Warm">Warm</option>
                          <option value="Cold">Cold</option>
                          <option value="Follow-up later">Follow-up later</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Location (optional)</Label>
                      <SurveyLocationFields />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="entryNotes">Notes</Label>
                      <textarea
                        id="entryNotes"
                        name="entryNotes"
                        rows={2}
                        className={cn(
                          "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] dark:bg-input/30",
                        )}
                        placeholder="Door no., landmark, conversation summary"
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="createEnquiry"
                        className="border-input size-4 rounded border"
                      />
                      Also create an enquiry in CRM (same phone and child)
                    </label>
                    <Button type="submit">Save entry</Button>
                  </form>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium">Entries in this run</h3>
                  {activeSurvey.entries.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No entries yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Child</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Interest</TableHead>
                            <TableHead>GPS</TableHead>
                            <TableHead>CRM</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeSurvey.entries.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell className="whitespace-nowrap text-xs">
                                {e.createdAt.toLocaleString()}
                              </TableCell>
                              <TableCell>{e.childName}</TableCell>
                              <TableCell className="font-mono text-xs">{e.phone}</TableCell>
                              <TableCell>{e.interestLevel ?? "—"}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {e.latitude != null && e.longitude != null
                                  ? `${Number(e.latitude).toFixed(5)}, ${Number(e.longitude).toFixed(5)}`
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                {e.enquiry ? (
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
                                    <Link
                                      href={`/admissions/follow-up?enquiryId=${e.enquiry.id}`}
                                      className="text-primary underline-offset-4 hover:underline"
                                    >
                                      Follow-up
                                    </Link>
                                    <Link
                                      href={`/admissions/enquiry-list?enquiryId=${e.enquiry.id}`}
                                      className="text-primary underline-offset-4 hover:underline"
                                    >
                                      List
                                    </Link>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : surveyId ? (
            <p className="text-muted-foreground text-sm">
              Survey not found for this session.{" "}
              <Link href="/admissions/survey" className="text-primary underline-offset-4 hover:underline">
                Return to surveys
              </Link>
              .
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
