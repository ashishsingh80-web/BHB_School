import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Best-effort audit row; failures are logged and do not throw (main mutation should still succeed).
 */
export async function writeAuditLog(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? undefined,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? undefined,
        meta: params.meta,
      },
    });
  } catch (err) {
    console.error("[audit-log] write failed", err);
  }
}
