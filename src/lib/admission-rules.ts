type ReviewableAdmission = {
  status: string;
  proposedSectionId: string | null;
  draftFirstName: string | null;
};

type EnrollableAdmission = {
  status: string;
  studentId: string | null;
  proposedSectionId: string | null;
  draftFirstName: string | null;
  enquiryPhone: string | null;
};

export function getReviewSubmissionBlockReason(
  admission: ReviewableAdmission,
  blockingDocumentLabels: string[],
) {
  if (admission.status !== "REGISTERED") {
    return "Only draft registrations can be submitted for review.";
  }

  if (!admission.proposedSectionId || !admission.draftFirstName) {
    return "Choose a section and enter the student name before submitting.";
  }

  if (blockingDocumentLabels.length > 0) {
    return `Required documents must be Verified or Waived: ${blockingDocumentLabels.join(", ")}`;
  }

  return null;
}

export function getEnrollmentBlockReason(
  admission: EnrollableAdmission,
  feeCount: number,
) {
  if (admission.status !== "APPROVED") {
    return "Only approved admissions can be enrolled.";
  }

  if (admission.studentId) {
    return "Student already created for this admission.";
  }

  if (!admission.proposedSectionId || !admission.draftFirstName) {
    return "Section and student name are required.";
  }

  if (feeCount === 0) {
    return "Record the admission fee before final admission.";
  }

  if (!admission.enquiryPhone?.trim()) {
    return "Enquiry phone is missing; cannot create parent.";
  }

  return null;
}
