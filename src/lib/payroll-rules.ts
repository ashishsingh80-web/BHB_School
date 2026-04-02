export function derivePayrollNetAmount(
  grossAmount: number | null,
  deductionsAmount: number,
  providedNetAmount: number | null,
) {
  if (providedNetAmount !== null) {
    return providedNetAmount;
  }

  if (grossAmount === null) {
    return null;
  }

  return Math.max(grossAmount - deductionsAmount, 0);
}

export function normalizePayrollStatus(rawStatus: string) {
  return rawStatus.trim().toUpperCase() === "PROCESSED" ? "PROCESSED" : "DRAFT";
}

export function getNextPayrollStatus(currentStatus: string) {
  return currentStatus === "PROCESSED" ? "DRAFT" : "PROCESSED";
}
