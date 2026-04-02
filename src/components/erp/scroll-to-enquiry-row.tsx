"use client";

import { useEffect } from "react";

/**
 * Scrolls the highlighted enquiry row into view when opening the list with ?enquiryId=.
 */
export function ScrollToEnquiryRow({ enquiryId }: { enquiryId?: string }) {
  useEffect(() => {
    if (!enquiryId) return;
    const el = document.getElementById(`enquiry-row-${enquiryId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [enquiryId]);

  return null;
}
