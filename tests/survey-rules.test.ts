import test from "node:test";
import assert from "node:assert/strict";

import {
  getSurveyCoordinateBlockReason,
  getSurveyEnquiryNotes,
  parseSurveyCoordinate,
} from "@/lib/survey-rules";

test("parseSurveyCoordinate accepts blank and numeric values", () => {
  assert.equal(parseSurveyCoordinate(""), null);
  assert.equal(parseSurveyCoordinate(" 28.7041 "), 28.7041);
});

test("parseSurveyCoordinate returns null for invalid numeric input", () => {
  assert.equal(parseSurveyCoordinate("abc"), null);
});

test("survey coordinates must be provided as a pair", () => {
  assert.equal(
    getSurveyCoordinateBlockReason(28.7, null),
    "Enter both latitude and longitude, or leave both empty.",
  );
});

test("survey coordinates must stay in valid latitude and longitude ranges", () => {
  assert.equal(
    getSurveyCoordinateBlockReason(95, 77.1),
    "Latitude must be between -90 and 90.",
  );
  assert.equal(
    getSurveyCoordinateBlockReason(28.7, 190),
    "Longitude must be between -180 and 180.",
  );
  assert.equal(getSurveyCoordinateBlockReason(28.7, 77.1), null);
});

test("survey enquiry notes prefer explicit notes and otherwise build a survey-context fallback", () => {
  assert.equal(getSurveyEnquiryNotes("Warm lead near market", "sur_1", "Sector 12"), "Warm lead near market");
  assert.equal(
    getSurveyEnquiryNotes(null, "sur_1", "Sector 12"),
    "Captured during field survey sur_1 · area: Sector 12",
  );
  assert.equal(
    getSurveyEnquiryNotes(null, "sur_2", null),
    "Captured during field survey sur_2",
  );
});
