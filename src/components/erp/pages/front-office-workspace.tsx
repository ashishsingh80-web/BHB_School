import Link from "next/link";
import type { Prisma } from "@prisma/client";

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

type FrontOfficeMode =
  | "visitors"
  | "calls"
  | "enquiries"
  | "appointments"
  | "complaints"
  | "documents";

const MODE_META: Record<
  FrontOfficeMode,
  { title: string; description: string; note: string }
> = {
  visitors: {
    title: "Visitor Register Workspace",
    description:
      "Front-desk visibility into same-day operational queues that usually start with a visitor or walk-in enquiry.",
    note: "Best for office desk triage and walk-in follow-through.",
  },
  calls: {
    title: "Call Log Workspace",
    description:
      "Phone-first front-office view using enquiry follow-ups, complaints, and contact-heavy queues.",
    note: "Best for inbound/outbound call planning until a dedicated call-log model is added.",
  },
  enquiries: {
    title: "Front Office Enquiries",
    description:
      "Reception-friendly view of live enquiry intake, due follow-ups, and next-step routing.",
    note: "Best for enquiry desk operations and handoff into admissions CRM.",
  },
  appointments: {
    title: "Appointment Planning",
    description:
      "Use follow-ups, recent admissions, and complaints as the current appointment-readiness layer.",
    note: "Best for scheduling office visits and parent meetings until appointments are modeled.",
  },
  complaints: {
    title: "Front Office Complaints",
    description:
      "Desk-level complaint intake and escalation awareness using the existing complaint tracker.",
    note: "Best for fast routing and escalation awareness at reception.",
  },
  documents: {
    title: "Incoming / Outgoing Documents",
    description:
      "Operational document desk using admission verification queues, notices, and certificate/doc-driven workflows.",
    note: "Best for document handoff and pending-verification follow-up.",
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

export async function FrontOfficeWorkspacePage({
  mode,
}: {
  mode: FrontOfficeMode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const meta = MODE_META[mode];
  const today = parseUtcDate(localCalendarYmd());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const [
    enquiriesDue,
    recentEnquiries,
    recentFollowUps,
    complaints,
    notices,
    pendingDocuments,
    recentAdmissions,
  ] = await Promise.all([
    prisma.enquiry.findMany({
      where: { sessionId: session.id, nextFollowUp: { lte: today } },
      orderBy: { nextFollowUp: "asc" },
      take: 12,
    }),
    prisma.enquiry.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "desc" },
      take: 12,
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
    prisma.complaintTicket.findMany({
      where: { sessionId: session.id },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.schoolNotice.findMany({
      where: { sessionId: session.id },
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
    prisma.admissionDocument.findMany({
      where: {
        admission: { sessionId: session.id },
        status: "PENDING",
      },
      include: {
        admission: {
          include: {
            enquiry: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.admission.findMany({
      where: {
        sessionId: session.id,
        updatedAt: { gte: thirtyDaysAgo },
      },
      include: { enquiry: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  const summaryCards = [
    { title: "Due follow-ups", value: enquiriesDue.length },
    { title: "Recent enquiries", value: recentEnquiries.length },
    { title: "Complaint updates", value: complaints.length },
    { title: "Pending documents", value: pendingDocuments.length },
  ];

  const queueRows = queueRowsForMode({
    mode,
    enquiriesDue,
    recentEnquiries,
    recentFollowUps,
    complaints,
    notices,
    pendingDocuments,
    recentAdmissions,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <MetricCard key={card.title} title={card.title} value={String(card.value)} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{meta.note}</Badge>
          <Link href="/admissions/enquiry-entry" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            New enquiry
          </Link>
          <Link href="/communication/complaints" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Complaints
          </Link>
          <Link href="/admissions/documents" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Documents
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Front-office queue</CardTitle>
            <CardDescription>
              Live operational items the desk team can act on now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">No front-office items in this view right now.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Desk note</TableHead>
                      <TableHead className="w-[120px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queueRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.meta}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.note}</TableCell>
                        <TableCell>
                          <Link
                            href={row.href}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Open
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

        <Card>
          <CardHeader>
            <CardTitle>Reception guidance</CardTitle>
            <CardDescription>
              What the front office can do today without extra schema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {guidanceForMode(mode).map((text) => (
              <PromptBlock key={text} text={text} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function queueRowsForMode({
  mode,
  enquiriesDue,
  recentEnquiries,
  recentFollowUps,
  complaints,
  notices,
  pendingDocuments,
  recentAdmissions,
}: {
  mode: FrontOfficeMode;
  enquiriesDue: Awaited<ReturnType<typeof prisma.enquiry.findMany>>;
  recentEnquiries: Awaited<ReturnType<typeof prisma.enquiry.findMany>>;
  recentFollowUps: Prisma.EnquiryFollowUpGetPayload<{
    include: {
      enquiry: true;
      createdBy: { select: { name: true; email: true } };
    };
  }>[];
  complaints: Awaited<ReturnType<typeof prisma.complaintTicket.findMany>>;
  notices: Awaited<ReturnType<typeof prisma.schoolNotice.findMany>>;
  pendingDocuments: Prisma.AdmissionDocumentGetPayload<{
    include: {
      admission: {
        include: {
          enquiry: true;
        };
      };
    };
  }>[];
  recentAdmissions: Prisma.AdmissionGetPayload<{
    include: { enquiry: true };
  }>[];
}) {
  switch (mode) {
    case "visitors":
      return recentEnquiries.map((row) => ({
        id: row.id,
        title: row.childName,
        meta: [row.parentName, row.phone, row.source].filter(Boolean).join(" • "),
        note: "Treat as walk-in or desk-origin lead unless reassigned elsewhere.",
        href: `/admissions/enquiry-list?enquiryId=${row.id}`,
      }));
    case "calls":
      return recentFollowUps.map((row) => ({
        id: row.id,
        title: `${row.channel} • ${row.enquiry.childName}`,
        meta: `${row.enquiry.phone} • ${row.createdBy?.name ?? row.createdBy?.email ?? "Office"}`,
        note: "Useful as a desk call log until a dedicated telephony register is added.",
        href: `/admissions/follow-up?enquiryId=${row.enquiryId}`,
      }));
    case "enquiries":
      return enquiriesDue.map((row) => ({
        id: row.id,
        title: row.childName,
        meta: [row.parentName, row.phone, row.classSeeking].filter(Boolean).join(" • "),
        note: "Follow up, book visit, or route to registration.",
        href: `/admissions/follow-up?enquiryId=${row.id}`,
      }));
    case "appointments":
      return recentAdmissions.map((row) => ({
        id: row.id,
        title: row.enquiry?.childName ?? row.draftFirstName ?? "Admission case",
        meta: [row.status, row.enquiry?.phone].filter(Boolean).join(" • "),
        note: "Use as parent-meeting or office-visit planning until appointments are modeled.",
        href: "/admissions/final-admission",
      }));
    case "complaints":
      return complaints.map((row) => ({
        id: row.id,
        title: row.subject,
        meta: [row.status, row.phone, row.raisedByName].filter(Boolean).join(" • "),
        note: "Log, escalate, and close from the complaint tracker.",
        href: "/communication/complaints",
      }));
    case "documents":
      return pendingDocuments.map((row) => ({
        id: row.id,
        title: row.label,
        meta: [row.admission.enquiry?.childName, row.admission.enquiry?.phone, row.status]
          .filter(Boolean)
          .join(" • "),
        note: "Track incoming or pending admission documents from the desk.",
        href: "/admissions/documents",
      })).concat(
        notices.slice(0, 4).map((row) => ({
          id: row.id,
          title: row.title,
          meta: row.publishedAt.toLocaleString(),
          note: "Recent outgoing office notice.",
          href: "/communication/notices",
        })),
      );
  }
}

function guidanceForMode(mode: FrontOfficeMode) {
  switch (mode) {
    case "visitors":
      return [
        "Use recent enquiries as the current visitor register proxy for walk-ins and desk interactions.",
        "Route serious prospects into admissions follow-up immediately after intake.",
        "A dedicated visitor-entry model can be added later without replacing this desk view.",
      ];
    case "calls":
      return [
        "Use enquiry follow-up history as the current call log for outbound and callback planning.",
        "Keep parent phone and complaint context visible to reduce repeat questioning at the desk.",
        "A future call log table can attach directly to this workflow.",
      ];
    case "enquiries":
      return [
        "Treat due follow-ups as the front desk’s highest-value queue.",
        "Use source and class-seeking info to route parents toward the right next step quickly.",
        "Move qualified leads toward registration or appointment booking from here.",
      ];
    case "appointments":
      return [
        "Use active admission cases as the current visit-meeting planning layer.",
        "Book parents around documents, fee, or final-admission milestones.",
        "A dedicated appointment register can be layered on top later.",
      ];
    case "complaints":
      return [
        "Front office should acknowledge, tag status, and pass ownership quickly.",
        "Use the existing complaint tracker as the single working surface.",
        "Escalation patterns can later become templates in communication workflows.",
      ];
    case "documents":
      return [
        "Use pending admission documents as the current incoming-document desk queue.",
        "Use notices as the outgoing-document/communication side of the desk workflow.",
        "A proper inward/outward register can be added later without losing this overview.",
      ];
  }
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
