import test from "node:test";
import assert from "node:assert/strict";

import { getEnrollmentBlockReason, getReviewSubmissionBlockReason } from "@/lib/admission-rules";

test("review submission requires a registered admission with section and student name", () => {
  assert.equal(
    getReviewSubmissionBlockReason(
      { status: "REGISTERED", proposedSectionId: null, draftFirstName: "Aarav" },
      [],
    ),
    "Choose a section and enter the student name before submitting.",
  );

  assert.equal(
    getReviewSubmissionBlockReason(
      { status: "PENDING_REVIEW", proposedSectionId: "sec_1", draftFirstName: "Aarav" },
      [],
    ),
    "Only draft registrations can be submitted for review.",
  );
});

test("review submission surfaces blocking required documents", () => {
  assert.equal(
    getReviewSubmissionBlockReason(
      { status: "REGISTERED", proposedSectionId: "sec_1", draftFirstName: "Aarav" },
      ["Birth Certificate", "Aadhaar"],
    ),
    "Required documents must be Verified or Waived: Birth Certificate, Aadhaar",
  );
});

test("enrollment requires approved status, fee payment, and parent phone", () => {
  assert.equal(
    getEnrollmentBlockReason(
      {
        status: "PENDING_REVIEW",
        studentId: null,
        proposedSectionId: "sec_1",
        draftFirstName: "Aarav",
        enquiryPhone: "9999999999",
      },
      1,
    ),
    "Only approved admissions can be enrolled.",
  );

  assert.equal(
    getEnrollmentBlockReason(
      {
        status: "APPROVED",
        studentId: null,
        proposedSectionId: "sec_1",
        draftFirstName: "Aarav",
        enquiryPhone: "9999999999",
      },
      0,
    ),
    "Record the admission fee before final admission.",
  );

  assert.equal(
    getEnrollmentBlockReason(
      {
        status: "APPROVED",
        studentId: null,
        proposedSectionId: "sec_1",
        draftFirstName: "Aarav",
        enquiryPhone: "   ",
      },
      1,
    ),
    "Enquiry phone is missing; cannot create parent.",
  );
});

test("enrollment helper returns no blocker when admission is ready", () => {
  assert.equal(
    getEnrollmentBlockReason(
      {
        status: "APPROVED",
        studentId: null,
        proposedSectionId: "sec_1",
        draftFirstName: "Aarav",
        enquiryPhone: "9999999999",
      },
      1,
    ),
    null,
  );
});
