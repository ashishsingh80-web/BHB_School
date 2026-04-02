import Link from "next/link";

import { createRegistrationAndAdmission } from "@/app/(erp)/actions/admissions";
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
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session-context";

const SOURCES = ["Walk-in", "Website", "Referral", "Social", "Campaign", "Other"];

export async function AdmissionsRegistrationPage() {
  const session = await getCurrentSession();
  const classes = session
    ? await prisma.class.findMany({
        where: { sessionId: session.id },
        orderBy: { sortOrder: "asc" },
        select: { name: true },
      })
    : [];

  return (
    <div className="max-w-2xl space-y-6">
      {!session ? (
        <p className="text-muted-foreground text-sm">
          Create an academic session under Master Setup before registration.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registration form</CardTitle>
            <CardDescription>
              Captures the same lead details as an enquiry, sets enquiry status to{" "}
              <strong>REGISTERED</strong>, creates an admission draft, and opens the{" "}
              <strong>Admission form</strong> so you can assign section and continue the pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-sm">
              For leads that are not ready to register, use{" "}
              <Link href="/admissions/enquiry-entry" className="text-primary underline">
                Enquiry entry
              </Link>{" "}
              instead.
            </p>
            <form action={createRegistrationAndAdmission} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="childName">Child name</Label>
                <Input id="childName" name="childName" required placeholder="Full name" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="parentName">Parent / guardian</Label>
                  <Input id="parentName" name="parentName" placeholder="Name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91..."
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="Optional" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <select
                    id="source"
                    name="source"
                    defaultValue="Walk-in"
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="">Select…</option>
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="classSeeking">Class seeking</Label>
                  <select
                    id="classSeeking"
                    name="classSeeking"
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="">Select…</option>
                    {classes.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextFollowUp">Next follow-up (optional)</Label>
                <Input id="nextFollowUp" name="nextFollowUp" type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                  placeholder="Documents pending, sibling reference…"
                />
              </div>
              <Button type="submit" className="w-fit">
                Save registration &amp; open admission form
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
