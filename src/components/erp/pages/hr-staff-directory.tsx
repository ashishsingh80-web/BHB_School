import { createStaffMember, setStaffActive } from "@/app/(erp)/actions/hr";
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
import { cn } from "@/lib/utils";

export async function HrStaffDirectoryPage() {
  const staff = await prisma.staff.findMany({
    orderBy: [{ isActive: "desc" }, { firstName: "asc" }, { lastName: "asc" }],
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const activeCount = staff.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Staff directory</CardTitle>
          <CardDescription>
            Teachers, office, transport, and HR records. Inactive staff are hidden from staff-advance
            pickers. Linking to login accounts can be added later via{" "}
            <code className="bg-muted rounded px-1 font-mono text-xs">userId</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createStaffMember} className="mb-8 grid max-w-2xl gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" name="firstName" required placeholder="Required" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" placeholder="Optional" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="employeeCode">Employee code</Label>
                <Input id="employeeCode" name="employeeCode" placeholder="Unique, optional" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" name="designation" placeholder="e.g. Teacher, Driver" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
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
              Add staff member
            </Button>
          </form>

          <p className="text-muted-foreground mb-4 text-sm">
            {staff.length} record(s) · {activeCount} active
          </p>

          {staff.length === 0 ? (
            <p className="text-muted-foreground text-sm">No staff yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Linked user</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => {
                    const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
                    return (
                      <TableRow
                        key={s.id}
                        className={cn(!s.isActive && "text-muted-foreground")}
                      >
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.employeeCode ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">{s.designation ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          {s.phone ?? "—"}
                          {s.email ? (
                            <span className="text-muted-foreground block text-xs">
                              {s.email}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.user ? (
                            <>
                              {s.user.name ?? "—"}
                              {s.user.email ? (
                                <span className="text-muted-foreground block">{s.user.email}</span>
                              ) : null}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {s.isActive ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <form action={setStaffActive}>
                            <input type="hidden" name="id" value={s.id} />
                            <input
                              type="hidden"
                              name="isActive"
                              value={s.isActive ? "false" : "true"}
                            />
                            <Button type="submit" variant="outline" size="sm" className="h-8">
                              {s.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
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
