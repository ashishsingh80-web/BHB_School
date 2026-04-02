import test from "node:test";
import assert from "node:assert/strict";

import {
  getAvailableFuelLiters,
  getFuelIssueBlockReason,
  parseOptionalFuelRate,
  parseOptionalOdometerKm,
} from "@/lib/fuel-rules";

test("parseOptionalFuelRate accepts blank and valid non-negative rates", () => {
  assert.equal(parseOptionalFuelRate(""), null);
  assert.equal(parseOptionalFuelRate(" 96.45 "), 96.45);
});

test("parseOptionalFuelRate rejects invalid values", () => {
  assert.throws(() => parseOptionalFuelRate("-1"), /Invalid rate per liter\./);
  assert.throws(() => parseOptionalFuelRate("abc"), /Invalid rate per liter\./);
});

test("parseOptionalOdometerKm accepts blank and valid non-negative readings", () => {
  assert.equal(parseOptionalOdometerKm(""), undefined);
  assert.equal(parseOptionalOdometerKm(" 45231.5 "), 45231.5);
});

test("parseOptionalOdometerKm rejects invalid readings", () => {
  assert.throws(() => parseOptionalOdometerKm("-10"), /Invalid odometer reading\./);
  assert.throws(() => parseOptionalOdometerKm("oops"), /Invalid odometer reading\./);
});

test("getAvailableFuelLiters calculates current stock from in and out totals", () => {
  assert.equal(
    getAvailableFuelLiters([
      { direction: "IN", quantityLiters: 120 },
      { direction: "IN", quantityLiters: 30.5 },
      { direction: "OUT", quantityLiters: 40.25 },
    ]),
    110.25,
  );
});

test("getFuelIssueBlockReason blocks issues larger than available stock", () => {
  assert.equal(
    getFuelIssueBlockReason(50, 42.5),
    "Insufficient fuel stock. Available: 42.50 L.",
  );
  assert.equal(getFuelIssueBlockReason(40, 42.5), null);
});
