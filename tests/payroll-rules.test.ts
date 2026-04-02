import test from "node:test";
import assert from "node:assert/strict";

import {
  derivePayrollNetAmount,
  getNextPayrollStatus,
  normalizePayrollStatus,
} from "@/lib/payroll-rules";

test("derivePayrollNetAmount prefers an explicit net amount", () => {
  assert.equal(derivePayrollNetAmount(50000, 5000, 42000), 42000);
});

test("derivePayrollNetAmount falls back to gross minus deductions", () => {
  assert.equal(derivePayrollNetAmount(50000, 5000, null), 45000);
});

test("derivePayrollNetAmount floors inferred net amount at zero", () => {
  assert.equal(derivePayrollNetAmount(3000, 5000, null), 0);
});

test("derivePayrollNetAmount stays null when gross and net are both missing", () => {
  assert.equal(derivePayrollNetAmount(null, 5000, null), null);
});

test("normalizePayrollStatus only keeps processed explicitly", () => {
  assert.equal(normalizePayrollStatus("processed"), "PROCESSED");
  assert.equal(normalizePayrollStatus("draft"), "DRAFT");
  assert.equal(normalizePayrollStatus("anything-else"), "DRAFT");
});

test("getNextPayrollStatus toggles between draft and processed", () => {
  assert.equal(getNextPayrollStatus("DRAFT"), "PROCESSED");
  assert.equal(getNextPayrollStatus("PROCESSED"), "DRAFT");
  assert.equal(getNextPayrollStatus("SOMETHING_ELSE"), "PROCESSED");
});
