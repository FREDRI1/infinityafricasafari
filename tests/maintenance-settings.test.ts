import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultMaintenanceSettings,
  maintenanceSettingsSchema,
} from "../src/lib/maintenance-settings";

test("marketplace maintenance has an open, branded first-run default", () => {
  assert.equal(maintenanceSettingsSchema.safeParse(defaultMaintenanceSettings).success, true);
  assert.equal(defaultMaintenanceSettings.enabled, false);
  assert.match(defaultMaintenanceSettings.backgroundImage, /^\/assets\//);
});

test("maintenance settings validate visitor copy and the selected background", () => {
  const parsed = maintenanceSettingsSchema.safeParse({
    enabled: true,
    backgroundImage: "uploads/safari.jpg",
    heading: "We will be back soon",
    message: "We are improving the marketplace. Please return soon.",
  });
  assert.equal(parsed.success, true);

  assert.equal(
    maintenanceSettingsSchema.safeParse({
      enabled: "true",
      backgroundImage: "",
      heading: "OK",
      message: "short",
    }).success,
    false,
  );
});
