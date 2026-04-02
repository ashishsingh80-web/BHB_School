"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireInventoryAccess } from "@/lib/auth";
import { emptyToNull } from "@/lib/form-helpers";
import {
  getInventoryIssueBlockReason,
  normalizeInventoryDirection,
  parseInventoryQuantity,
  parseInventoryReorderLevel,
} from "@/lib/inventory-rules";

export async function createInventoryItem(formData: FormData) {
  await requireInventoryAccess();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Item name is required.");

  const reorderLevel = parseInventoryReorderLevel(
    String(formData.get("reorderLevel") ?? ""),
  );

  await prisma.inventoryItem.create({
    data: {
      name,
      sku: emptyToNull(formData.get("sku")),
      unit: String(formData.get("unit") ?? "").trim() || "PCS",
      reorderLevel: reorderLevel ?? undefined,
    },
  });

  revalidatePath("/inventory/items");
  revalidatePath("/inventory/stock");
  revalidatePath("/inventory/alerts");
  revalidatePath("/dashboard");
}

export async function recordInventoryTxn(formData: FormData) {
  await requireInventoryAccess();

  const itemId = String(formData.get("itemId") ?? "").trim();
  if (!itemId) throw new Error("Select an item.");

  const direction = normalizeInventoryDirection(String(formData.get("direction") ?? ""));

  const qty = parseInventoryQuantity(String(formData.get("qty") ?? ""), "quantity");

  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new Error("Item not found.");

    const onHand = Number(item.qtyOnHand);
    const stockBlock = getInventoryIssueBlockReason(direction, onHand, qty);
    if (stockBlock) throw new Error(stockBlock);

    await tx.inventoryTxn.create({
      data: {
        itemId,
        qty,
        direction,
        ref: emptyToNull(formData.get("ref")),
      },
    });

    await tx.inventoryItem.update({
      where: { id: itemId },
      data: {
        qtyOnHand:
          direction === "IN"
            ? { increment: qty }
            : { decrement: qty },
      },
    });
  });

  revalidatePath("/inventory/items");
  revalidatePath("/inventory/stock");
  revalidatePath("/inventory/issues");
  revalidatePath("/inventory/alerts");
  revalidatePath("/dashboard");
}
