import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Compare webhook secrets in constant time (avoids leaking the expected value via string compare). */
function timingSafeSecretEqual(received: string, expected: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();
  try {
    return timingSafeEqual(digest(received), digest(expected));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.ONLINE_LEADS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "ONLINE_LEADS_WEBHOOK_SECRET is not configured" },
      { status: 503 },
    );
  }

  const hdr = request.headers.get("x-webhook-secret")?.trim() ?? "";
  if (!timingSafeSecretEqual(hdr, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const source = str(raw.source);
  if (!source) {
    return NextResponse.json({ error: "source is required" }, { status: 400 });
  }

  let session = null as Awaited<ReturnType<typeof prisma.academicSession.findFirst>>;
  const sid = str(raw.sessionId);
  if (sid) {
    session = await prisma.academicSession.findFirst({ where: { id: sid } });
  }
  if (!session) {
    session = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
  }
  if (!session) {
    session = await prisma.academicSession.findFirst({
      orderBy: { startDate: "desc" },
    });
  }
  if (!session) {
    return NextResponse.json({ error: "No academic session in database" }, { status: 503 });
  }

  const explicitCampaignTrackingId = opt(raw.campaignTrackingId);
  const derivedCampaignName = opt(raw.campaign) ?? opt(raw.utmCampaign);

  let campaignTrackingId: string | null = null;
  if (explicitCampaignTrackingId) {
    const tracking = await prisma.campaignTracking.findFirst({
      where: {
        id: explicitCampaignTrackingId,
        sessionId: session.id,
      },
      select: { id: true },
    });
    if (!tracking) {
      return NextResponse.json(
        { error: "campaignTrackingId is invalid for the resolved session" },
        { status: 400 },
      );
    }
    campaignTrackingId = tracking.id;
  } else if (derivedCampaignName) {
    const tracking = await prisma.campaignTracking.findFirst({
      where: {
        sessionId: session.id,
        source,
        campaignName: {
          equals: derivedCampaignName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });
    campaignTrackingId = tracking?.id ?? null;
  }

  const lead = await prisma.onlineLead.create({
    data: {
      sessionId: session.id,
      campaignTrackingId,
      source,
      campaign: opt(raw.campaign),
      utmSource: opt(raw.utmSource),
      utmMedium: opt(raw.utmMedium),
      utmCampaign: opt(raw.utmCampaign),
      utmContent: opt(raw.utmContent),
      childName: opt(raw.childName),
      phone: opt(raw.phone),
      email: opt(raw.email),
      rawPayload: raw as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ ok: true, id: lead.id });
}

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function opt(v: unknown) {
  const s = str(v);
  return s === "" ? null : s;
}
