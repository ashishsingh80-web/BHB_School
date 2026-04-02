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
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";
import { cn } from "@/lib/utils";

type CommunicationMode =
  | "whatsapp"
  | "sms"
  | "email"
  | "broadcast"
  | "ptm"
  | "templates"
  | "logs";

const MODE_META: Record<
  CommunicationMode,
  {
    title: string;
    description: string;
    channelHint: string;
  }
> = {
  whatsapp: {
    title: "WhatsApp Workspace",
    description:
      "Operational WhatsApp queue for admissions, attendance, fee reminders, and family communication.",
    channelHint: "Best for fast parent and enquiry communication with conversational tone.",
  },
  sms: {
    title: "SMS Workspace",
    description:
      "Short-form alert queue for attendance, fee reminders, urgent notices, and transport updates.",
    channelHint: "Best for short, high-delivery alerts and urgent one-line reminders.",
  },
  email: {
    title: "Email Workspace",
    description:
      "Formal communication queue for notices, follow-up summaries, and management-friendly outreach.",
    channelHint: "Best for detailed updates, formal summaries, and multi-point announcements.",
  },
  broadcast: {
    title: "Broadcast Messages",
    description:
      "Group communication planning for school-wide, class-wise, and event-driven messaging.",
    channelHint: "Best for one-to-many communication grouped by audience and urgency.",
  },
  ptm: {
    title: "PTM Reminders",
    description:
      "Parent-teacher meeting readiness and follow-up reminders using existing academic and attendance signals.",
    channelHint: "Best for targeted academic outreach before review meetings.",
  },
  templates: {
    title: "Communication Templates",
    description:
      "Reusable message structures for admissions, fees, attendance, onboarding, and escalation cases.",
    channelHint: "Best for standardizing message quality before delivery integrations land.",
  },
  logs: {
    title: "Communication Logs",
    description:
      "Recent notice-board posts, complaint interactions, and admissions follow-up events in one timeline.",
    channelHint: "Best for reviewing what the office has already communicated or tracked.",
  },
};

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

export async function CommunicationWorkspacePage({
  mode,
}: {
  mode: CommunicationMode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const meta = MODE_META[mode];
  const today = parseUtcDate(localCalendarYmd());
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const [
    followUpsDue,
    defaulters,
    lowAttendanceRows,
    recentAdmissions,
    notices,
    complaints,
    followUpEvents,
  ] = await Promise.all([
    prisma.enquiry.findMany({
      where: {
        sessionId: session.id,
        nextFollowUp: { lte: today },
      },
      orderBy: { nextFollowUp: "asc" },
      take: 12,
    }),
    prisma.student.findMany({
      where: {
        sessionId: session.id,
        isActive: true,
        feeTxns: { none: { type: "PAYMENT" } },
      },
      include: {
        section: { include: { class: true } },
        parents: { include: { parent: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 12,
    }),
    prisma.studentAttendance.groupBy({
      by: ["studentId"],
      where: {
        status: "ABSENT",
        date: { gte: fourteenDaysAgo, lte: today },
        student: { sessionId: session.id, isActive: true },
      },
      _count: { _all: true },
      orderBy: { studentId: "asc" },
    }),
    prisma.admission.findMany({
      where: {
        sessionId: session.id,
        status: "ADMITTED",
        updatedAt: { gte: thirtyDaysAgo },
        studentId: { not: null },
      },
      include: {
        student: {
          include: {
            section: { include: { class: true } },
            parents: { include: { parent: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.schoolNotice.findMany({
      where: { sessionId: session.id },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
    prisma.complaintTicket.findMany({
      where: { sessionId: session.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.enquiryFollowUp.findMany({
      where: {
        enquiry: { sessionId: session.id },
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        enquiry: true,
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const lowAttendanceIds = lowAttendanceRows
    .filter((row) => row._count._all >= 2)
    .map((row) => row.studentId);
  const lowAttendanceStudents =
    lowAttendanceIds.length > 0
      ? await prisma.student.findMany({
          where: { id: { in: lowAttendanceIds } },
          include: {
            section: { include: { class: true } },
            parents: { include: { parent: true } },
          },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        })
      : [];
  const absenceMap = new Map(
    lowAttendanceRows.map((row) => [row.studentId, row._count._all]),
  );

  const queues = [
    {
      label: "Admission follow-ups due",
      count: followUpsDue.length,
      href: "/admissions/follow-up",
      note: "Enquiries waiting for office outreach",
    },
    {
      label: "Fee reminder cases",
      count: defaulters.length,
      href: "/fees/defaulters",
      note: "Active students with no payment recorded yet",
    },
    {
      label: "Attendance alert cases",
      count: lowAttendanceStudents.length,
      href: "/attendance/alerts",
      note: "Students with repeated absences in the last 14 days",
    },
    {
      label: "Recent family onboarding",
      count: recentAdmissions.length,
      href: "/admissions/final-admission",
      note: "Families admitted in the last 30 days",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {queues.map((queue) => (
          <Card key={queue.label}>
            <CardHeader className="pb-2">
              <CardDescription>{queue.label}</CardDescription>
              <CardTitle className="text-2xl">{queue.count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{meta.channelHint}</Badge>
          <Link
            href="/communication/notices"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Notice board
          </Link>
          <Link
            href="/communication/complaints"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Complaint tracking
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Priority communication queues</CardTitle>
            <CardDescription>
              These are the most message-ready workflows already available in the ERP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {queues.map((queue) => (
              <div key={queue.label} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{queue.label}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{queue.note}</p>
                  </div>
                  <Link
                    href={queue.href}
                    className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "templates" ? "Reusable template starters" : "Suggested message angle"}
            </CardTitle>
            <CardDescription>
              Channel-specific copy guidance based on the current communication mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {templateBlocksForMode(mode).map((text) => (
              <PromptBlock key={text} text={text} />
            ))}
          </CardContent>
        </Card>
      </div>

      {mode === "logs" ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <TimelineCard
            title="Recent notices"
            empty="No notices yet."
            rows={notices.map((notice) => ({
              id: notice.id,
              title: notice.title,
              meta: notice.publishedAt.toLocaleString(),
              body: notice.body,
            }))}
          />
          <TimelineCard
            title="Complaint activity"
            empty="No complaint activity yet."
            rows={complaints.map((ticket) => ({
              id: ticket.id,
              title: ticket.subject,
              meta: `${ticket.status} • ${ticket.updatedAt.toLocaleString()}`,
              body: ticket.body,
            }))}
          />
          <TimelineCard
            title="Admissions follow-up logs"
            empty="No follow-up logs in the last 7 days."
            rows={followUpEvents.map((event) => ({
              id: event.id,
              title: `${event.channel} • ${event.enquiry.childName}`,
              meta: `${event.createdBy?.name ?? event.createdBy?.email ?? "Office"} • ${event.createdAt.toLocaleString()}`,
              body: event.summary,
            }))}
          />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <AudienceCard
            title="Admission follow-ups"
            empty="No enquiry follow-ups due."
            rows={followUpsDue.map((enquiry) => ({
              id: enquiry.id,
              title: enquiry.childName,
              subtitle: [enquiry.parentName, enquiry.phone, enquiry.source]
                .filter(Boolean)
                .join(" • "),
              note: "Use a gentle next-step message focused on visit scheduling or form completion.",
            }))}
          />
          <AudienceCard
            title="Fee reminders"
            empty="No fee reminders due."
            rows={defaulters.map((student) => ({
              id: student.id,
              title: [student.firstName, student.lastName].filter(Boolean).join(" "),
              subtitle: [
                student.parents[0]?.parent.phonePrimary ?? "No parent phone",
                student.section ? `${student.section.class.name} ${student.section.name}` : null,
              ]
                .filter(Boolean)
                .join(" • "),
              note: "Keep the message clear, supportive, and action-oriented with payment help details.",
            }))}
          />
          <AudienceCard
            title={mode === "ptm" ? "PTM outreach" : "Attendance alerts"}
            empty="No attendance alerts due."
            rows={lowAttendanceStudents.map((student) => ({
              id: student.id,
              title: [student.firstName, student.lastName].filter(Boolean).join(" "),
              subtitle: [
                `${absenceMap.get(student.id) ?? 0} absences in 14 days`,
                student.parents[0]?.parent.phonePrimary ?? "No parent phone",
              ]
                .filter(Boolean)
                .join(" • "),
              note:
                mode === "ptm"
                  ? "Invite the parent for a short PTM conversation with one academic and one attendance talking point."
                  : "Use a caring tone and ask whether support is needed at home.",
            }))}
          />
        </div>
      )}
    </div>
  );
}

function templateBlocksForMode(mode: CommunicationMode) {
  switch (mode) {
    case "whatsapp":
      return [
        "Write a warm WhatsApp follow-up for an enquiry due today, asking whether the parent would like to visit campus this week.",
        "Draft a polite WhatsApp fee reminder with support options and receipt guidance.",
        "Create a short WhatsApp attendance alert for a parent whose child has 2 or more absences in the last 14 days.",
      ];
    case "sms":
      return [
        "Write an SMS under 160 characters for a fee reminder.",
        "Write an SMS under 160 characters for an attendance alert.",
        "Write an SMS under 160 characters for a PTM reminder with date and time placeholders.",
      ];
    case "email":
      return [
        "Draft a formal parent email for fee follow-up with a respectful tone and helpdesk details.",
        "Write an email summary to a parent after a PTM with three action points.",
        "Draft an admissions follow-up email for a parent who has not completed registration.",
      ];
    case "broadcast":
      return [
        "Create a school-wide broadcast for a holiday notice with a clear subject line and two-line summary.",
        "Draft a class-wise broadcast for homework and revision reminders ahead of exams.",
        "Write a transport broadcast notifying families about route timing updates.",
      ];
    case "ptm":
      return [
        "Draft a PTM invitation for parents of students with low attendance and weak marks.",
        "Write a PTM reminder message with one academic talking point and one support suggestion.",
        "Create a follow-up note after PTM summarizing agreed next steps.",
      ];
    case "templates":
      return [
        "Admission follow-up template: polite reminder, school value point, next-step CTA.",
        "Fee reminder template: respectful tone, due reminder, support/help line, receipt note.",
        "Attendance alert template: empathy first, attendance concern, request for callback or acknowledgement.",
      ];
    case "logs":
      return [
        "Review the recent notice, complaint, and follow-up timeline for communication gaps.",
        "Identify repeated complaint themes and suggest a standard response script.",
        "Summarize the last 7 days of office communications for management review.",
      ];
  }
}

function PromptBlock({ text }: { text: string }) {
  return <div className="bg-muted rounded-lg p-3 font-mono text-xs leading-5">{text}</div>;
}

function AudienceCard({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ id: string; title: string; subtitle: string; note: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-3">
                <p className="font-medium">{row.title}</p>
                <p className="text-muted-foreground text-xs">{row.subtitle}</p>
                <p className="text-muted-foreground mt-2 text-sm">{row.note}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineCard({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ id: string; title: string; meta: string; body: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-3">
                <p className="font-medium">{row.title}</p>
                <p className="text-muted-foreground text-xs">{row.meta}</p>
                <p className="text-muted-foreground mt-2 line-clamp-4 text-sm">{row.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
