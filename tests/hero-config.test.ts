import assert from "node:assert/strict";
import test from "node:test";
import { HeroMode } from "@prisma/client";
import {
  DEFAULT_HERO_CONFIG,
  heroConfigInputSchema,
  isLocalHeroImagePath,
  isUploadedHeroVideoKey,
  normalizeHeroVideoSource,
  normalizeHeroVideoPath,
} from "../src/lib/hero-config";

const validCopy = {
  headingText: "Experience Untamed Africa",
  subheadingText: "A thoughtful journey shaped around your sense of adventure.",
};

test("homepage hero has a complete first-run fallback", () => {
  assert.equal(DEFAULT_HERO_CONFIG.mode, HeroMode.SINGLE_IMAGE);
  assert.equal(DEFAULT_HERO_CONFIG.imageUrls.length, 1);
  assert.ok(DEFAULT_HERO_CONFIG.headingText.length > 0);
  assert.ok(DEFAULT_HERO_CONFIG.subheadingText.length > 0);
});

test("validates single image, slideshow and video hero configurations", () => {
  assert.equal(
    heroConfigInputSchema.safeParse({
      mode: HeroMode.SINGLE_IMAGE,
      imageUrls: ["/assets/images/hero/savannah-dawn.jpg"],
      videoUrl: "",
      ...validCopy,
    }).success,
    true,
  );
  assert.equal(
    heroConfigInputSchema.safeParse({
      mode: HeroMode.ANIMATED_SLIDESHOW,
      imageUrls: [
        "/assets/images/hero/savannah-dawn.jpg",
        "uploads/12ab34cd.jpg",
      ],
      videoUrl: "",
      ...validCopy,
    }).success,
    true,
  );
  assert.equal(
    heroConfigInputSchema.safeParse({
      mode: HeroMode.VIDEO,
      imageUrls: [],
      videoUrl: "/assets/videos/safari.mp4",
      ...validCopy,
    }).success,
    true,
  );
});

test("rejects incomplete, duplicate, external and traversal hero media", () => {
  const check = (mode: HeroMode, imageUrls: string[], videoUrl = "") =>
    heroConfigInputSchema.safeParse({
      mode,
      imageUrls,
      videoUrl,
      ...validCopy,
    }).success;

  assert.equal(check(HeroMode.SINGLE_IMAGE, []), false);
  assert.equal(
    check(HeroMode.ANIMATED_SLIDESHOW, [
      "/assets/images/hero/savannah-dawn.jpg",
    ]),
    false,
  );
  assert.equal(
    check(HeroMode.ANIMATED_SLIDESHOW, [
      "uploads/12ab34cd.jpg",
      "uploads/12ab34cd.jpg",
    ]),
    false,
  );
  assert.equal(
    check(HeroMode.SINGLE_IMAGE, ["https://example.com/image.jpg"]),
    false,
  );
  assert.equal(
    check(HeroMode.SINGLE_IMAGE, ["/assets/../private/image.jpg"]),
    false,
  );
  assert.equal(check(HeroMode.VIDEO, [], "https://example.com/hero.mp4"), false);
});

test("normalizes only safe local hero assets", () => {
  assert.equal(isLocalHeroImagePath("/assets/images/hero/safari.webp"), true);
  assert.equal(isLocalHeroImagePath("/assets//safari.webp"), false);
  assert.equal(normalizeHeroVideoPath(" /assets/videos/hero.mp4 "), "/assets/videos/hero.mp4");
  assert.equal(normalizeHeroVideoPath("/assets/../hero.mp4"), null);
  assert.equal(normalizeHeroVideoPath("/assets/videos/hero.webm"), null);
  assert.equal(isUploadedHeroVideoKey("uploads/1a2b3c4d-1234-1234-1234-123456789abc.mp4"), true);
  assert.equal(isUploadedHeroVideoKey("uploads/../hero.mp4"), false);
  assert.equal(
    normalizeHeroVideoSource("uploads/1a2b3c4d-1234-1234-1234-123456789abc.mp4"),
    "uploads/1a2b3c4d-1234-1234-1234-123456789abc.mp4",
  );
});
