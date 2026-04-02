import Link from "next/link";

import {
  recordAdmissionFeePayment,
  updateAdmissionDocument,
} from "@/app/(erp)/actions/admission-workflow";
import {
  saveAdmissionDraft,
  submitAdmissionForReview,
} from "@/app/(erp)/actions/admissions";
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
import { ensureAdmissionChecklist } from "@/lib/admission-documents";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";

type Props = {
  admissionId: string | undefined;
};

function ymdFromDate(d: Date | null | undefined) {
  if (!d) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function AdmissionsAdmissionFormPage({ admissionId }: Props) {
  const session = await getCurrentSession();

  const admission =
    session && admissionId
      ? await prisma.admission.findFirst({
          where: { id: admissionId, sessionId: session.id },
          include: { enquiry: true, proposedSection: { include: { class: true } } },
        })
      : null;

  if (session && admission) {
    await ensureAdmissionChecklist(session.id, admission.id);
  }

  const admissionDocuments =
    session && admission
      ? await prisma.admissionDocument.findMany({
          where: { admissionId: admission.id },
          include: { documentType: true },
          orderBy: [{ label: "asc" }],
        })
      : [];

  const admissionFees =
    session && admission
      ? await prisma.admissionFeePayment.findMany({
          where: { admissionId: admission.id },
          orderBy: { paidAt: "desc" },
        })
      : [];

  const sections = session
    ? await prisma.section.findMany({
        where: { class: { sessionId: session.id } },
        include: { class: true },
        orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
      })
    : [];

  const editable =
    admission &&
    (admission.status === "REGISTERED" ||
      admission.status === "PENDING_REVIEW" ||
      admission.status === "APPROVED");

  const docsFeesEditable = admission && admission.status !== "ADMITTED";

  const pendingDocs = admissionDocuments.filter(
    (d) => d.status === "PENDING" || d.status === "REJECTED",
  ).length;

  const requiredDocsBlocking = admissionDocuments.filter(
    (d) =>
      d.documentType?.requiredForAdmission === true &&
      d.status !== "VERIFIED" &&
      d.status !== "WAIVED",
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admission form</CardTitle>
          <CardDescription>
            Complete class assignment and student details, then submit for review. Linked enquiry
            data is shown for reference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : !admissionId ? (
            <p className="text-muted-foreground text-sm">
              Open this page from{" "}
              <Link href="/admissions/enquiry-list" className="text-primary underline">
                Enquiry list
              </Link>{" "}
              using <strong>Start admission</strong>, or from the review queue.
            </p>
          ) : !admission ? (
            <p className="text-muted-foreground text-sm">Admission not found.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">Status: {admission.status}</Badge>
                {admission.enquiry ? (
                  <span className="text-muted-foreground text-sm">
                    Enquiry: <strong>{admission.enquiry.childName}</strong> ·{" "}
                    {admission.enquiry.phone}
                  </span>
                ) : null}
                {admission.status === "APPROVED" ? (
                  <span className="text-amber-600 text-sm dark:text-amber-400">
                    Approved — you can still update section / admission no. here, then{" "}
                    <Link href="/admissions/approved" className="underline">
                      enroll the student
                    </Link>
                    .
                  </span>
                ) : null}
                {admission.status === "ADMITTED" && admission.studentId ? (
                  <Link
                    href={`/students/profile?id=${admission.studentId}`}
                    className="text-primary text-sm underline"
                  >
                    View student profile
                  </Link>
                ) : null}
              </div>

              {admission.enquiry ? (
                <div className="bg-muted/40 rounded-lg border p-4 text-sm">
                  <p className="text-muted-foreground mb-2 font-medium">From enquiry</p>
                  <dl className="grid gap-1 sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Class seeking</dt>
                      <dd>{admission.enquiry.classSeeking ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Parent</dt>
                      <dd>{admission.enquiry.parentName ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>{admission.enquiry.email ?? "—"}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              {editable ? (
                <>
                  <form action={saveAdmissionDraft} className="grid max-w-xl gap-4">
                    <input type="hidden" name="admissionId" value={admission.id} />
                    <div className="grid gap-2">
                      <Label htmlFor="proposedSectionId">Section</Label>
                      <select
                        id="proposedSectionId"
                        name="proposedSectionId"
                        defaultValue={admission.proposedSectionId ?? ""}
                        required
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                      >
                        <option value="">Select section</option>
                        {sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.class.name} {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="proposedAdmissionNo">Admission number (optional)</Label>
                      <Input
                        id="proposedAdmissionNo"
                        name="proposedAdmissionNo"
                        defaultValue={admission.proposedAdmissionNo ?? ""}
                        placeholder="e.g. BHB-2025-0142"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="draftFirstName">Student first name</Label>
                        <Input
                          id="draftFirstName"
                          name="draftFirstName"
                          required
                          defaultValue={admission.draftFirstName ?? ""}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="draftLastName">Last name</Label>
                        <Input
                          id="draftLastName"
                          name="draftLastName"
                          defaultValue={admission.draftLastName ?? ""}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="draftDob">Date of birth</Label>
                        <Input
                          id="draftDob"
                          name="draftDob"
                          type="date"
                          defaultValue={ymdFromDate(admission.draftDob)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="draftGender">Gender</Label>
                        <select
                          id="draftGender"
                          name="draftGender"
                          defaultValue={admission.draftGender ?? ""}
                          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        >
                          <option value="">—</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="remarks">Internal remarks</Label>
                      <Input
                        id="remarks"
                        name="remarks"
                        defaultValue={admission.remarks ?? ""}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" variant="secondary">
                        Save draft
                      </Button>
                    </div>
                  </form>

                  {admission.status === "REGISTERED" ? (
                    <form action={submitAdmissionForReview} className="border-t pt-4">
                      <input type="hidden" name="admissionId" value={admission.id} />
                      <p className="text-muted-foreground mb-3 text-sm">
                        After saving, submit to send the file to the review queue. All{" "}
                        <strong>required</strong> documents below must be{" "}
                        <strong>Verified</strong> or <strong>Waived</strong> first.
                      </p>
                      {requiredDocsBlocking.length > 0 ? (
                        <div className="border-amber-500/50 bg-amber-500/10 mb-3 rounded-md border px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
                          <strong>Blocked:</strong>{" "}
                          {requiredDocsBlocking.map((d) => d.label).join(", ")}
                        </div>
                      ) : null}
                      <Button type="submit">Submit for review</Button>
                    </form>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Submitted for review. Decisions are made from{" "}
                      <Link href="/admissions/pending-documents" className="text-primary underline">
                        Pending / review queue
                      </Link>
                      .
                    </p>
                  )}
                </>
              ) : (
                <dl className="grid max-w-xl gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Section</dt>
                    <dd>
                      {admission.proposedSection
                        ? `${admission.proposedSection.class.name} ${admission.proposedSection.name}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Admission no.</dt>
                    <dd>{admission.proposedAdmissionNo ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Student</dt>
                    <dd>
                      {[admission.draftFirstName, admission.draftLastName]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </dd>
                  </div>
                </dl>
              )}

              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Document verification</CardTitle>
                  <CardDescription>
                    Checklist from{" "}
                    <Link href="/master/document-types" className="text-primary underline">
                      Master → Document types
                    </Link>
                    .{" "}
                    {admissionDocuments.length === 0
                      ? ""
                      : pendingDocs > 0
                        ? `${pendingDocs} item(s) pending or rejected.`
                        : "No pending or rejected items."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {admissionDocuments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No document types defined for this session. Add them under Master Setup.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {admissionDocuments.map((d) =>
                        docsFeesEditable ? (
                          <form
                            key={d.id}
                            action={updateAdmissionDocument}
                            className="bg-muted/30 grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto] sm:items-end"
                          >
                            <input type="hidden" name="id" value={d.id} />
                            <div>
                              <p className="font-medium text-sm">{d.label}</p>
                              {d.documentType?.requiredForAdmission ? (
                                <p className="text-muted-foreground text-xs">Required</p>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 sm:col-span-2">
                              <div className="grid gap-1">
                                <Label className="text-xs">Status</Label>
                                <select
                                  name="status"
                                  defaultValue={d.status}
                                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="RECEIVED">Received</option>
                                  <option value="VERIFIED">Verified</option>
                                  <option value="REJECTED">Rejected</option>
                                  <option value="WAIVED">Waived</option>
                                </select>
                              </div>
                              <div className="min-w-[140px] flex-1 grid gap-1">
                                <Label className="text-xs">File URL (optional)</Label>
                                <Input
                                  name="fileUrl"
                                  defaultValue={d.fileUrl ?? ""}
                                  placeholder="https://…"
                                  className="h-9"
                                />
                              </div>
                              <div className="min-w-[160px] flex-1 grid gap-1">
                                <Label className="text-xs">Remarks</Label>
                                <Input
                                  name="remarks"
                                  defaultValue={d.remarks ?? ""}
                                  className="h-9"
                                />
                              </div>
                              <Button type="submit" size="sm" variant="secondary" className="h-9">
                                Save
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div
                            key={d.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                          >
                            <span className="font-medium">{d.label}</span>
                            <Badge variant="secondary">{d.status}</Badge>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Admission fee</CardTitle>
                  <CardDescription>
                    Record registration / admission fee before the student is enrolled. After
                    admission is finalised, use{" "}
                    <Link href="/fees/collect" className="text-primary underline">
                      Collect fee
                    </Link>
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {admissionFees.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-2">Date</th>
                            <th className="pb-2 pr-2">Receipt</th>
                            <th className="pb-2 pr-2">Type</th>
                            <th className="pb-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admissionFees.map((f) => (
                            <tr key={f.id} className="border-b border-border/60">
                              <td className="py-2 pr-2 whitespace-nowrap">
                                {f.paidAt.toLocaleDateString()}
                              </td>
                              <td className="py-2 pr-2 font-mono text-xs">
                                {f.receiptNo ?? "—"}
                              </td>
                              <td className="py-2 pr-2">
                                {f.isFull ? "Full" : "Partial"}
                              </td>
                              <td className="py-2 text-right font-mono tabular-nums">
                                ₹{Number(f.amount).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No admission fee recorded yet.</p>
                  )}

                  {docsFeesEditable ? (
                    <form action={recordAdmissionFeePayment} className="grid max-w-md gap-3 border-t pt-4">
                      <input type="hidden" name="admissionId" value={admission.id} />
                      <div className="grid gap-2">
                        <Label htmlFor="feeAmount">Amount (₹)</Label>
                        <Input
                          id="feeAmount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input id="isFull" name="isFull" type="checkbox" defaultChecked className="size-4 rounded border" />
                        <Label htmlFor="isFull" className="font-normal">
                          Full payment (uncheck for partial)
                        </Label>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="feeReceipt">Receipt no. (optional)</Label>
                        <Input id="feeReceipt" name="receiptNo" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="feeDesc">Note</Label>
                        <Input id="feeDesc" name="description" placeholder="Registration / admission" />
                      </div>
                      <Button type="submit" className="w-fit">
                        Record payment
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
