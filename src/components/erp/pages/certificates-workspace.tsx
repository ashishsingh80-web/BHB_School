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

type CertificateMode =
  | "bonafide"
  | "fee"
  | "character"
  | "id-card"
  | "no-dues"
  | "tc-requests";

const MODE_META: Record<
  CertificateMode,
  { title: string; description: string; note: string }
> = {
  bonafide: {
    title: "Bonafide Certificates",
    description:
      "Identify active students ready for bonafide certificate issue with quick profile access.",
    note: "Best for current-student identity and enrolment verification.",
  },
  fee: {
    title: "Fee Certificates",
    description:
      "Use fee transaction history to identify families ready for payment summary or fee certificate issue.",
    note: "Best for parents needing proof of payment or annual fee summary.",
  },
  character: {
    title: "Character Certificates",
    description:
      "Review active and recently admitted students for general conduct certificate preparation.",
    note: "Best for school transfer, scholarship, or general conduct documentation.",
  },
  "id-card": {
    title: "ID Card Workspace",
    description:
      "Prepare student identity-card batches using admission number, class, and parent-linked data.",
    note: "Best for batch issuance and class-wise ID verification.",
  },
  "no-dues": {
    title: "No Dues Certificates",
    description:
      "Use fee-ledger signals to review which students are likely ready for no-dues processing.",
    note: "Best for exit clearance and finance verification workflows.",
  },
  "tc-requests": {
    title: "TC Request Review",
    description:
      "Review recently inactive or archived students and prepare transfer certificate follow-up actions.",
    note: "Best for school-leaving workflows and office follow-up.",
  },
};

export async function CertificatesWorkspacePage({
  mode,
}: {
  mode: CertificateMode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-muted-foreground text-sm">No academic session.</p>;
  }

  const meta = MODE_META[mode];

  const [activeStudents, archivedStudents, paidGroups, recentAdmissions] =
    await Promise.all([
      prisma.student.findMany({
        where: { sessionId: session.id, isActive: true },
        include: {
          section: { include: { class: true } },
          parents: { include: { parent: true } },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        take: 150,
      }),
      prisma.student.findMany({
        where: { sessionId: session.id, isActive: false },
        include: {
          section: { include: { class: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 40,
      }),
      prisma.feeTransaction.groupBy({
        by: ["studentId"],
        where: {
          student: { sessionId: session.id },
        },
        _sum: { amount: true },
      }),
      prisma.admission.findMany({
        where: {
          sessionId: session.id,
          status: "ADMITTED",
          studentId: { not: null },
        },
        include: {
          student: {
            include: { section: { include: { class: true } } },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
    ]);

  const paidMap = new Map(
    paidGroups.map((row) => [row.studentId, Number(row._sum.amount ?? 0)]),
  );

  const bonafideCandidates = activeStudents
    .filter((student) => student.admissionNo)
    .slice(0, 20);

  const feeCertificateCandidates = activeStudents
    .filter((student) => (paidMap.get(student.id) ?? 0) > 0)
    .sort((a, b) => (paidMap.get(b.id) ?? 0) - (paidMap.get(a.id) ?? 0))
    .slice(0, 20);

  const noDuesCandidates = activeStudents
    .filter((student) => (paidMap.get(student.id) ?? 0) > 0)
    .slice(0, 20);

  const idCardCandidates = activeStudents
    .filter((student) => student.admissionNo && student.sectionId)
    .slice(0, 20);

  const tcCandidates = archivedStudents.slice(0, 20);

  const characterCandidates = recentAdmissions
    .map((row) => row.student)
    .filter(
      (
        student,
      ): student is NonNullable<(typeof recentAdmissions)[number]["student"]> => !!student,
    )
    .slice(0, 20);

  const primaryRows = rowsForMode({
    mode,
    bonafideCandidates,
    feeCertificateCandidates,
    noDuesCandidates,
    idCardCandidates,
    tcCandidates,
    characterCandidates,
    paidMap,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Active students" value={activeStudents.length} />
        <StatCard title="Fee-paid students" value={feeCertificateCandidates.length} />
        <StatCard title="No-dues review pool" value={noDuesCandidates.length} />
        <StatCard title="Archived / TC review" value={tcCandidates.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{meta.note}</Badge>
          <Link
            href="/students/list"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Student list
          </Link>
          <Link
            href="/fees/ledger"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Fee ledger
          </Link>
          <Link
            href="/students/archived"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Archived students
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Certificate-ready queue</CardTitle>
            <CardDescription>
              Students surfaced from live admissions, session, and fee data for this document
              workflow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {primaryRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">No candidates found for this certificate type.</p>
            ) : (
              <div className="space-y-3">
                {primaryRows.map((row) => (
                  <div key={row.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-muted-foreground text-xs">{row.meta}</p>
                        <p className="text-muted-foreground mt-2 text-sm">{row.note}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {row.profileHref ? (
                          <Link
                            href={row.profileHref}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Profile
                          </Link>
                        ) : null}
                        {row.ledgerHref ? (
                          <Link
                            href={row.ledgerHref}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Ledger
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drafting guidance</CardTitle>
            <CardDescription>
              Reusable structure for office staff while print/export layers are still pending.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {templateBlocksForMode(mode).map((text) => (
              <PromptBlock key={text} text={text} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <MiniQueueCard
          title="Bonafide"
          rows={bonafideCandidates.slice(0, 5).map((student) => ({
            id: student.id,
            label: formatStudentLabel(student),
          }))}
          href="/certificates/bonafide"
        />
        <MiniQueueCard
          title="Fee / No Dues"
          rows={feeCertificateCandidates.slice(0, 5).map((student) => ({
            id: student.id,
            label: `${formatStudentLabel(student)} • ₹${(paidMap.get(student.id) ?? 0).toFixed(0)}`,
          }))}
          href="/certificates/fee"
        />
        <MiniQueueCard
          title="TC Review"
          rows={tcCandidates.slice(0, 5).map((student) => ({
            id: student.id,
            label: formatStudentLabel(student),
          }))}
          href="/certificates/tc-requests"
        />
      </div>
    </div>
  );
}

function rowsForMode({
  mode,
  bonafideCandidates,
  feeCertificateCandidates,
  noDuesCandidates,
  idCardCandidates,
  tcCandidates,
  characterCandidates,
  paidMap,
}: {
  mode: CertificateMode;
  bonafideCandidates: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNo: string | null;
    section: { name: string; class: { name: string } } | null;
    parents: Array<{ parent: { phonePrimary: string } }>;
  }>;
  feeCertificateCandidates: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNo: string | null;
    section: { name: string; class: { name: string } } | null;
    parents: Array<{ parent: { phonePrimary: string } }>;
  }>;
  noDuesCandidates: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNo: string | null;
    section: { name: string; class: { name: string } } | null;
    parents: Array<{ parent: { phonePrimary: string } }>;
  }>;
  idCardCandidates: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNo: string | null;
    section: { name: string; class: { name: string } } | null;
    parents: Array<{ parent: { phonePrimary: string } }>;
  }>;
  tcCandidates: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNo: string | null;
    section: { name: string; class: { name: string } } | null;
  }>;
  characterCandidates: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNo: string | null;
    section: { name: string; class: { name: string } } | null;
  }>;
  paidMap: Map<string, number>;
}) {
  const studentRows = (students: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    admissionNo: string | null;
    section: { name: string; class: { name: string } } | null;
    parents?: Array<{ parent: { phonePrimary: string } }>;
  }>, noteBuilder: (student: (typeof students)[number]) => string, includeLedger = false) =>
    students.map((student) => ({
      id: student.id,
      name: [student.firstName, student.lastName].filter(Boolean).join(" "),
      meta: [
        student.admissionNo ?? "No admission no.",
        student.section ? `${student.section.class.name} ${student.section.name}` : "No section",
        student.parents?.[0]?.parent.phonePrimary ?? null,
      ]
        .filter(Boolean)
        .join(" • "),
      note: noteBuilder(student),
      profileHref: `/students/profile?id=${student.id}`,
      ledgerHref: includeLedger ? `/fees/ledger?studentId=${student.id}` : undefined,
    }));

  switch (mode) {
    case "bonafide":
      return studentRows(
        bonafideCandidates,
        () => "Verify enrolment details and print current-session bonafide wording.",
      );
    case "fee":
      return studentRows(
        feeCertificateCandidates,
        (student) => `Payment footprint available for certificate drafting. Total recorded: ₹${(paidMap.get(student.id) ?? 0).toFixed(0)}.`,
        true,
      );
    case "character":
      return studentRows(
        characterCandidates,
        () => "Review profile and issue character certificate with session and class details.",
      );
    case "id-card":
      return studentRows(
        idCardCandidates,
        () => "Ready for ID card batch if photo/export layer is added next.",
      );
    case "no-dues":
      return studentRows(
        noDuesCandidates,
        (student) => `Use ledger review before issuing no-dues confirmation. Current recorded total: ₹${(paidMap.get(student.id) ?? 0).toFixed(0)}.`,
        true,
      );
    case "tc-requests":
      return studentRows(
        tcCandidates,
        () => "Review archival status, pending documents, and office approval before TC issuance.",
      );
  }
}

function templateBlocksForMode(mode: CertificateMode) {
  switch (mode) {
    case "bonafide":
      return [
        "Confirm that the student is currently enrolled in the active academic session with class and section.",
        "Include student name, admission number, class, section, and school identity details.",
        "Add principal/office signature block and date of issue.",
      ];
    case "fee":
      return [
        "Summarize the fee payments recorded in the ERP and mention the academic session covered.",
        "Include student identity details and parent-facing wording suitable for official submission.",
        "Cross-check the student ledger before final issue.",
      ];
    case "character":
      return [
        "Reference the student's enrolment and overall conduct in a formal tone.",
        "Mention class/session context and certificate issue date.",
        "Keep the language neutral, positive, and institutionally appropriate.",
      ];
    case "id-card":
      return [
        "Verify admission number, student name, class, section, and guardian contact before print.",
        "Use a batch workflow grouped by class and section for cleaner issue control.",
        "Photo, barcode, and template export can be layered next without changing the queue logic.",
      ];
    case "no-dues":
      return [
        "Review the fee ledger and confirm there are no pending financial objections before issue.",
        "Add finance clearance language and the date of verification.",
        "Use this together with library/transport/manual checks if those layers are added later.",
      ];
    case "tc-requests":
      return [
        "Review archived or inactive students first to avoid issuing TC for active records by mistake.",
        "Capture the reason for leaving, date of issue, and approval authority in the final print flow.",
        "A dedicated TC request action layer can be added later on top of this review queue.",
      ];
  }
}

function formatStudentLabel(student: {
  firstName: string;
  lastName: string | null;
  admissionNo: string | null;
  section: { name: string; class: { name: string } } | null;
}) {
  return [
    [student.firstName, student.lastName].filter(Boolean).join(" "),
    student.admissionNo ?? "—",
    student.section ? `${student.section.class.name} ${student.section.name}` : "—",
  ].join(" • ");
}

function StatCard({ title, value }: { title: string; value: number }) {
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

function MiniQueueCard({
  title,
  rows,
  href,
}: {
  title: string;
  rows: Array<{ id: string; label: string }>;
  href: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No records yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-lg border p-3 text-sm">
              {row.label}
            </div>
          ))
        )}
        <Link
          href={href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Open workspace
        </Link>
      </CardContent>
    </Card>
  );
}
