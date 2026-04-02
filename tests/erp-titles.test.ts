import test from "node:test";
import assert from "node:assert/strict";

import { titleForPath } from "@/lib/erp-titles";

test("titleForPath returns configured navigation titles when available", () => {
  assert.equal(titleForPath("/admissions/admission-fee"), "Admission Fee");
  assert.equal(titleForPath("/dashboard/ai-summary"), "AI Summary");
});

test("titleForPath humanizes unknown route segments", () => {
  assert.equal(titleForPath("/reports/custom-mis-view"), "Custom Mis View");
});

test("titleForPath falls back to the ERP title for the root path", () => {
  assert.equal(titleForPath("/"), "BHB International School ERP");
});
