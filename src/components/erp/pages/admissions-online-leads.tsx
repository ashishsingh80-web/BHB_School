import Link from "next/link";

import {
  assignLeadToCampaign,
  convertOnlineLeadToEnquiry,
  saveCampaignTracking,
} from "@/app/(erp)/actions/online-leads";
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

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm dark:bg-input/30";

function money(n: number | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export async function AdmissionsOnlineLeadsPage() {
  const session = await getCurrentSession();
  const leads = session
    ? await prisma.onlineLead.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          enquiry: { select: { id: true, childName: true } },
          campaignTracking: {
            select: { id: true, campaignName: true, source: true },
          },
        },
      })
    : [];

  const campaigns = session
    ? await prisma.campaignTracking.findMany({
        where: { sessionId: session.id },
        orderBy: [{ createdAt: "desc" }],
        include: {
          onlineLeads: {
            select: {
              id: true,
              enquiryId: true,
              createdAt: true,
            },
          },
        },
      })
    : [];

  const webhookConfigured = Boolean(process.env.ONLINE_LEADS_WEBHOOK_SECRET?.trim());

  const campaignRows = campaigns.map((campaign) => {
    const leadsCount = campaign.onlineLeads.length;
    const convertedCount = campaign.onlineLeads.filter((lead) => lead.enquiryId).length;
    const conversionPct = leadsCount === 0 ? 0 : Math.round((convertedCount / leadsCount) * 100);
    const spend = campaign.spendAmount ? Number(campaign.spendAmount) : null;
    const budget = campaign.budgetAmount ? Number(campaign.budgetAmount) : null;
    return {
      ...campaign,
      leadsCount,
      convertedCount,
      conversionPct,
      spend,
      budget,
      costPerLead: spend && leadsCount > 0 ? spend / leadsCount : null,
    };
  });

  const totalLeads = leads.length;
  const convertedLeads = leads.filter((lead) => lead.enquiryId).length;
  const attributedLeads = leads.filter((lead) => lead.campaignTrackingId).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Online leads inbox</CardTitle>
          <CardDescription>
            Capture Meta, Google, and website leads through the webhook below, attribute them to
            campaigns, and convert them into the admission CRM pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Endpoint:</strong>{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              POST /api/leads/webhook
            </code>
          </p>
          <p>
            <strong>Header:</strong>{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              x-webhook-secret: {"<ONLINE_LEADS_WEBHOOK_SECRET>"}
            </code>
          </p>
          <p>
            <strong>JSON body:</strong>{" "}
            <code className="font-mono text-xs">source</code> (required), optional{" "}
            <code className="font-mono text-xs">sessionId</code>,{" "}
            <code className="font-mono text-xs">campaignTrackingId</code>,{" "}
            <code className="font-mono text-xs">campaign</code>, UTM fields,{" "}
            <code className="font-mono text-xs">childName</code>,{" "}
            <code className="font-mono text-xs">phone</code>,{" "}
            <code className="font-mono text-xs">email</code>, plus any extra keys stored in{" "}
            <code className="font-mono text-xs">rawPayload</code>.
          </p>
          <p className="text-muted-foreground">
            If <code className="font-mono text-xs">campaignTrackingId</code> is omitted, the
            webhook will auto-match a campaign using the same source plus{" "}
            <code className="font-mono text-xs">campaign</code> or{" "}
            <code className="font-mono text-xs">utmCampaign</code>.
          </p>
          {!webhookConfigured ? (
            <p className="text-amber-700 text-sm dark:text-amber-400">
              Set <code className="font-mono text-xs">ONLINE_LEADS_WEBHOOK_SECRET</code> in{" "}
              <code className="font-mono text-xs">.env</code> to accept webhooks.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Campaign tracking</CardTitle>
            <CardDescription>
              Register campaign masters for Meta, Google, and website forms so incoming leads can
              be attributed and measured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveCampaignTracking} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Input id="source" name="source" required placeholder="Meta / Google / Website" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="campaignName">Campaign name</Label>
                  <Input id="campaignName" name="campaignName" required placeholder="Summer Admissions 2026" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="medium">Medium</Label>
                  <Input id="medium" name="medium" placeholder="cpc / form / organic" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budgetAmount">Budget</Label>
                  <Input id="budgetAmount" name="budgetAmount" type="number" min="0" step="0.01" placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="spendAmount">Spend</Label>
                  <Input id="spendAmount" name="spendAmount" type="number" min="0" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="formName">Form / ad set</Label>
                  <Input id="formName" name="formName" placeholder="Lead form name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startsOn">Starts on</Label>
                  <Input id="startsOn" name="startsOn" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endsOn">Ends on</Label>
                  <Input id="endsOn" name="endsOn" type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="landingUrl">Landing URL</Label>
                <Input id="landingUrl" name="landingUrl" type="url" placeholder="https://…" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaignNotes">Notes</Label>
                <textarea
                  id="campaignNotes"
                  name="notes"
                  rows={3}
                  className={cn(
                    "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] dark:bg-input/30",
                  )}
                  placeholder="Audience, branch, agent, landing page notes…"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save campaign</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead snapshot</CardTitle>
            <CardDescription>
              Session {session?.name ?? "—"} operational summary for online lead intake.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-lg border p-4">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Total leads</div>
              <div className="mt-2 text-2xl font-semibold">{totalLeads}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Attributed</div>
              <div className="mt-2 text-2xl font-semibold">{attributedLeads}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Converted</div>
              <div className="mt-2 text-2xl font-semibold">{convertedLeads}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign performance</CardTitle>
          <CardDescription>
            Campaign master list with lead count, conversions, and spend efficiency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaignRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No campaigns registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Medium</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Converted</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Cost / lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignRows.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div className="font-medium">{campaign.campaignName}</div>
                        <div className="text-muted-foreground text-xs">{campaign.source}</div>
                      </TableCell>
                      <TableCell className="text-sm">{campaign.medium ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{campaign.leadsCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{campaign.convertedCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{campaign.conversionPct}%</TableCell>
                      <TableCell className="text-right tabular-nums">{money(campaign.spend)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(campaign.costPerLead)}</TableCell>
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
          <CardTitle>Recent leads</CardTitle>
          <CardDescription>
            Session {session?.name ?? "—"} · {leads.length} row(s) shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-muted-foreground text-sm">No academic session.</p>
          ) : leads.length === 0 ? (
            <p className="text-muted-foreground text-sm">No online leads yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Child / phone</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>UTM</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[220px]">Link campaign</TableHead>
                    <TableHead className="w-[160px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                        {lead.createdAt.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{lead.childName ?? "—"}</div>
                        <div className="font-mono text-xs">{lead.phone ?? "—"}</div>
                        {lead.email ? (
                          <div className="text-muted-foreground text-xs">{lead.email}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.campaignTracking ? (
                          <div>
                            <div className="font-medium">{lead.campaignTracking.campaignName}</div>
                            <div className="text-muted-foreground text-xs">
                              {lead.campaignTracking.source}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                        {lead.campaign && !lead.campaignTracking ? (
                          <div className="text-muted-foreground mt-1 text-xs">
                            raw: {lead.campaign}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[180px] text-xs">
                        {[lead.utmSource, lead.utmMedium, lead.utmCampaign]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </TableCell>
                      <TableCell>
                        {lead.enquiryId ? (
                          <Badge variant="secondary">Converted</Badge>
                        ) : (
                          <Badge variant="outline">New</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <form action={assignLeadToCampaign} className="flex gap-2">
                          <input type="hidden" name="leadId" value={lead.id} />
                          <select
                            name="campaignTrackingId"
                            defaultValue={lead.campaignTrackingId ?? ""}
                            className={selectClass}
                          >
                            <option value="">Unassigned</option>
                            {campaigns.map((campaign) => (
                              <option key={campaign.id} value={campaign.id}>
                                {campaign.source} · {campaign.campaignName}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell>
                        {lead.enquiryId && lead.enquiry ? (
                          <Link
                            href="/admissions/enquiry-list"
                            className="text-primary text-sm underline"
                          >
                            Open enquiries
                          </Link>
                        ) : lead.phone ? (
                          <form action={convertOnlineLeadToEnquiry}>
                            <input type="hidden" name="leadId" value={lead.id} />
                            <Button type="submit" size="sm">
                              Create enquiry
                            </Button>
                          </form>
                        ) : (
                          <span className="text-muted-foreground text-xs">Add phone first</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
