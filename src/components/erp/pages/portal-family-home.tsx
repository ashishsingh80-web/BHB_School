import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentSession } from "@/lib/session-context";
import { getParentPortalContext } from "@/lib/parent-portal";
import { prisma } from "@/lib/prisma";

type Props = {
  /** e.g. `/portal/parent` or `/portal/student` */
  basePath: string;
  portalLabel: string;
};

export async function PortalFamilyHomePage({ basePath, portalLabel }: Props) {
  const ctx = await getParentPortalContext();
  const session = await getCurrentSession();

  const notices =
    session && ctx
      ? await prisma.schoolNotice.findMany({
          where: { sessionId: session.id },
          orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
          take: 5,
          select: { id: true, title: true, body: true, pinned: true, publishedAt: true },
        })
      : [];

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{portalLabel}</CardTitle>
          <CardDescription>No academic session is active.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!ctx) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{portalLabel}</CardTitle>
          <CardDescription>
            We could not match your login to a parent record. Ask the school office to set your
            email on the parent profile to the same address you use to sign in (
            <strong>case-insensitive</strong>). Demo seed uses{" "}
            <code className="bg-muted rounded px-1 font-mono text-xs">
              parent.demo@example.com
            </code>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {ctx.displayName}</CardTitle>
          <CardDescription>
            Session <strong>{session.name}</strong>. Choose a student to view fees, attendance, or
            homework.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ctx.students.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active students linked to your profile for this session.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {ctx.students.map((s) => {
                const label = [s.firstName, s.lastName].filter(Boolean).join(" ");
                const cls = s.section
                  ? `${s.section.class.name} ${s.section.name}`
                  : "No section";
                const q = `studentId=${encodeURIComponent(s.id)}`;
                return (
                  <li
                    key={s.id}
                    className="border-border flex flex-col gap-2 rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-muted-foreground text-sm">{cls}</p>
                      {s.admissionNo ? (
                        <p className="text-muted-foreground font-mono text-xs">
                          {s.admissionNo}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`${basePath}/fees?${q}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Fees
                      </Link>
                      <Link
                        href={`${basePath}/attendance?${q}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Attendance
                      </Link>
                      <Link
                        href={`${basePath}/homework?${q}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Homework
                      </Link>
                      {basePath === "/portal/student" ? (
                        <Link
                          href={`${basePath}/timetable?${q}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Timetable
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {notices.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>School notices</CardTitle>
            <CardDescription>Latest updates for this session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notices.map((n) => (
              <div key={n.id} className="border-border border-b pb-3 last:border-0 last:pb-0">
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground text-xs">{n.publishedAt.toLocaleString()}</p>
                <pre className="text-muted-foreground mt-2 whitespace-pre-wrap font-sans text-sm">
                  {n.body}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
