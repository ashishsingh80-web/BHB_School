export function parseSurveyCoordinate(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function getSurveyCoordinateBlockReason(latitude: number | null, longitude: number | null) {
  if ((latitude === null) !== (longitude === null)) {
    return "Enter both latitude and longitude, or leave both empty.";
  }

  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    return "Latitude must be between -90 and 90.";
  }

  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    return "Longitude must be between -180 and 180.";
  }

  return null;
}

export function getSurveyEnquiryNotes(
  explicitNotes: string | null,
  surveyId: string,
  areaTag: string | null,
) {
  if (explicitNotes) {
    return explicitNotes;
  }

  return `Captured during field survey ${surveyId}${areaTag ? ` · area: ${areaTag}` : ""}`;
}
