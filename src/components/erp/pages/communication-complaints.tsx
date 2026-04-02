import {
  createComplaintTicket,
  updateComplaintTicketStatus,
} from "@/app/(erp)/actions/complaints";
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
import { cn } from "@/lib/utils";

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30";

function statusVariant(s: string) {
  if (s === "CLOSED") return "secondary" as const;
  if (s === "IN_PROGRESS") return "default" as const;
  return "outline" as const;
}

export async function CommunicationComplaintsPage() {
  const session = await getCurrentSession();
  const tickets = session
    ? await prisma.complaintTicket.findMany({
        where: { sessionId: session.id },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 150,
      })
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Complaint tracking</CardTitle>
          <CardDescription>
            Log calls, visits, or written grievances. Contact fields help the office reach the
            complainant back.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : (
            <form action={createComplaintTicket} className="mb-10 grid max-w-2xl gap-4">
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required placeholder="Short summary" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="body">Description</Label>
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={5}
                  className={cn(
                    "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] dark:bg-input/30",
                  )}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="raisedByName">Raised by</Label>
                  <Input id="raisedByName" name="raisedByName" placeholder="Name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="Optional" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="Optional" />
                </div>
              </div>
              <Button type="submit" className="w-fit">
                Log complaint
              </Button>
            </form>
          )}

          <h3 className="mb-3 text-sm font-medium">Tickets · session {session?.name ?? "—"}</h3>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tickets yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opened</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="min-w-[200px]">Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {t.createdAt.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{t.subject}</span>
                        <p className="text-muted-foreground mt-1 line-clamp-2 max-w-[280px] text-xs">
                          {t.body}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs">
                        {t.raisedByName ?? "—"}
                        {t.phone ? <span className="block font-mono">{t.phone}</span> : null}
                        {t.email ? <span className="text-muted-foreground block">{t.email}</span> : null}
                      </TableCell>
                      <TableCell>
                        <form
                          action={updateComplaintTicketStatus}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="id" value={t.id} />
                          <select name="status" defaultValue={t.status} className={selectClass}>
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                          <Button type="submit" size="sm" variant="outline" className="h-8">
                            Save
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
