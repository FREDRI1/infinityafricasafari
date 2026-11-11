export type MarketplaceClickInput = {
  elementClicked: string;
  targetUrl: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maxElementLength = 160;
const maxTargetLength = 2048;

export function normalizeMarketplaceClick(
  input: unknown,
  requestUrl: string,
): MarketplaceClickInput | null {
  if (typeof input !== "object" || input === null) return null;

  const record = input as Record<string, unknown>;
  if (
    typeof record.elementClicked !== "string" ||
    typeof record.targetUrl !== "string" ||
    record.targetUrl.length > maxTargetLength
  ) {
    return null;
  }

  const elementClicked = record.elementClicked
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxElementLength);
  if (!elementClicked) return null;

  const rawTarget = record.targetUrl.trim();
  if (!rawTarget) return null;
  if (/^mailto:/i.test(rawTarget)) {
    return { elementClicked, targetUrl: "mailto:" };
  }
  if (/^tel:/i.test(rawTarget)) {
    return { elementClicked, targetUrl: "tel:" };
  }

  let baseUrl: URL;
  let target: URL;
  try {
    baseUrl = new URL(requestUrl);
    target = new URL(rawTarget, baseUrl);
  } catch {
    return null;
  }

  if (
    target.username ||
    target.password ||
    (target.protocol !== "https:" && target.origin !== baseUrl.origin)
  ) {
    return null;
  }

  const sameOrigin = target.origin === baseUrl.origin;
  if (
    sameOrigin &&
    (target.pathname === "/admin" ||
      target.pathname.startsWith("/admin/") ||
      target.pathname === "/api" ||
      target.pathname.startsWith("/api/"))
  ) {
    return null;
  }

  let targetUrl = sameOrigin
    ? target.pathname
    : `${target.origin}${target.pathname}`;

  if (sameOrigin && target.pathname === "/booking") {
    const safari = target.searchParams.get("safari");
    if (safari && slugPattern.test(safari)) {
      targetUrl += `?safari=${safari}`;
    }
  }

  if (targetUrl.length > maxTargetLength) return null;
  return { elementClicked, targetUrl };
}

export function getSafariSlugFromTarget(targetUrl: string): string | null {
  try {
    const target = new URL(targetUrl, "https://infinityafricasafari.invalid");
    const safariPath = target.pathname.match(/^\/safaris\/([a-z0-9-]+)\/?$/);
    const safariSlug =
      safariPath?.[1] ??
      (target.pathname === "/booking"
        ? target.searchParams.get("safari")
        : null);
    return safariSlug && slugPattern.test(safariSlug) ? safariSlug : null;
  } catch {
    return null;
  }
}
