import { createGradeBand, deleteGradeBand } from "@/app/(erp)/actions/grades";
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

export async function ExamsGradeRulesPage() {
  const session = await getCurrentSession();
  const bands = session
    ? await prisma.gradeBand.findMany({
        where: { sessionId: session.id },
        orderBy: [{ minPercent: "desc" }, { sortOrder: "asc" }],
      })
    : [];

  return (
    <div className="space-y-8">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Grade band</CardTitle>
          <CardDescription>
            A student earns a grade if their <strong>percentage</strong> is at least the band&apos;s{" "}
            <strong>Min %</strong>. If several bands match, the one with the{" "}
            <strong>highest</strong> Min % wins (e.g. 92% → A+ if A+ starts at 90).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No session.</p>
          ) : (
            <form action={createGradeBand} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="label">Label</Label>
                <Input id="label" name="label" required placeholder="A+" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minPercent">Minimum % (0–100)</Label>
                <Input
                  id="minPercent"
                  name="minPercent"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  required
                  placeholder="90"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Display order (optional)</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <Button type="submit" className="w-fit">
                Add band
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bands for this session</CardTitle>
          <CardDescription>Sorted by Min % (high to low) for readability.</CardDescription>
        </CardHeader>
        <CardContent>
          {bands.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No bands yet. Add at least one (e.g. A+ at 90, A at 80, …) before report cards show
              letter grades.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead className="text-right">Min %</TableHead>
                  <TableHead className="text-right">Sort</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bands.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.label}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(b.minPercent)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{b.sortOrder}</TableCell>
                    <TableCell>
                      <form action={deleteGradeBand}>
                        <input type="hidden" name="id" value={b.id} />
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
