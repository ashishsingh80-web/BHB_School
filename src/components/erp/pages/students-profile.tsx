import Link from "next/link";

import { setStudentActive, updateStudentProfile } from "@/app/(erp)/actions/students";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

type Props = {
  studentId: string | undefined;
};

export async function StudentsProfilePage({ studentId }: Props) {
  if (!studentId) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Student profile</CardTitle>
          <CardDescription>
            Open a student from the list to view their full record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/students/list" className={cn(buttonVariants())}>
            Go to student list
          </Link>
        </CardContent>
      </Card>
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      session: true,
      section: { include: { class: true } },
      parents: { include: { parent: true } },
      admission: true,
      feeTxns: { orderBy: { paidAt: "desc" }, take: 15 },
    },
  });

  if (!student) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Not found</CardTitle>
          <CardDescription>No student matches this link.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/students/list" className={cn(buttonVariants())}>
            Back to list
          </Link>
        </CardContent>
      </Card>
    );
  }

  const fullName = [student.firstName, student.lastName].filter(Boolean).join(" ");
  const classSection = student.section
    ? `${student.section.class.name} ${student.section.name}`
    : "Not assigned";

  const dobStr = student.dob
    ? student.dob.toISOString().slice(0, 10)
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{fullName}</h2>
            {student.isActive ? (
              <Badge>Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {student.admissionNo ? `Admission no. ${student.admissionNo}` : "No admission no."}{" "}
            · {classSection} · Session {student.session.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/students/list" className={cn(buttonVariants({ variant: "outline" }))}>
            All students
          </Link>
          {student.isActive ? (
            <form action={setStudentActive}>
              <input type="hidden" name="id" value={student.id} />
              <input type="hidden" name="isActive" value="false" />
              <Button type="submit" variant="destructive" size="sm">
                Mark inactive
              </Button>
            </form>
          ) : (
            <form action={setStudentActive}>
              <input type="hidden" name="id" value={student.id} />
              <input type="hidden" name="isActive" value="true" />
              <Button type="submit" size="sm">
                Restore active
              </Button>
            </form>
          )}
        </div>
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basic info</TabsTrigger>
          <TabsTrigger value="parents">Parents</TabsTrigger>
          <TabsTrigger value="admission">Admission</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic information</CardTitle>
              <CardDescription>Update core student record fields.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateStudentProfile} className="grid max-w-xl gap-4">
                <input type="hidden" name="id" value={student.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={student.firstName}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" name="lastName" defaultValue={student.lastName ?? ""} />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input id="dob" name="dob" type="date" defaultValue={dobStr} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      name="gender"
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                      defaultValue={student.gender ?? ""}
                    >
                      <option value="">—</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      defaultValue={student.category ?? ""}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Input
                      id="religion"
                      name="religion"
                      defaultValue={student.religion ?? ""}
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="bloodGroup">Blood group</Label>
                    <Input
                      id="bloodGroup"
                      name="bloodGroup"
                      defaultValue={student.bloodGroup ?? ""}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="aadhaarLast4">Aadhaar (last 4)</Label>
                    <Input
                      id="aadhaarLast4"
                      name="aadhaarLast4"
                      maxLength={4}
                      defaultValue={student.aadhaarLast4 ?? ""}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-fit">
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parents / guardians</CardTitle>
              <CardDescription>
                Linked contacts (edit parent master in a later sprint).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {student.parents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No parent records linked.</p>
              ) : (
                <ul className="space-y-4">
                  {student.parents.map((sp) => (
                    <li key={`${sp.studentId}-${sp.parentId}`} className="rounded-lg border p-4">
                      <p className="text-sm font-medium">{sp.relation}</p>
                      <p className="text-muted-foreground text-sm">
                        {sp.parent.fatherName ?? sp.parent.motherName ?? sp.parent.guardianName ?? "—"}
                      </p>
                      <p className="font-mono text-xs">{sp.parent.phonePrimary}</p>
                      {sp.parent.email ? (
                        <p className="text-muted-foreground text-xs">{sp.parent.email}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admission" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Admission</CardTitle>
              <CardDescription>Formal admission record if linked.</CardDescription>
            </CardHeader>
            <CardContent>
              {!student.admission ? (
                <p className="text-muted-foreground text-sm">
                  No admission row linked to this student yet.
                </p>
              ) : (
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <Badge variant="secondary">{student.admission.status}</Badge>
                    </dd>
                  </div>
                  {student.admission.remarks ? (
                    <div>
                      <dt className="text-muted-foreground">Remarks</dt>
                      <dd>{student.admission.remarks}</dd>
                    </div>
                  ) : null}
                </dl>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent fee transactions</CardTitle>
              <CardDescription>Last 15 ledger entries (use Fees module for collection).</CardDescription>
            </CardHeader>
            <CardContent>
              {student.feeTxns.length === 0 ? (
                <p className="text-muted-foreground text-sm">No transactions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.feeTxns.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {t.paidAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">₹ {t.amount.toString()}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {t.receiptNo ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
