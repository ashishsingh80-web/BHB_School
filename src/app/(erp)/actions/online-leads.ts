"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmissionsAccess } from "@/lib/auth";
import { emptyToNull } from "@/lib/form-helpers";
import {
  buildOnlineLeadEnquiryNotes,
  getOnlineLeadChildName,
  getOnlineLeadConversionBlockReason,
} from "@/lib/online-lead-rules";
import { getCurrentSession } from "@/lib/session-context";

function parseMoney(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number.parseFloat(s);
  if (Number.isNaN(n) || n < 0) throw new Error("Enter a valid non-negative amount.");
  return n;
}

function parseDate(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error("Enter a valid date.");
  return d;
}

export async function saveCampaignTracking(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const id = String(formData.get("id") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const campaignName = String(formData.get("campaignName") ?? "").trim();
  if (!source || !campaignName) throw new Error("Source and campaign name are required.");

  const data = {
    sessionId: session.id,
    source,
    campaignName,
    medium: emptyToNull(formData.get("medium")),
    formName: emptyToNull(formData.get("formName")),
    landingUrl: emptyToNull(formData.get("landingUrl")),
    budgetAmount: parseMoney(formData.get("budgetAmount")),
    spendAmount: parseMoney(formData.get("spendAmount")),
    startsOn: parseDate(formData.get("startsOn")),
    endsOn: parseDate(formData.get("endsOn")),
    notes: emptyToNull(formData.get("notes")),
  };

  if (id) {
    await prisma.campaignTracking.update({
      where: { id },
      data,
    });
  } else {
    await prisma.campaignTracking.create({ data });
  }

  revalidatePath("/admissions/online-leads");
  revalidatePath("/dashboard");
}

export async function assignLeadToCampaign(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const leadId = String(formData.get("leadId") ?? "").trim();
  if (!leadId) throw new Error("Missing lead.");

  const campaignTrackingId = emptyToNull(formData.get("campaignTrackingId"));
  if (campaignTrackingId) {
    const campaign = await prisma.campaignTracking.findFirst({
      where: { id: campaignTrackingId, sessionId: session.id },
      select: { id: true },
    });
    if (!campaign) throw new Error("Campaign not found in this session.");
  }

  await prisma.onlineLead.update({
    where: { id: leadId },
    data: { campaignTrackingId },
  });

  revalidatePath("/admissions/online-leads");
}

export async function convertOnlineLeadToEnquiry(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) throw new Error("Missing lead.");

  const lead = await prisma.onlineLead.findFirst({
    where: { id: leadId, sessionId: session.id },
    include: {
      campaignTracking: {
        select: { campaignName: true, source: true },
      },
    },
  });
  if (!lead) throw new Error("Lead not found.");
  const conversionBlock = getOnlineLeadConversionBlockReason({
    id: lead.id,
    source: lead.source,
    enquiryId: lead.enquiryId,
    phone: lead.phone,
    campaign: lead.campaign,
    utmCampaign: lead.utmCampaign,
    campaignTracking: lead.campaignTracking,
  });
  if (conversionBlock) throw new Error(conversionBlock);

  const phone = lead.phone!.trim();
  const childName = getOnlineLeadChildName(lead.childName);

  await prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.create({
      data: {
        sessionId: session.id,
        childName,
        parentName: null,
        phone,
        email: lead.email?.trim() || null,
        source: `ONLINE:${lead.source}`,
        classSeeking: null,
        status: "NEW",
        notes: buildOnlineLeadEnquiryNotes({
          id: lead.id,
          source: lead.source,
          enquiryId: lead.enquiryId,
          phone: lead.phone,
          campaign: lead.campaign,
          utmCampaign: lead.utmCampaign,
          campaignTracking: lead.campaignTracking,
        }),
      },
    });

    await tx.onlineLead.update({
      where: { id: lead.id },
      data: { enquiryId: enquiry.id },
    });
  });

  revalidatePath("/admissions/online-leads");
  revalidatePath("/admissions/enquiry-list");
  revalidatePath("/admissions/follow-up");
  revalidatePath("/dashboard");
}
