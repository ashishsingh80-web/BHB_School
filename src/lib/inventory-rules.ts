export function parseInventoryQuantity(raw: string, label = "quantity") {
  const value = Number.parseFloat(raw.trim());
  if (Number.isNaN(value) || value <= 0) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

export function parseInventoryReorderLevel(raw: string) {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }

  const value = Number.parseFloat(trimmed);
  if (Number.isNaN(value) || value < 0) {
    throw new Error("Invalid reorder level.");
  }

  return value;
}

export function normalizeInventoryDirection(raw: string) {
  const direction = raw.trim().toUpperCase();
  if (direction !== "IN" && direction !== "OUT") {
    throw new Error("Direction must be IN or OUT.");
  }
  return direction;
}

export function getInventoryIssueBlockReason(direction: "IN" | "OUT", onHand: number, qty: number) {
  if (direction === "OUT" && onHand < qty) {
    return "Insufficient stock for this issue.";
  }

  return null;
}
