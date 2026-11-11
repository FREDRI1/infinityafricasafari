import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultOperationalSettings,
  operationalSettingsSchema,
} from "../src/lib/operational-settings";

test("operational settings default to accepting requests with environment email fallback", () => {
  assert.deepEqual(defaultOperationalSettings, {
    bookingRequestsEnabled: true,
    notificationEmail: "",
  });
});

test("validates booking intake and optional notification email settings", () => {
  assert.equal(
    operationalSettingsSchema.safeParse({
      bookingRequestsEnabled: false,
      notificationEmail: "bookings@example.com",
    }).success,
    true,
  );
  assert.equal(
    operationalSettingsSchema.safeParse({
      bookingRequestsEnabled: "false",
      notificationEmail: "",
    }).success,
    false,
  );
  assert.equal(
    operationalSettingsSchema.safeParse({
      bookingRequestsEnabled: true,
      notificationEmail: "not-an-email",
    }).success,
    false,
  );
});
