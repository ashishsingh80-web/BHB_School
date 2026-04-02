import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";

function localCalendarYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseUtcDate(ymd: string) {
  const [y, mo, da] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, da));
}

export async function DashboardHome() {
  const session = await getCurrentSession();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const todayAtt = session ? parseUtcDate(localCalendarYmd()) : null;

  const [
    studentCount,
    enquiryCount,
    pendingAdmissionCount,
    collectionAgg,
    absentToday,
    classCount,
    sectionCount,
    subjectCount,
    feeHeadCount,
  ] = await Promise.all([
    session
      ? prisma.student.count({
          where: { sessionId: session.id, isActive: true },
        })
      : Promise.resolve(0),
    session
      ? prisma.enquiry.count({ where: { sessionId: session.id } })
      : Promise.resolve(0),
    session
      ? prisma.admission.count({
          where: {
            sessionId: session.id,
            status: { in: ["PENDING_REVIEW", "REGISTERED"] },
          },
        })
      : Promise.resolve(0),
    prisma.feeTransaction.aggregate({
      where: {
        type: "PAYMENT",
        paidAt: { gte: start },
      },
      _sum: { amount: true },
    }),
    session && todayAtt
      ? prisma.studentAttendance.count({
          where: {
            date: todayAtt,
            status: "ABSENT",
            student: { sessionId: session.id, isActive: true },
          },
        })
      : Promise.resolve(0),
    session
      ? prisma.class.count({ where: { sessionId: session.id } })
      : Promise.resolve(0),
    session
      ? prisma.section.count({
          where: { class: { sessionId: session.id } },
        })
      : Promise.resolve(0),
    session
      ? prisma.subject.count({ where: { sessionId: session.id } })
      : Promise.resolve(0),
    session
      ? prisma.feeHead.count({ where: { sessionId: session.id } })
      : Promise.resolve(0),
  ]);

  const collectionToday = collectionAgg._sum.amount?.toString() ?? "0";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground text-sm">
          {session ? (
            <>
              Active session: <strong>{session.name}</strong>
            </>
          ) : (
            "No academic session yet — create one under Master Setup."
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Active students"
          value={String(studentCount)}
          hint="In current session"
        />
        <StatCard
          title="Enquiries"
          value={String(enquiryCount)}
          hint="Total captured this session"
        />
        <StatCard
          title="Pending admissions"
          value={String(pendingAdmissionCount)}
          hint="Review + approval queue"
          href="/admissions/pending-documents"
        />
        <StatCard
          title="Fee collection today"
          value={`₹ ${collectionToday}`}
          hint="Recorded payments"
        />
        <StatCard
          title="Absent today"
          value={String(absentToday)}
          hint="Marked absent for calendar day"
        />
      </div>

      {session ? (
        <div>
          <p className="text-muted-foreground mb-3 text-sm font-medium">
            Master setup (current session)
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Classes"
              value={String(classCount)}
              hint="Defined for this session"
            />
            <StatCard
              title="Sections"
              value={String(sectionCount)}
              hint="Across all classes"
            />
            <StatCard
              title="Subjects"
              value={String(subjectCount)}
              hint="Subject master"
            />
            <StatCard
              title="Fee heads"
              value={String(feeHeadCount)}
              hint="For fee structure"
            />
          </div>
        </div>
      ) : null}

      {session &&
      studentCount === 0 &&
      enquiryCount === 0 &&
      classCount > 0 ? (
        <p className="text-muted-foreground text-sm">
          Masters are loaded, but there is no student or enquiry data yet. Run{" "}
          <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
            npm run db:seed
          </code>{" "}
          for demo students, enquiries, and a sample fee payment, or add real data
          under Admissions and Students.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Phase 1 priorities</CardTitle>
          <CardDescription>
            Blueprint §15 — Master setup, admissions, SIS, fees, then attendance and
            academics.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href="/master/school-profile"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex gap-1.5")}
          >
            School profile <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/master/sessions"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex gap-1.5")}
          >
            Sessions <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/admissions/enquiry-entry"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex gap-1.5")}
          >
            New enquiry <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/admissions/registration"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex gap-1.5")}
          >
            Registration <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/admissions/pending-documents"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex gap-1.5")}
          >
            Admission queue <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/fees/collect"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex gap-1.5")}
          >
            Collect fee <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  href,
}: {
  title: string;
  value: string;
  hint: string;
  href?: string;
}) {
  const card = (
    <Card className={href ? "transition-colors hover:bg-muted/40" : undefined}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {card}
      </Link>
    );
  }

  return card;
}
