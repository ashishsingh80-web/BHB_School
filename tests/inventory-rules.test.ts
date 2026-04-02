import test from "node:test";
import assert from "node:assert/strict";

import {
  getInventoryIssueBlockReason,
  normalizeInventoryDirection,
  parseInventoryQuantity,
  parseInventoryReorderLevel,
} from "@/lib/inventory-rules";

test("parseInventoryQuantity accepts positive values", () => {
  assert.equal(parseInventoryQuantity("5"), 5);
  assert.equal(parseInventoryQuantity(" 2.75 ", "amount"), 2.75);
});

test("parseInventoryQuantity rejects zero and invalid input", () => {
  assert.throws(() => parseInventoryQuantity("0"), /Invalid quantity\./);
  assert.throws(() => parseInventoryQuantity("-1"), /Invalid quantity\./);
  assert.throws(() => parseInventoryQuantity("abc"), /Invalid quantity\./);
});

test("parseInventoryReorderLevel accepts blank and non-negative values", () => {
  assert.equal(parseInventoryReorderLevel(""), null);
  assert.equal(parseInventoryReorderLevel("0"), 0);
  assert.equal(parseInventoryReorderLevel(" 10.5 "), 10.5);
});

test("parseInventoryReorderLevel rejects invalid values", () => {
  assert.throws(() => parseInventoryReorderLevel("-1"), /Invalid reorder level\./);
  assert.throws(() => parseInventoryReorderLevel("abc"), /Invalid reorder level\./);
});

test("normalizeInventoryDirection accepts IN and OUT case-insensitively", () => {
  assert.equal(normalizeInventoryDirection("in"), "IN");
  assert.equal(normalizeInventoryDirection(" OUT "), "OUT");
  assert.throws(() => normalizeInventoryDirection("MOVE"), /Direction must be IN or OUT\./);
});

test("getInventoryIssueBlockReason only blocks stock-out beyond on-hand quantity", () => {
  assert.equal(getInventoryIssueBlockReason("IN", 0, 10), null);
  assert.equal(getInventoryIssueBlockReason("OUT", 5, 10), "Insufficient stock for this issue.");
  assert.equal(getInventoryIssueBlockReason("OUT", 10, 5), null);
});
