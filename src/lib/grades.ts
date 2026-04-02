import type { GradeBand } from "@prisma/client";

/**
 * Pick the grade label for a percentage using bands where the student must score
 * at least `minPercent` to earn that grade. Uses the highest `minPercent` that
 * the percentage still satisfies (bands compared by minPercent descending).
 */
export function gradeLabelForPercent(
  percent: number,
  bands: Pick<GradeBand, "label" | "minPercent">[],
): string {
  if (!Number.isFinite(percent) || bands.length === 0) return "—";
  const sorted = [...bands].sort(
    (a, b) => Number(b.minPercent) - Number(a.minPercent),
  );
  for (const b of sorted) {
    if (percent >= Number(b.minPercent)) return b.label;
  }
  return "—";
}
