import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOnlineLeadEnquiryNotes,
  getOnlineLeadChildName,
  getOnlineLeadConversionBlockReason,
} from "@/lib/online-lead-rules";

test("online lead conversion blocks already-converted leads", () => {
  assert.equal(
    getOnlineLeadConversionBlockReason({
      id: "lead_1",
      source: "Meta",
      enquiryId: "enq_1",
      phone: "9999999999",
      campaign: null,
      utmCampaign: null,
      campaignTracking: null,
    }),
    "Already converted.",
  );
});

test("online lead conversion requires a phone number", () => {
  assert.equal(
    getOnlineLeadConversionBlockReason({
      id: "lead_1",
      source: "Meta",
      enquiryId: null,
      phone: "   ",
      campaign: null,
      utmCampaign: null,
      campaignTracking: null,
    }),
    "Lead has no phone — edit in DB or reject.",
  );
});

test("online lead conversion passes when lead is ready", () => {
  assert.equal(
    getOnlineLeadConversionBlockReason({
      id: "lead_1",
      source: "Meta",
      enquiryId: null,
      phone: "9999999999",
      campaign: "Summer Push",
      utmCampaign: "summer-2026",
      campaignTracking: {
        source: "Meta",
        campaignName: "Summer Push",
      },
    }),
    null,
  );
});

test("online lead child name falls back cleanly", () => {
  assert.equal(getOnlineLeadChildName(" Aarav "), "Aarav");
  assert.equal(getOnlineLeadChildName(null), "Online lead");
  assert.equal(getOnlineLeadChildName("   "), "Online lead");
});

test("online lead enquiry notes include campaign context when available", () => {
  assert.equal(
    buildOnlineLeadEnquiryNotes({
      id: "lead_1",
      source: "Meta",
      enquiryId: null,
      phone: "9999999999",
      campaign: "Summer Push",
      utmCampaign: "summer-2026",
      campaignTracking: {
        source: "Meta",
        campaignName: "Summer Push",
      },
    }),
    "Imported from online lead lead_1 · campaign tracking: Meta / Summer Push · campaign: Summer Push · utm campaign: summer-2026",
  );
});

test("online lead enquiry notes omit empty campaign segments", () => {
  assert.equal(
    buildOnlineLeadEnquiryNotes({
      id: "lead_2",
      source: "Website",
      enquiryId: null,
      phone: "9999999999",
      campaign: null,
      utmCampaign: null,
      campaignTracking: null,
    }),
    "Imported from online lead lead_2",
  );
});
