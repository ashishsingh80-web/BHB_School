import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllowedLedgerFeeTxnTypes,
  normalizeFeeReceiptNo,
  parseLedgerFeeTxnType,
  parsePositiveFeeAmount,
} from "@/lib/fee-rules";

test("parsePositiveFeeAmount accepts positive values", () => {
  assert.equal(parsePositiveFeeAmount("1250"), 1250);
  assert.equal(parsePositiveFeeAmount(" 99.5 "), 99.5);
});

test("parsePositiveFeeAmount rejects zero and invalid inputs", () => {
  assert.throws(() => parsePositiveFeeAmount("0"), /Invalid amount\./);
  assert.throws(() => parsePositiveFeeAmount("-10"), /Invalid amount\./);
  assert.throws(() => parsePositiveFeeAmount("abc"), /Invalid amount\./);
});

test("normalizeFeeReceiptNo keeps a provided receipt number", () => {
  assert.equal(normalizeFeeReceiptNo("  RCP-MANUAL-1  ", 123), "RCP-MANUAL-1");
});

test("normalizeFeeReceiptNo generates a fallback receipt number when empty", () => {
  assert.equal(normalizeFeeReceiptNo("", 123456), "RCP-123456");
  assert.equal(normalizeFeeReceiptNo(null, 654321), "RCP-654321");
});

test("parseLedgerFeeTxnType accepts only allowed ledger transaction types", () => {
  for (const type of getAllowedLedgerFeeTxnTypes()) {
    assert.equal(parseLedgerFeeTxnType(type), type);
  }
  assert.throws(() => parseLedgerFeeTxnType("PAYMENT"), /Invalid transaction type\./);
});
