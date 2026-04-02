"use client";

import { useState } from "react";

import {
  clearStudentTransport,
  upsertStudentTransport,
} from "@/app/(erp)/actions/transport-routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Stop = { id: string; name: string; area: string | null };
type Route = { id: string; name: string; isActive: boolean };

type Props = {
  studentId: string;
  routes: Route[];
  routeStopsMap: Record<string, Stop[]>;
  assignment?: {
    routeId: string;
    boardingStopId: string;
    remarks: string | null;
  } | null;
};

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30";

export function TransportMappingRow({
  studentId,
  routes,
  routeStopsMap,
  assignment,
}: Props) {
  const defaultRouteId = assignment?.routeId ?? routes[0]?.id ?? "";
  const [routeId, setRouteId] = useState(defaultRouteId);
  const [stopId, setStopId] = useState(assignment?.boardingStopId ?? "");
  const [remarks, setRemarks] = useState(assignment?.remarks ?? "");

  if (routes.length === 0) {
    return (
      <span className="text-muted-foreground text-xs">Create a route with stops first.</span>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form action={upsertStudentTransport} className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <input type="hidden" name="studentId" value={studentId} />
        <div className="grid min-w-[140px] gap-1">
          <Label className="text-xs">Route</Label>
          <select
            name="routeId"
            value={routeId}
            onChange={(e) => {
              const nextRouteId = e.target.value;
              const nextStops = routeStopsMap[nextRouteId] ?? [];
              setRouteId(nextRouteId);
              setStopId((prev) =>
                nextStops.some((s) => s.id === prev) ? prev : (nextStops[0]?.id ?? ""),
              );
            }}
            className={selectClass}
            required
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {!r.isActive ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid min-w-[160px] gap-1">
          <Label className="text-xs">Boarding stop</Label>
          <select
            name="boardingStopId"
            value={stopId}
            onChange={(e) => setStopId(e.target.value)}
            className={selectClass}
            required
          >
            {(routeStopsMap[routeId] ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.area ? ` · ${s.area}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid min-w-[180px] flex-1 gap-1">
          <Label className="text-xs">Remarks</Label>
          <Input
            name="remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional"
            className="h-9"
          />
        </div>
        <Button type="submit" size="sm" className="h-9 w-full sm:w-auto">
          Save
        </Button>
      </form>
      {assignment ? (
        <form action={clearStudentTransport}>
          <input type="hidden" name="studentId" value={studentId} />
          <Button type="submit" size="sm" variant="outline" className={cn("h-9 w-full sm:w-auto")}>
            Clear
          </Button>
        </form>
      ) : null}
    </div>
  );
}
