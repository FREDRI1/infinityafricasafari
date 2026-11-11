import assert from "node:assert/strict";
import { test } from "node:test";
import { bookingRequestSchema } from "../src/lib/booking-validation";

function futureDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 2);
  return date.toISOString().slice(0, 10);
}

const validRequest = {
  submissionId: "8c5a5a58-056b-4d0f-8909-1f7bb31d9a1e",
  safariSlug: "maasai-mara-safari",
  travelDate: futureDate(),
  adults: 2,
  children: 0,
  rooms: 1,
  requestedActivities: "Bird watching",
  accommodationPreference: "Let's discuss",
  fullName: "A safari guest",
  email: "guest@example.com",
  phone: "+254 700 000 000",
  whatsapp: "",
  countryOfResidence: "",
  preferredCommunication: "EMAIL",
  specialRequirements: "",
  website: "",
};

test("accepts a complete future-dated assisted booking request", () => {
  const result = bookingRequestSchema.safeParse(validRequest);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.adults, 2);
    assert.equal(result.data.requestedActivities, "Bird watching");
  }
});

test("rejects a travel date that has already passed", () => {
  const result = bookingRequestSchema.safeParse({
    ...validRequest,
    travelDate: "2020-01-01",
  });

  assert.equal(result.success, false);
});

test("rejects invalid customer email and zero adult travelers", () => {
  const result = bookingRequestSchema.safeParse({
    ...validRequest,
    email: "not-an-email",
    adults: 0,
  });

  assert.equal(result.success, false);
});

test("rejects requests that include card or payment fields", () => {
  const result = bookingRequestSchema.safeParse({
    ...validRequest,
    cardNumber: "4111111111111111",
  });

  assert.equal(result.success, false);
});
