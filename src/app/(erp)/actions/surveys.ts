"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmissionsAccess } from "@/lib/auth";
import { emptyToNull } from "@/lib/form-helpers";
import { getCurrentSession } from "@/lib/session-context";
import {
  getSurveyCoordinateBlockReason,
  getSurveyEnquiryNotes,
  parseSurveyCoordinate,
} from "@/lib/survey-rules";

export async function startSurvey(formData: FormData) {
  const user = await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session. Create one under Master Setup.");

  await prisma.survey.create({
    data: {
      sessionId: session.id,
      staffUserId: user.id,
      areaTag: emptyToNull(formData.get("areaTag")),
      notes: emptyToNull(formData.get("notes")),
    },
  });

  revalidatePath("/admissions/survey");
}

export async function addSurveyEntry(formData: FormData) {
  await requireAdmissionsAccess();
  const session = await getCurrentSession();
  if (!session) throw new Error("No academic session.");

  const surveyId = String(formData.get("surveyId") ?? "").trim();
  if (!surveyId) throw new Error("Missing survey.");

  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, sessionId: session.id },
  });
  if (!survey) throw new Error("Survey not found.");

  const childName = String(formData.get("childName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!childName || !phone) throw new Error("Child name and phone are required.");

  const createEnquiry = formData.get("createEnquiry") === "on";

  const lat = parseSurveyCoordinate(String(formData.get("latitude") ?? ""));
  const lng = parseSurveyCoordinate(String(formData.get("longitude") ?? ""));
  const coordBlock = getSurveyCoordinateBlockReason(lat, lng);
  if (coordBlock) throw new Error(coordBlock);

  const parentName = emptyToNull(formData.get("parentName"));
  const classSeeking = emptyToNull(formData.get("classSeeking"));
  const interestLevel = emptyToNull(formData.get("interestLevel"));
  const notes = emptyToNull(formData.get("entryNotes"));

  await prisma.$transaction(async (tx) => {
    let enquiryId: string | null = null;
    if (createEnquiry) {
      const enquiry = await tx.enquiry.create({
        data: {
          sessionId: session.id,
          childName,
          parentName,
          phone,
          email: null,
          source: "Field survey",
          classSeeking,
          status: "NEW",
          notes: getSurveyEnquiryNotes(notes, surveyId, survey.areaTag),
        },
      });
      enquiryId = enquiry.id;
    }

    await tx.surveyEntry.create({
      data: {
        surveyId,
        childName,
        phone,
        parentName,
        classSeeking,
        interestLevel,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        enquiryId,
        notes,
      },
    });
  });

  revalidatePath("/admissions/survey");
  revalidatePath("/admissions/enquiry-list");
  revalidatePath("/admissions/follow-up");
  revalidatePath("/dashboard");
}
