import Link from "next/link";

import {
  openAdmissionFromEnquiry,
  updateEnquiryAssignment,
  updateEnquiryStatus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollToEnquiryRow } from "@/components/erp/scroll-to-enquiry-row";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { cn } from "@/lib/utils";

function leadBadgeVariant(t: string | null | undefined) {
  if (t === "HOT") return "default" as const;
  if (t === "WARM") return "secondary" as const;
  if (t === "COLD") return "outline" as const;
  return "secondary" as const;
}

type EnquiryListProps = {
  highlightEnquiryId?: string;
};

export async function AdmissionsEnquiryListPage({
  highlightEnquiryId,
}: EnquiryListProps = {}) {
  const session = await getCurrentSession();
  const [enquiries, staffUsers] = session
    ? await Promise.all([
        prisma.enquiry.findMany({
          where: { sessionId: session.id },
          orderBy: { createdAt: "desc" },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.user.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true },
        }),
      ])
    : [[], []];

  return (
    <Card>
      <ScrollToEnquiryRow enquiryId={highlightEnquiryId} />
      <CardHeader>
        <CardTitle>Enquiry list</CardTitle>
        <CardDescription>
          {session
            ? `Session ${session.name} · ${enquiries.length} record(s)`
            : "No active session"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="text-muted-foreground text-sm">Configure Master → Sessions first.</p>
        ) : enquiries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No enquiries yet. Use{" "}
            <Link href="/admissions/enquiry-entry" className="text-primary underline">
              Enquiry entry
            </Link>{" "}
            to add one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="min-w-[200px]">CRM</TableHead>
                  <TableHead className="w-[200px]">Status</TableHead>
                  <TableHead className="w-[140px]">Admission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enquiries.map((e) => (
                  <TableRow
                    key={e.id}
                    id={`enquiry-row-${e.id}`}
                    className={cn(
                      highlightEnquiryId === e.id &&
                        "bg-primary/8 ring-primary/40 ring-2 ring-inset",
                    )}
                  >
                    <TableCell className="font-medium">{e.childName}</TableCell>
                    <TableCell>{e.parentName ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{e.phone}</TableCell>
                    <TableCell>{e.classSeeking ?? "—"}</TableCell>
                    <TableCell>{e.source ?? "—"}</TableCell>
                    <TableCell>
                      {e.leadTemperature ? (
                        <Badge variant={leadBadgeVariant(e.leadTemperature)}>
                          {e.leadTemperature}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-xs">
                      {e.assignedTo?.name ?? e.assignedTo?.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {e.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <form
                        action={updateEnquiryAssignment}
                        className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center"
                      >
                        <input type="hidden" name="id" value={e.id} />
                        <select
                          name="leadTemperature"
                          defaultValue={e.leadTemperature ?? ""}
                          className="border-input bg-background h-8 max-w-[100px] rounded-md border px-2 text-xs"
                        >
                          <option value="">Lead —</option>
                          <option value="HOT">Hot</option>
                          <option value="WARM">Warm</option>
                          <option value="COLD">Cold</option>
                        </select>
                        <select
                          name="assignedToId"
                          defaultValue={e.assignedToId ?? ""}
                          className="border-input bg-background h-8 max-w-[140px] rounded-md border px-2 text-xs"
                        >
                          <option value="">Staff —</option>
                          {staffUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                              {u.email ? ` (${u.email})` : ""}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" size="sm" variant="outline" className="h-8">
                          Save CRM
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <form action={updateEnquiryStatus} className="flex flex-wrap items-center gap-1">
                        <input type="hidden" name="id" value={e.id} />
                        <select
                          name="status"
                          defaultValue={e.status}
                          className="border-input bg-background h-8 max-w-[130px] rounded-md border px-2 text-xs"
                        >
                          <option value="NEW">NEW</option>
                          <option value="FOLLOW_UP">FOLLOW_UP</option>
                          <option value="VISIT_SCHEDULED">VISIT_SCHEDULED</option>
                          <option value="REGISTERED">REGISTERED</option>
                          <option value="LOST">LOST</option>
                        </select>
                        <Button type="submit" size="sm" variant="outline" className="h-8">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <form action={openAdmissionFromEnquiry}>
                        <input type="hidden" name="enquiryId" value={e.id} />
                        <Button type="submit" size="sm" variant="secondary" className="h-8">
                          Start admission
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
  );
}
