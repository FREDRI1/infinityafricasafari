import assert from "node:assert/strict";
import test from "node:test";
import {
  brandSettingsSchema,
  defaultBrandSettings,
} from "../src/lib/brand-settings";

test("brand settings provide a usable default identity", () => {
  assert.deepEqual(defaultBrandSettings, {
    name: "Infinity Africa Safari",
    tagline: "Journeys shaped around you",
    logo: "",
    icon: "",
  });
});

test("brand settings accept a name, optional tagline, and optional media", () => {
  assert.deepEqual(
    brandSettingsSchema.parse({
      name: "  Acacia Journeys  ",
      tagline: "",
      logo: "",
      icon: "/assets/images/logo.png",
    }),
    {
      name: "Acacia Journeys",
      tagline: "",
      logo: "",
      icon: "/assets/images/logo.png",
    },
  );
});

test("brand settings reject a blank or overlong company name", () => {
  assert.equal(
    brandSettingsSchema.safeParse({
      ...defaultBrandSettings,
      name: " ",
    }).success,
    false,
  );
  assert.equal(
    brandSettingsSchema.safeParse({
      ...defaultBrandSettings,
      name: "A".repeat(81),
    }).success,
    false,
  );
});
