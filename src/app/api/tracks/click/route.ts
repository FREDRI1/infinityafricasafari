import { NextRequest, NextResponse } from "next/server";
import { normalizeMarketplaceClick } from "@/lib/marketplace-clicks";
import { prisma } from "@/lib/prisma";
import { createRequestRateLimitKey } from "@/lib/request-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxBodyBytes = 4096;
const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 120;
const maxRateLimitEntries = 10_000;
const requestsByAddress = new Map<
  string,
  { count: number; resetAt: number }
>();

async function readLimitedBody(request: NextRequest) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBodyBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isRateLimited(request: NextRequest) {
  const key = createRequestRateLimitKey(request, "marketplace-click");
  const now = Date.now();
  const current = requestsByAddress.get(key);

  if (!current || current.resetAt <= now) {
    requestsByAddress.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    if (requestsByAddress.size > maxRateLimitEntries) {
      for (const [entryKey, value] of requestsByAddress) {
        if (value.resetAt <= now) requestsByAddress.delete(entryKey);
      }
      while (requestsByAddress.size > maxRateLimitEntries) {
        const oldestKey = requestsByAddress.keys().next().value;
        if (!oldestKey) break;
        requestsByAddress.delete(oldestKey);
      }
    }
    return false;
  }

  current.count += 1;
  return current.count > maxRequestsPerWindow;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let rateLimited: boolean;
  try {
    rateLimited = isRateLimited(request);
  } catch (error) {
    console.error("Could not enforce marketplace click rate limit.", error);
    return NextResponse.json(
      { error: "Click tracking is not available" },
      { status: 503 },
    );
  }

  if (rateLimited) {
    return NextResponse.json(
      { error: "Too many tracking requests" },
      { status: 429 },
    );
  }

  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "application/json" && contentType !== "text/plain") {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await readLimitedBody(request);
  if (!body) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const click = normalizeMarketplaceClick(input, request.url);
  if (!click) {
    return NextResponse.json({ error: "Invalid click data" }, { status: 400 });
  }

  const countryHeader = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  const country = countryHeader && /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : "XX";

  try {
    await prisma.marketplaceClick.create({
      data: { ...click, country },
      select: { id: true },
    });
  } catch (error) {
    console.error("Unable to persist marketplace click event.", error);
    return NextResponse.json(
      { error: "Unable to record click" },
      { status: 503 },
    );
  }

  return new NextResponse(null, { status: 202 });
}
