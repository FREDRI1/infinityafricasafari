import assert from "node:assert/strict";
import test from "node:test";
import {
  getSafariSlugFromTarget,
  normalizeMarketplaceClick,
} from "../src/lib/marketplace-clicks";

const requestUrl = "https://infinityafricasafari.com/api/tracks/click";

test("normalizes click labels and keeps only the safari query parameter", () => {
  assert.deepEqual(
    normalizeMarketplaceClick(
      {
        elementClicked: "  Request\n journey button  ",
        targetUrl: "/booking?safari=maasai-mara-safari&email=guest%40example.com",
      },
      requestUrl,
    ),
    {
      elementClicked: "Request journey button",
      targetUrl: "/booking?safari=maasai-mara-safari",
    },
  );
});

test("rejects admin and API destinations and invalid click payloads", () => {
  assert.equal(
    normalizeMarketplaceClick(
      { elementClicked: "Admin", targetUrl: "/admin/reports" },
      requestUrl,
    ),
    null,
  );
  assert.equal(
    normalizeMarketplaceClick(
      { elementClicked: "API", targetUrl: "/api/admin/media" },
      requestUrl,
    ),
    null,
  );
  assert.equal(
    normalizeMarketplaceClick(
      { elementClicked: " ", targetUrl: "/safaris/example" },
      requestUrl,
    ),
    null,
  );
});

test("accepts HTTPS external links without retaining their query strings", () => {
  assert.deepEqual(
    normalizeMarketplaceClick(
      {
        elementClicked: "Contact us",
        targetUrl: "https://example.com/contact?token=private#form",
      },
      requestUrl,
    ),
    {
      elementClicked: "Contact us",
      targetUrl: "https://example.com/contact",
    },
  );
});

test("finds safari slugs from package pages and booking calls to action", () => {
  assert.equal(
    getSafariSlugFromTarget("/safaris/maasai-mara-safari"),
    "maasai-mara-safari",
  );
  assert.equal(
    getSafariSlugFromTarget("/booking?safari=maasai-mara-safari"),
    "maasai-mara-safari",
  );
  assert.equal(getSafariSlugFromTarget("/booking"), null);
});
