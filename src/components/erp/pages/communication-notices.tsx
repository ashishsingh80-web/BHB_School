import {
  createSchoolNotice,
  deleteSchoolNotice,
} from "@/app/(erp)/actions/notices";
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
import { cn } from "@/lib/utils";

export async function CommunicationNoticesPage() {
  const session = await getCurrentSession();
  const notices = session
    ? await prisma.schoolNotice.findMany({
        where: { sessionId: session.id },
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        take: 100,
      })
    : [];

  const now = new Date();
  const defaultPublished = toDatetimeLocalValue(now);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notice board</CardTitle>
          <CardDescription>
            Publish announcements for the current academic session. Pinned notices appear first;
            parents and portals can read these in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">Configure an academic session first.</p>
          ) : (
            <form action={createSchoolNotice} className="mb-10 grid max-w-2xl gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Short headline" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="body">Body</Label>
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={6}
                  placeholder="Full message (Markdown-style line breaks are preserved as plain text)"
                  className={cn(
                    "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] dark:bg-input/30",
                  )}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="publishedAt">Publish at</Label>
                  <Input
                    id="publishedAt"
                    name="publishedAt"
                    type="datetime-local"
                    defaultValue={defaultPublished}
                  />
                </div>
                <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    name="pinned"
                    className="border-input size-4 rounded border"
                  />
                  Pin to top
                </label>
              </div>
              <Button type="submit" className="w-fit">
                Publish notice
              </Button>
            </form>
          )}

          <h3 className="mb-3 text-sm font-medium">Published</h3>
          {notices.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notices yet.</p>
          ) : (
            <ul className="space-y-4">
              {notices.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "border-border rounded-lg border p-4",
                    n.pinned && "bg-muted/30",
                  )}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    {n.pinned ? <Badge variant="secondary">Pinned</Badge> : null}
                    <span className="text-muted-foreground text-xs">
                      {n.publishedAt.toLocaleString()}
                    </span>
                  </div>
                  <pre className="text-muted-foreground mb-3 whitespace-pre-wrap font-sans text-sm">
                    {n.body}
                  </pre>
                  <form action={deleteSchoolNotice}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function toDatetimeLocalValue(d: Date) {
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
