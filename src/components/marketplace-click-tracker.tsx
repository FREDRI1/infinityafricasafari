"use client";

import { useEffect } from "react";

type ClickPayload = {
  elementClicked: string;
  targetUrl: string;
};

function getClickTarget(element: HTMLAnchorElement | HTMLButtonElement) {
  if (element instanceof HTMLAnchorElement) return element.href;
  return (
    element.formAction ||
    element.form?.getAttribute("action") ||
    window.location.pathname
  );
}

function getElementLabel(element: HTMLAnchorElement | HTMLButtonElement) {
  const explicitLabel = element
    .closest<HTMLElement>("[data-marketplace-click]")
    ?.dataset.marketplaceClick;
  const accessibleLabel =
    element.getAttribute("aria-label") ??
    element.querySelector("img[alt]")?.getAttribute("alt");
  const textLabel = element.textContent?.replace(/\s+/g, " ").trim();
  return (explicitLabel || accessibleLabel || textLabel || "Marketplace link").slice(
    0,
    160,
  );
}

function sendClick(payload: ClickPayload) {
  const body = JSON.stringify(payload);
  if (typeof navigator.sendBeacon === "function") {
    try {
      if (
        navigator.sendBeacon(
          "/api/tracks/click",
          new Blob([body], { type: "application/json" }),
        )
      ) {
        return;
      }
    } catch {
      // Fall back to a keepalive request if the browser cannot queue the beacon.
    }
  }

  void fetch("/api/tracks/click", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function MarketplaceClickTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.button !== 0 || !(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLAnchorElement | HTMLButtonElement>(
        "a[href], button",
      );
      if (
        !element ||
        (element instanceof HTMLButtonElement && element.disabled) ||
        element.closest("[data-marketplace-track='ignore']")
      ) {
        return;
      }

      sendClick({
        elementClicked: getElementLabel(element),
        targetUrl: getClickTarget(element),
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
