import Link from "next/link";

import {
  addVehicleDocument,
  addDriverDocument,
  blockVehicle,
  createVehicle,
  unblockVehicle,
} from "@/app/(erp)/actions/transport";
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

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30";

const DOC_TYPES = [
  "Fitness certificate",
  "Insurance",
  "Pollution (PUC)",
  "Permit",
  "Road tax",
  "Other",
] as const;

const DRIVER_DOC_TYPES = [
  "Driving licence",
  "Aadhaar / ID",
  "Badge / Permit",
  "Medical certificate",
  "Police verification",
  "Other",
] as const;

type Props = {
  vehicleId?: string;
};

export async function TransportVehiclesPage({ vehicleId }: Props) {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { registrationNo: "asc" },
    include: {
      _count: { select: { documents: true, fuelIssues: true } },
    },
  });

  const selected =
    vehicleId && vehicles.some((v) => v.id === vehicleId)
    ? await prisma.vehicle.findFirst({
        where: { id: vehicleId },
        include: {
          documents: { orderBy: { expiresOn: "asc" } },
          driverDocuments: { orderBy: { expiresOn: "asc" } },
          fuelIssues: { orderBy: { issuedAt: "desc" }, take: 8 },
        },
      })
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>
            Register buses and vans. Block unsafe vehicles; compliance documents live below and on
            the compliance screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createVehicle} className="mb-8 grid max-w-2xl gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="registrationNo">Registration no.</Label>
                <Input
                  id="registrationNo"
                  name="registrationNo"
                  required
                  placeholder="e.g. DL 1C 1234"
                  className="font-mono uppercase"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" placeholder="Optional" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fuelType">Fuel</Label>
                <select id="fuelType" name="fuelType" className={selectClass}>
                  <option value="">Select…</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="PETROL">Petrol</option>
                  <option value="ELECTRIC">Electric</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="driverName">Driver name</Label>
                <Input id="driverName" name="driverName" placeholder="Optional" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="driverPhone">Driver phone</Label>
              <Input id="driverPhone" name="driverPhone" type="tel" placeholder="Optional" />
            </div>
            <Button type="submit" className="w-fit">
              Add vehicle
            </Button>
          </form>

          {vehicles.length === 0 ? (
            <p className="text-muted-foreground text-sm">No vehicles yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Docs</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-sm">{v.registrationNo}</TableCell>
                      <TableCell>{v.model ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {v.driverName ?? "—"}
                        {v.driverPhone ? (
                          <span className="text-muted-foreground block">{v.driverPhone}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {v.isBlocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {v._count.documents}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/transport/vehicles?vehicleId=${v.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Manage
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="font-mono">{selected.registrationNo}</CardTitle>
                <CardDescription>
                  {selected.model ?? "No model"} · {selected.fuelType ?? "Fuel not set"}
                </CardDescription>
              </div>
              <Link
                href="/transport/vehicles"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Close detail
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-sm">
                {selected.isBlocked ? (
                  <>
                    <p className="text-destructive font-medium">Vehicle is blocked.</p>
                    <p className="text-muted-foreground mt-1">{selected.blockReason}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Vehicle is active for routes and fuel issue.</p>
                )}
              </div>
              {selected.isBlocked ? (
                <form action={unblockVehicle}>
                  <input type="hidden" name="vehicleId" value={selected.id} />
                  <Button type="submit" variant="secondary" size="sm">
                    Unblock
                  </Button>
                </form>
              ) : (
                <form action={blockVehicle} className="flex max-w-md flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                  <input type="hidden" name="vehicleId" value={selected.id} />
                  <div className="grid flex-1 gap-2">
                    <Label htmlFor="blockReason" className="text-xs">
                      Block reason
                    </Label>
                    <Input
                      id="blockReason"
                      name="blockReason"
                      required
                      placeholder="e.g. Fitness expired"
                    />
                  </div>
                  <Button type="submit" variant="destructive" size="sm">
                    Block
                  </Button>
                </form>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium">Compliance documents</h3>
              <form action={addVehicleDocument} className="mb-6 grid max-w-2xl gap-4">
                <input type="hidden" name="vehicleId" value={selected.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="docType">Document type</Label>
                    <select id="docType" name="docType" required className={selectClass}>
                      <option value="">Select…</option>
                      {DOC_TYPES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fileUrl">File URL</Label>
                    <Input id="fileUrl" name="fileUrl" type="url" placeholder="Optional" />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="issuedOn">Issued on</Label>
                    <Input id="issuedOn" name="issuedOn" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiresOn">Expires on</Label>
                    <Input id="expiresOn" name="expiresOn" type="date" />
                  </div>
                </div>
                <Button type="submit" size="sm" className="w-fit">
                  Add document
                </Button>
              </form>

              {selected.documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents on file.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.documents.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{d.docType}</TableCell>
                          <TableCell className="text-sm">
                            {d.issuedOn
                              ? d.issuedOn.toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {d.expiresOn
                              ? d.expiresOn.toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {d.fileUrl ? (
                              <a
                                href={d.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary text-sm underline-offset-4 hover:underline"
                              >
                                Open
                              </a>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium">Driver documents</h3>
              <form action={addDriverDocument} className="mb-6 grid max-w-2xl gap-4">
                <input type="hidden" name="vehicleId" value={selected.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="driverDocName">Driver name</Label>
                    <Input
                      id="driverDocName"
                      name="driverName"
                      required
                      defaultValue={selected.driverName ?? ""}
                      placeholder="Driver full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="driverDocType">Document type</Label>
                    <select id="driverDocType" name="docType" required className={selectClass}>
                      <option value="">Select…</option>
                      {DRIVER_DOC_TYPES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="driverIdentifier">Identifier / licence no.</Label>
                    <Input id="driverIdentifier" name="identifier" placeholder="Optional" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="driverFileUrl">File URL</Label>
                    <Input id="driverFileUrl" name="fileUrl" type="url" placeholder="Optional" />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="driverExpiresOn">Expires on</Label>
                    <Input id="driverExpiresOn" name="expiresOn" type="date" />
                  </div>
                </div>
                <Button type="submit" size="sm" className="w-fit">
                  Add driver document
                </Button>
              </form>

              {selected.driverDocuments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No driver documents on file.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.driverDocuments.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{d.driverName}</TableCell>
                          <TableCell>{d.docType}</TableCell>
                          <TableCell className="text-sm">{d.identifier ?? "—"}</TableCell>
                          <TableCell className="text-sm">
                            {d.expiresOn ? d.expiresOn.toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            {d.fileUrl ? (
                              <a
                                href={d.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary text-sm underline-offset-4 hover:underline"
                              >
                                Open
                              </a>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Recent fuel issues</h3>
                <Link
                  href="/accounts/fuel"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Log fuel (Accounts)
                </Link>
              </div>
              {selected.fuelIssues.length === 0 ? (
                <p className="text-muted-foreground text-sm">No issues logged.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Litres</TableHead>
                        <TableHead>Odometer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.fuelIssues.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {f.issuedAt.toLocaleString()}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {Number(f.quantityLiters)}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {f.odometerKm != null ? Number(f.odometerKm) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : vehicleId ? (
        <p className="text-muted-foreground text-sm">
          Vehicle not found.{" "}
          <Link href="/transport/vehicles" className="text-primary underline-offset-4 hover:underline">
            Back to list
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
