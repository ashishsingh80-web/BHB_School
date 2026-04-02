import { createBusStop, deleteBusStop } from "@/app/(erp)/actions/transport-routes";
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

export async function TransportStopsPage() {
  const session = await getCurrentSession();
  const stops = session
    ? await prisma.busStop.findMany({
        where: { sessionId: session.id },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      })
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bus stops</CardTitle>
          <CardDescription>
            Master list of pickup and drop points. Add stops here, then attach them to routes in
            order under Transport → Routes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : (
            <>
              <form action={createBusStop} className="mb-8 grid max-w-2xl gap-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="name">Stop name</Label>
                    <Input id="name" name="name" required placeholder="e.g. Sector 12 turning" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sortOrder">Sort</Label>
                    <Input
                      id="sortOrder"
                      name="sortOrder"
                      type="number"
                      defaultValue={0}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="grid max-w-md gap-2">
                  <Label htmlFor="area">Area / landmark</Label>
                  <Input id="area" name="area" placeholder="Optional" />
                </div>
                <Button type="submit" className="w-fit">
                  Add stop
                </Button>
              </form>

              {stops.length === 0 ? (
                <p className="text-muted-foreground text-sm">No stops yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead className="w-[100px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stops.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.sortOrder}</TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {s.area ?? "—"}
                          </TableCell>
                          <TableCell>
                            <form action={deleteBusStop}>
                              <input type="hidden" name="id" value={s.id} />
                              <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                                Remove
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
