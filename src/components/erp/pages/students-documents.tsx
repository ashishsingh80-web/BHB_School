import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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

function statusVariant(status: string) {
  if (status === "VERIFIED" || status === "WAIVED") return "secondary" as const;
  if (status === "PENDING") return "outline" as const;
  return "default" as const;
}

export async function StudentsDocumentsPage() {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const students = await prisma.student.findMany({
    where: { sessionId: session.id, isActive: true },
    include: {
      section: { include: { class: true } },
      parents: { include: { parent: true } },
      admission: {
        include: {
          documents: {
            orderBy: [{ updatedAt: "desc" }],
          },
        },
      },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 200,
  });

  const rows = students.map((student) => {
    const docs = student.admission?.documents ?? [];
    const verifiedCount = docs.filter((doc) =>
      ["VERIFIED", "WAIVED"].includes(doc.status),
    ).length;
    const pendingCount = docs.filter((doc) => doc.status === "PENDING").length;
    return {
      student,
      docs,
      verifiedCount,
      pendingCount,
    };
  });

  const totalDocs = rows.reduce((sum, row) => sum + row.docs.length, 0);
  const pendingDocs = rows.reduce((sum, row) => sum + row.pendingCount, 0);
  const studentsWithDocs = rows.filter((row) => row.docs.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Active students" value={String(rows.length)} />
        <MetricCard title="Students with docs" value={String(studentsWithDocs)} />
        <MetricCard title="Tracked documents" value={String(totalDocs)} />
        <MetricCard title="Pending verification" value={String(pendingDocs)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student documents repository</CardTitle>
          <CardDescription>
            A shared document hub built from admissions records and linked student profiles. Use it
            to review document readiness before certificates, final admissions, or front-office
            handoffs.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Link
            href="/admissions/documents"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Admission documents
          </Link>
          <Link
            href="/certificates/bonafide"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Certificates
          </Link>
          <Link
            href="/front-office/documents"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Front office docs
          </Link>
          <Badge variant="secondary">
            Uses admission-linked documents until a separate student-document store is added.
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student document register</CardTitle>
          <CardDescription>
            Active students with document counts, parent contact visibility, and direct actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active students in this session.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Parent contact</TableHead>
                    <TableHead>Document status</TableHead>
                    <TableHead>Latest labels</TableHead>
                    <TableHead className="w-[180px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const studentName = [row.student.firstName, row.student.lastName]
                      .filter(Boolean)
                      .join(" ");
                    const sectionLabel = row.student.section
                      ? `${row.student.section.class.name} ${row.student.section.name}`
                      : "—";
                    const contact = row.student.parents[0]?.parent.phonePrimary ?? "—";
                    return (
                      <TableRow key={row.student.id}>
                        <TableCell>
                          <div className="font-medium">{studentName}</div>
                          <div className="text-muted-foreground text-xs">
                            {row.student.admissionNo ?? "—"} • {sectionLabel}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {contact}
                          {row.student.parents[0]?.parent.email ? (
                            <span className="text-muted-foreground block text-xs">
                              {row.student.parents[0]?.parent.email}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {row.docs.length === 0 ? (
                            <Badge variant="outline">No docs linked</Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant={row.pendingCount > 0 ? "outline" : "secondary"}>
                                {row.verifiedCount}/{row.docs.length} ready
                              </Badge>
                              <div className="text-muted-foreground text-xs">
                                {row.pendingCount} pending verification
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.docs.length === 0
                            ? "—"
                            : row.docs
                                .slice(0, 3)
                                .map((doc) => `${doc.label} (${doc.status})`)
                                .join(", ")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/students/profile?id=${row.student.id}`}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                              Profile
                            </Link>
                            <Link
                              href="/admissions/documents"
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                              Documents
                            </Link>
                          </div>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent document detail</CardTitle>
            <CardDescription>
              Latest linked document entries across active students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rows.every((row) => row.docs.length === 0) ? (
              <p className="text-muted-foreground text-sm">No student-linked documents found yet.</p>
            ) : (
              <div className="space-y-3">
                {rows
                  .flatMap((row) =>
                    row.docs.map((doc) => ({
                      id: doc.id,
                      label: doc.label,
                      status: doc.status,
                      updatedAt: doc.updatedAt,
                      studentName: [row.student.firstName, row.student.lastName]
                        .filter(Boolean)
                        .join(" "),
                    })),
                  )
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .slice(0, 12)
                  .map((doc) => (
                    <div key={doc.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{doc.label}</p>
                          <p className="text-muted-foreground text-xs">
                            {doc.studentName} • {doc.updatedAt.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={statusVariant(doc.status)}>{doc.status}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working notes</CardTitle>
            <CardDescription>
              Practical guidance while the repo still uses admission-linked document rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PromptBlock text="Use this page as the student-facing document hub when families need certificate or verification readiness checked." />
            <PromptBlock text="Keep final verification and upload-status handling in the admissions documents workflow until a dedicated student document store is added." />
            <PromptBlock text="A future upgrade can add student-owned uploads, categories, and secure document URLs without replacing this repository view." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}
