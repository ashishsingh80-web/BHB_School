import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
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

function docStatus(expiresOn: Date | null) {
  if (!expiresOn) {
    return { label: "No expiry", variant: "secondary" as const };
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiresOn);
  exp.setHours(0, 0, 0, 0);
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 30);

  if (exp < now) return { label: "Expired", variant: "destructive" as const };
  if (exp <= horizon) return { label: "≤30 days", variant: "outline" as const };
  return { label: "OK", variant: "secondary" as const };
}

export async function TransportCompliancePage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { registrationNo: "asc" },
    include: {
      documents: { orderBy: [{ expiresOn: "asc" }] },
      driverDocuments: { orderBy: [{ expiresOn: "asc" }] },
    },
  });

  const rows: {
    vehicleId: string;
    registrationNo: string;
    isBlocked: boolean;
    docId: string;
    documentScope: "Vehicle" | "Driver";
    ownerLabel: string | null;
    docType: string;
    expiresOn: Date | null;
    issuedOn: Date | null;
    fileUrl: string | null;
  }[] = [];

  for (const v of vehicles) {
    if (v.documents.length === 0) {
      rows.push({
        vehicleId: v.id,
        registrationNo: v.registrationNo,
        isBlocked: v.isBlocked,
        docId: `empty-${v.id}`,
        documentScope: "Vehicle",
        ownerLabel: null,
        docType: "—",
        expiresOn: null,
        issuedOn: null,
        fileUrl: null,
      });
    } else {
      for (const d of v.documents) {
        rows.push({
          vehicleId: v.id,
          registrationNo: v.registrationNo,
          isBlocked: v.isBlocked,
          docId: d.id,
          documentScope: "Vehicle",
          ownerLabel: null,
          docType: d.docType,
          expiresOn: d.expiresOn,
          issuedOn: d.issuedOn,
          fileUrl: d.fileUrl,
        });
      }
      for (const d of v.driverDocuments) {
        rows.push({
          vehicleId: v.id,
          registrationNo: v.registrationNo,
          isBlocked: v.isBlocked,
          docId: `driver-${d.id}`,
          documentScope: "Driver",
          ownerLabel: d.driverName,
          docType: d.docType,
          expiresOn: d.expiresOn,
          issuedOn: null,
          fileUrl: d.fileUrl,
        });
      }
    }
  }

  const issues = rows.filter((r) => {
    if (r.docType === "—") return true;
    const s = docStatus(r.expiresOn);
    return s.label === "Expired" || s.label === "≤30 days";
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compliance & documents</CardTitle>
          <CardDescription>
            Per-vehicle paperwork with expiry status. Renew before due dates to avoid blocking
            vehicles on the road.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {issues.length > 0 ? (
            <div className="bg-muted/40 rounded-lg border p-3 text-sm">
              <p className="font-medium">Needs attention</p>
              <p className="text-muted-foreground mt-1">
                {issues.length} row(s): missing docs, expiring within 30 days, or already expired.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No urgent compliance rows.</p>
          )}
          <p>
            <Link
              href="/transport/vehicles"
              className="text-primary text-sm underline-offset-4 hover:underline"
            >
              Manage vehicles and add documents
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document register</CardTitle>
          <CardDescription>All vehicles · {rows.length} row(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <p className="text-muted-foreground text-sm">No vehicles registered.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const st = docStatus(r.expiresOn);
                    return (
                      <TableRow key={r.docId}>
                        <TableCell>
                          <span className="font-mono text-sm">{r.registrationNo}</span>
                          {r.isBlocked ? (
                            <Badge variant="destructive" className="ml-2">
                              Blocked
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{r.documentScope}</div>
                          {r.ownerLabel ? (
                            <div className="text-muted-foreground text-xs">{r.ownerLabel}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>{r.docType}</TableCell>
                        <TableCell className="text-sm">
                          {r.expiresOn ? r.expiresOn.toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/transport/vehicles?vehicleId=${r.vehicleId}`}
                            className={buttonVariants({ variant: "ghost", size: "sm" })}
                          >
                            Manage
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
