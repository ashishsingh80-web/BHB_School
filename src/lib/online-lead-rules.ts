type ConvertibleLead = {
  id: string;
  source: string;
  enquiryId: string | null;
  phone: string | null;
  campaign: string | null;
  utmCampaign: string | null;
  campaignTracking: {
    source: string;
    campaignName: string;
  } | null;
};

export function getOnlineLeadConversionBlockReason(lead: ConvertibleLead) {
  if (lead.enquiryId) {
    return "Already converted.";
  }

  if (!lead.phone?.trim()) {
    return "Lead has no phone — edit in DB or reject.";
  }

  return null;
}

export function getOnlineLeadChildName(childName: string | null) {
  return childName?.trim() || "Online lead";
}

export function buildOnlineLeadEnquiryNotes(lead: ConvertibleLead) {
  return [
    `Imported from online lead ${lead.id}`,
    lead.campaignTracking
      ? `campaign tracking: ${lead.campaignTracking.source} / ${lead.campaignTracking.campaignName}`
      : null,
    lead.campaign ? `campaign: ${lead.campaign}` : null,
    lead.utmCampaign ? `utm campaign: ${lead.utmCampaign}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
