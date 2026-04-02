import {
  addEnquiryFollowUpLog,
  updateEnquiryFollowUp,
} from "@/app/(erp)/actions/admissions";
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
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type FollowUpPageProps = {
  preselectedEnquiryId?: string;
};

export async function AdmissionsFollowUpPage({
  preselectedEnquiryId,
}: FollowUpPageProps = {}) {
  const session = await getCurrentSession();
  const enquiries = session
    ? await prisma.enquiry.findMany({
        where: {
          sessionId: session.id,
          status: { not: "LOST" },
        },
        orderBy: [{ nextFollowUp: "asc" }, { createdAt: "desc" }],
      })
    : [];

  const sorted = [...enquiries].sort((a, b) => {
    if (a.nextFollowUp && b.nextFollowUp) {
      return a.nextFollowUp.getTime() - b.nextFollowUp.getTime();
    }
    if (a.nextFollowUp) return -1;
    if (b.nextFollowUp) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const ids = sorted.map((e) => e.id);
  const allLogs =
    session && ids.length > 0
      ? await prisma.enquiryFollowUp.findMany({
          where: { enquiryId: { in: ids } },
          orderBy: { createdAt: "desc" },
          include: { createdBy: { select: { name: true, email: true } } },
        })
      : [];

  const logsByEnquiry = new Map<string, typeof allLogs>();
  for (const log of allLogs) {
    const list = logsByEnquiry.get(log.enquiryId) ?? [];
    if (list.length >= 5) continue;
    list.push(log);
    logsByEnquiry.set(log.enquiryId, list);
  }

  const logEnquiryOptions = session
    ? await prisma.enquiry.findMany({
        where: { sessionId: session.id, status: { not: "LOST" } },
        orderBy: { childName: "asc" },
        select: { id: true, childName: true, phone: true },
      })
    : [];

  const openIds = new Set(logEnquiryOptions.map((q) => q.id));
  const defaultEnquiryId =
    preselectedEnquiryId && openIds.has(preselectedEnquiryId)
      ? preselectedEnquiryId
      : "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log a touchpoint</CardTitle>
          <CardDescription>
            Creates a structured follow-up record (call / WhatsApp / visit). Optionally sets
            the next follow-up on the enquiry and moves NEW → FOLLOW_UP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No session.</p>
          ) : logEnquiryOptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No open enquiries.</p>
          ) : (
            <form action={addEnquiryFollowUpLog} className="grid max-w-xl gap-4">
              <div className="grid gap-2">
                <Label htmlFor="log-enquiry">Enquiry</Label>
                <select
                  id="log-enquiry"
                  name="enquiryId"
                  required
                  key={defaultEnquiryId || "none"}
                  defaultValue={defaultEnquiryId}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                >
                  <option value="">Select…</option>
                  {logEnquiryOptions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.childName} · {q.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="log-channel">Channel</Label>
                  <select
                    id="log-channel"
                    name="channel"
                    defaultValue="CALL"
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  >
                    <option value="CALL">Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="VISIT">Visit</option>
                    <option value="EMAIL">Email</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="log-next">Next follow-up (optional)</Label>
                  <Input id="log-next" name="nextFollowUp" type="datetime-local" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="log-summary">Summary</Label>
                <textarea
                  id="log-summary"
                  name="summary"
                  required
                  rows={3}
                  placeholder="What was discussed, outcome, objections…"
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                />
              </div>
              <Button type="submit" className="w-fit">
                Save log
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up tracker</CardTitle>
          <CardDescription>
            Enquiries excluding LOST, ordered by next follow-up. Update dates after each
            call or visit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No session configured.</p>
          ) : sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm">No open enquiries.</p>
          ) : (
            <div className="space-y-8">
              {sorted.map((e) => (
                <div
                  key={e.id}
                  className="border-border rounded-lg border p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{e.childName}</span>
                    <Badge variant="outline">{e.status}</Badge>
                    {e.classSeeking ? (
                      <span className="text-muted-foreground text-sm">
                        → {e.classSeeking}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    {e.parentName ?? "Parent —"} · {e.phone}
                    {e.email ? ` · ${e.email}` : ""}
                  </p>
                  {(() => {
                    const logs = logsByEnquiry.get(e.id) ?? [];
                    if (logs.length === 0) return null;
                    return (
                      <div className="bg-muted/30 mb-4 rounded-md border p-3 text-sm">
                        <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                          Recent logs
                        </p>
                        <ul className="space-y-2">
                          {logs.map((l) => (
                            <li key={l.id} className="border-border/60 border-b pb-2 last:border-0 last:pb-0">
                              <span className="text-muted-foreground text-xs">
                                {l.createdAt.toLocaleString()} · {l.channel}
                                {l.createdBy?.name ? ` · ${l.createdBy.name}` : ""}
                              </span>
                              <p className="mt-0.5">{l.summary}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                  <form action={updateEnquiryFollowUp} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={e.id} />
                    <div className="grid gap-2">
                      <Label htmlFor={`fu-${e.id}`}>Next follow-up</Label>
                      <Input
                        id={`fu-${e.id}`}
                        name="nextFollowUp"
                        type="datetime-local"
                        defaultValue={
                          e.nextFollowUp ? toDatetimeLocalValue(e.nextFollowUp) : ""
                        }
                      />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor={`notes-${e.id}`}>Notes</Label>
                      <textarea
                        id={`notes-${e.id}`}
                        name="notes"
                        rows={2}
                        defaultValue={e.notes ?? ""}
                        className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-fit">
                      Update
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
