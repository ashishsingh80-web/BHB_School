import Link from "next/link";

import { TransportMappingRow } from "@/components/erp/transport-mapping-row";
import { buttonVariants } from "@/components/ui/button-variants";
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
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { cn } from "@/lib/utils";

type Props = {
  sectionId?: string;
};

export async function TransportMappingPage({ sectionId }: Props) {
  const session = await getCurrentSession();

  const [routes, routeStops, sections, students] = session
    ? await Promise.all([
        prisma.transportRoute.findMany({
          where: { sessionId: session.id },
          orderBy: { name: "asc" },
          select: { id: true, name: true, isActive: true },
        }),
        prisma.routeStop.findMany({
          where: { route: { sessionId: session.id } },
          include: { busStop: true, route: { select: { id: true } } },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.section.findMany({
          where: { class: { sessionId: session.id } },
          include: { class: true },
          orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
        }),
        prisma.student.findMany({
          where: {
            sessionId: session.id,
            isActive: true,
            ...(sectionId ? { sectionId } : {}),
          },
          include: {
            section: { include: { class: true } },
            transportAssignment: true,
          },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        }),
      ])
    : [[], [], [], []];

  const routeStopsMap: Record<string, { id: string; name: string; area: string | null }[]> = {};
  for (const r of routes) {
    routeStopsMap[r.id] = [];
  }
  for (const rs of routeStops) {
    const list = routeStopsMap[rs.route.id];
    if (list) {
      list.push({
        id: rs.busStop.id,
        name: rs.busStop.name,
        area: rs.busStop.area,
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student route mapping</CardTitle>
          <CardDescription>
            Assign each student a bus route and boarding stop. The stop must belong to the route.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap gap-2">
                <Link
                  href="/transport/mapping"
                  className={cn(
                    buttonVariants({
                      variant: sectionId ? "outline" : "default",
                      size: "sm",
                    }),
                  )}
                >
                  All sections
                </Link>
                {sections.map((sec) => {
                  const label = `${sec.class.name} ${sec.name}`;
                  return (
                    <Link
                      key={sec.id}
                      href={`/transport/mapping?sectionId=${sec.id}`}
                      className={cn(
                        buttonVariants({
                          variant: sectionId === sec.id ? "default" : "outline",
                          size: "sm",
                        }),
                      )}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>

              {students.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No active students in this filter. Add students via admissions or seed data.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Current</TableHead>
                        <TableHead className="min-w-[320px]">Assign</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => {
                        const a = s.transportAssignment;
                        const routeMeta = a ? routes.find((r) => r.id === a.routeId) : undefined;
                        const current =
                          a && routeMeta
                            ? `${routeMeta.name}${routeMeta.isActive ? "" : " (inactive)"} → ${
                                routeStopsMap[a.routeId]?.find((st) => st.id === a.boardingStopId)
                                  ?.name ?? "Stop"
                              }`
                            : "—";
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">
                              {[s.firstName, s.lastName].filter(Boolean).join(" ")}
                              {s.admissionNo ? (
                                <span className="text-muted-foreground block font-mono text-xs">
                                  {s.admissionNo}
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-sm">
                              {s.section
                                ? `${s.section.class.name} ${s.section.name}`
                                : "Unplaced"}
                            </TableCell>
                            <TableCell className="max-w-[200px] text-xs">{current}</TableCell>
                            <TableCell>
                              <TransportMappingRow
                                studentId={s.id}
                                routes={routes}
                                routeStopsMap={routeStopsMap}
                                assignment={
                                  a
                                    ? {
                                        routeId: a.routeId,
                                        boardingStopId: a.boardingStopId,
                                        remarks: a.remarks,
                                      }
                                    : null
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
