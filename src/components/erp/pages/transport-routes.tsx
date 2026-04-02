import Link from "next/link";

import {
  addStopToRoute,
  createTransportRoute,
  deleteTransportRoute,
  moveRouteStop,
  removeStopFromRoute,
  updateTransportRoute,
} from "@/app/(erp)/actions/transport-routes";
import { buttonVariants } from "@/components/ui/button-variants";
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

type Props = {
  routeId?: string;
};

export async function TransportRoutesPage({ routeId }: Props) {
  const session = await getCurrentSession();
  const vehicles = await prisma.vehicle.findMany({
    where: { isBlocked: false },
    orderBy: { registrationNo: "asc" },
  });

  const routes = session
    ? await prisma.transportRoute.findMany({
        where: { sessionId: session.id },
        orderBy: { name: "asc" },
        include: {
          defaultVehicle: true,
          _count: { select: { stops: true, studentAssignments: true } },
        },
      })
    : [];

  const selected =
    routeId && routes.some((r) => r.id === routeId)
      ? await prisma.transportRoute.findFirst({
          where: { id: routeId, sessionId: session!.id },
          include: {
            defaultVehicle: true,
            stops: {
              orderBy: { sortOrder: "asc" },
              include: { busStop: true },
            },
          },
        })
      : null;

  const allStops = session
    ? await prisma.busStop.findMany({
        where: { sessionId: session.id },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      })
    : [];

  const stopIdsOnRoute = new Set(selected?.stops.map((s) => s.busStopId) ?? []);
  const stopsToAdd = allStops.filter((s) => !stopIdsOnRoute.has(s.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Routes</CardTitle>
          <CardDescription>
            Define bus routes and the ordered list of stops. Optionally link a default vehicle for
            dispatch reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : (
            <>
              <form action={createTransportRoute} className="mb-8 grid max-w-2xl gap-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="r-name">Route name</Label>
                    <Input id="r-name" name="name" required placeholder="e.g. East zone — morning" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="r-code">Code</Label>
                    <Input id="r-code" name="code" placeholder="Optional short code" />
                  </div>
                </div>
                <div className="grid max-w-md gap-2">
                  <Label htmlFor="r-vehicle">Default vehicle</Label>
                  <select id="r-vehicle" name="defaultVehicleId" className={selectClass}>
                    <option value="">None</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNo}
                        {v.model ? ` · ${v.model}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-fit">
                  Create route
                </Button>
              </form>

              {routes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No routes yet.</p>
              ) : (
                <ul className="mb-8 space-y-2">
                  {routes.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/transport/routes?routeId=${r.id}`}
                        className={cn(
                          buttonVariants({
                            variant: r.id === routeId ? "default" : "outline",
                            size: "sm",
                          }),
                          "inline-flex h-auto min-h-9 flex-wrap items-center gap-2 py-2",
                        )}
                      >
                        <span>{r.name}</span>
                        {r.code ? (
                          <span className="font-mono text-xs opacity-80">{r.code}</span>
                        ) : null}
                        <Badge variant="secondary" className="font-normal">
                          {r._count.stops} stops · {r._count.studentAssignments} students
                        </Badge>
                        {!r.isActive ? (
                          <Badge variant="outline" className="font-normal">
                            inactive
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {selected ? (
                <div className="border-border space-y-6 border-t pt-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selected.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        Edit route details and manage stop sequence.
                      </p>
                    </div>
                    <Link
                      href="/transport/routes"
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Close detail
                    </Link>
                  </div>

                  <form action={updateTransportRoute} className="grid max-w-2xl gap-4">
                    <input type="hidden" name="id" value={selected.id} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="e-name">Route name</Label>
                        <Input
                          id="e-name"
                          name="name"
                          required
                          defaultValue={selected.name}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="e-code">Code</Label>
                        <Input id="e-code" name="code" defaultValue={selected.code ?? ""} />
                      </div>
                    </div>
                    <div className="grid max-w-md gap-2">
                      <Label htmlFor="e-vehicle">Default vehicle</Label>
                      <select
                        id="e-vehicle"
                        name="defaultVehicleId"
                        className={selectClass}
                        defaultValue={selected.defaultVehicleId ?? ""}
                      >
                        <option value="">None</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.registrationNo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="isActive"
                        value="on"
                        defaultChecked={selected.isActive}
                        className="size-4 rounded border"
                      />
                      Active
                    </label>
                    <Button type="submit" variant="secondary" className="w-fit">
                      Save route
                    </Button>
                  </form>

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Stops on this route</h4>
                    {selected.stops.length === 0 ? (
                      <p className="text-muted-foreground mb-4 text-sm">
                        No stops yet. Add from the master list below.
                      </p>
                    ) : (
                      <div className="mb-6 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[72px]">#</TableHead>
                              <TableHead>Stop</TableHead>
                              <TableHead>Pickup</TableHead>
                              <TableHead>Drop</TableHead>
                              <TableHead className="min-w-[200px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selected.stops.map((rs) => (
                              <TableRow key={rs.id}>
                                <TableCell className="font-mono text-xs">
                                  {rs.sortOrder + 1}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium">{rs.busStop.name}</span>
                                  {rs.busStop.area ? (
                                    <span className="text-muted-foreground block text-xs">
                                      {rs.busStop.area}
                                    </span>
                                  ) : null}
                                </TableCell>
                                <TableCell className="text-xs">{rs.pickupTime ?? "—"}</TableCell>
                                <TableCell className="text-xs">{rs.dropTime ?? "—"}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    <form action={moveRouteStop}>
                                      <input type="hidden" name="routeStopId" value={rs.id} />
                                      <input type="hidden" name="direction" value="up" />
                                      <Button type="submit" size="sm" variant="outline">
                                        Up
                                      </Button>
                                    </form>
                                    <form action={moveRouteStop}>
                                      <input type="hidden" name="routeStopId" value={rs.id} />
                                      <input type="hidden" name="direction" value="down" />
                                      <Button type="submit" size="sm" variant="outline">
                                        Down
                                      </Button>
                                    </form>
                                    <form action={removeStopFromRoute}>
                                      <input type="hidden" name="routeStopId" value={rs.id} />
                                      <Button
                                        type="submit"
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                      >
                                        Remove
                                      </Button>
                                    </form>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {stopsToAdd.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        All session stops are on this route, or no stops exist yet. Add stops under
                        Transport → Stops.
                      </p>
                    ) : (
                      <form action={addStopToRoute} className="grid max-w-xl gap-3">
                        <input type="hidden" name="routeId" value={selected.id} />
                        <div className="grid gap-2">
                          <Label>Add stop to route</Label>
                          <select name="busStopId" className={selectClass} required>
                            <option value="">Select stop…</option>
                            {stopsToAdd.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                                {s.area ? ` · ${s.area}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor="pickupTime">Pickup time</Label>
                            <Input id="pickupTime" name="pickupTime" placeholder="e.g. 07:10" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="dropTime">Drop time</Label>
                            <Input id="dropTime" name="dropTime" placeholder="e.g. 14:40" />
                          </div>
                        </div>
                        <Button type="submit" className="w-fit">
                          Add to route
                        </Button>
                      </form>
                    )}
                  </div>

                  <form action={deleteTransportRoute} className="border-destructive/30 mt-8 border-t pt-6">
                    <input type="hidden" name="id" value={selected.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Delete route (removes stop links and student mappings)
                    </Button>
                  </form>
                </div>
              ) : routeId ? (
                <p className="text-muted-foreground text-sm">Route not found in this session.</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
