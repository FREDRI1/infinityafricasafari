import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultHomepageContent } from "../src/data/homepage";
import { homepageContentSchema } from "../src/lib/homepage-content";

test("validates the starter homepage excursions and guest reviews", () => {
  const result = homepageContentSchema.safeParse(defaultHomepageContent);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.excursions.length, 3);
    assert.equal(result.data.reviews.length, 3);
  }
});

test("rejects invalid excursion prices and review ratings", () => {
  const invalidContent = structuredClone(defaultHomepageContent);
  invalidContent.excursions[0].priceUsd = -1;
  invalidContent.reviews[0].rating = 6;

  assert.equal(homepageContentSchema.safeParse(invalidContent).success, false);
});
