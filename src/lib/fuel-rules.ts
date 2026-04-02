type FuelDirectionTotal = {
  direction: string;
  quantityLiters: number;
};

export function parseOptionalFuelRate(rateRaw: string) {
  const trimmed = rateRaw.trim();
  if (trimmed === "") {
    return null;
  }

  const rate = Number.parseFloat(trimmed);
  if (Number.isNaN(rate) || rate < 0) {
    throw new Error("Invalid rate per liter.");
  }

  return rate;
}

export function parseOptionalOdometerKm(odoRaw: string) {
  const trimmed = odoRaw.trim();
  if (trimmed === "") {
    return undefined;
  }

  const odometerKm = Number.parseFloat(trimmed);
  if (Number.isNaN(odometerKm) || odometerKm < 0) {
    throw new Error("Invalid odometer reading.");
  }

  return odometerKm;
}

export function getAvailableFuelLiters(totals: FuelDirectionTotal[]) {
  const totalIn = totals
    .filter((row) => row.direction === "IN")
    .reduce((sum, row) => sum + row.quantityLiters, 0);
  const totalOut = totals
    .filter((row) => row.direction === "OUT")
    .reduce((sum, row) => sum + row.quantityLiters, 0);

  return totalIn - totalOut;
}

export function getFuelIssueBlockReason(quantityLiters: number, availableLiters: number) {
  if (quantityLiters > availableLiters + 1e-9) {
    return `Insufficient fuel stock. Available: ${availableLiters.toFixed(2)} L.`;
  }

  return null;
}
