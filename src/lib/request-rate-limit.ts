import { createHmac } from "node:crypto";

export function createRequestRateLimitKey(request: Request, namespace: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor
      ?.split(",")
      .map((address) => address.trim())
      .filter(Boolean)
      .at(-1) ||
    (process.env.NODE_ENV === "development" ? "localhost" : undefined);
  const secret = process.env.AUTH_SECRET;
  if (!clientIp || !secret) {
    throw new Error("Trusted client IP and rate limit secret are required.");
  }

  return createHmac("sha256", secret)
    .update(`${namespace}:${clientIp.slice(0, 64)}`)
    .digest("hex");
}
