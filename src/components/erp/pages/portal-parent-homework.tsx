import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getParentPortalContext, parentCanViewStudent } from "@/lib/parent-portal";
import { prisma } from "@/lib/prisma";

type Props = { studentId?: string; basePath?: string };

export async function PortalParentHomeworkPage({
  studentId,
  basePath = "/portal/parent",
}: Props) {
  const ctx = await getParentPortalContext();
  const portalHomeLabel =
    basePath === "/portal/student" ? "student portal" : "parent home";

  if (!ctx) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homework</CardTitle>
          <CardDescription>
            <Link
              href={basePath}
              className="text-primary text-sm underline-offset-4 hover:underline"
            >
              Open {portalHomeLabel}
            </Link>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!studentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homework</CardTitle>
          <CardDescription>Select a student from the portal home.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={basePath} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Back
          </Link>
        </CardContent>
      </Card>
    );
  }

  const allowed = await parentCanViewStudent(ctx.parentId, studentId);
  if (!allowed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not available</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      firstName: true,
      lastName: true,
      sectionId: true,
      sessionId: true,
    },
  });

  if (!student?.sectionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homework</CardTitle>
          <CardDescription>Student has no section assigned.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const entries = await prisma.homeworkEntry.findMany({
    where: {
      sessionId: student.sessionId,
      sectionId: student.sectionId,
    },
    orderBy: { assignedOn: "desc" },
    take: 40,
    include: { subject: { select: { name: true } } },
  });

  const backLabel = basePath === "/portal/student" ? "← Student portal" : "← Parent home";

  return (
    <div className="space-y-6">
      <Link href={basePath} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        {backLabel}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            Homework / classwork · {[student.firstName, student.lastName].filter(Boolean).join(" ")}
          </CardTitle>
          <CardDescription>Recent entries for your child&apos;s section</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No entries posted yet.</p>
          ) : (
            <ul className="space-y-4">
              {entries.map((e) => (
                <li key={e.id} className="border-border rounded-lg border p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{e.title}</span>
                    <span className="text-muted-foreground text-xs">{e.kind}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Assigned {e.assignedOn.toLocaleDateString()}
                    {e.dueDate ? ` · Due ${e.dueDate.toLocaleDateString()}` : ""}
                    {e.subject ? ` · ${e.subject.name}` : ""}
                  </p>
                  {e.description ? (
                    <p className="mt-2 text-sm whitespace-pre-wrap">{e.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
