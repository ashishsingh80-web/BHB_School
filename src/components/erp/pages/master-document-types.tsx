import {
  createDocumentTypeMaster,
  deleteDocumentTypeMaster,
} from "@/app/(erp)/actions/admission-workflow";
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

export async function MasterDocumentTypesPage() {
  const session = await getCurrentSession();
  const rows = session
    ? await prisma.documentTypeMaster.findMany({
        where: { sessionId: session.id },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      })
    : [];

  return (
    <div className="space-y-8">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Document type</CardTitle>
          <CardDescription>
            Defines the admission checklist. New types appear on all open admissions (rows are
            created when the admission form is opened).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No session.</p>
          ) : (
            <form action={createDocumentTypeMaster} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Transfer certificate" />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="requiredForAdmission"
                  name="requiredForAdmission"
                  type="checkbox"
                  defaultChecked
                  className="size-4 rounded border"
                />
                <Label htmlFor="requiredForAdmission" className="font-normal">
                  Required for admission
                </Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <Button type="submit" className="w-fit">
                Add type
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist master — session {session?.name ?? "—"}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No types yet. Add above or run <code className="font-mono text-xs">npm run db:seed</code>
              .
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead className="text-right">Sort</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.requiredForAdmission ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.sortOrder}</TableCell>
                    <TableCell>
                      <form action={deleteDocumentTypeMaster}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                          Delete
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
