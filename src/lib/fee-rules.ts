import type { FeeTxnType } from "@prisma/client";

const LEDGER_FEE_TXN_TYPES = [
  "REFUND",
  "ADJUSTMENT",
  "CONCESSION",
  "LATE_FEE",
  "INVOICE",
] as const satisfies FeeTxnType[];

export function parsePositiveFeeAmount(amountRaw: string) {
  const amount = Number.parseFloat(amountRaw.trim());
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount.");
  }
  return amount;
}

export function normalizeFeeReceiptNo(receiptNo: string | null | undefined, now = Date.now()) {
  const trimmed = receiptNo?.trim();
  if (trimmed) {
    return trimmed;
  }
  return `RCP-${now}`;
}

export function parseLedgerFeeTxnType(typeRaw: string): FeeTxnType {
  const trimmed = typeRaw.trim();
  if (!(LEDGER_FEE_TXN_TYPES as readonly string[]).includes(trimmed)) {
    throw new Error("Invalid transaction type.");
  }
  return trimmed as FeeTxnType;
}

export function getAllowedLedgerFeeTxnTypes() {
  return [...LEDGER_FEE_TXN_TYPES];
}
