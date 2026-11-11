import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findSeasonalRate,
  hasOverlappingSeasonRanges,
  isValidSeasonRange,
} from "../src/lib/pricing";

const seasonalRates = [
  {
    seasonName: "Green season",
    startMonth: 11,
    startDay: 1,
    endMonth: 5,
    endDay: 31,
    pricePerPerson: "1800",
    currency: "USD",
    isEstimate: true,
  },
  {
    seasonName: "Peak season",
    startMonth: 6,
    startDay: 1,
    endMonth: 10,
    endDay: 31,
    pricePerPerson: "2500",
    currency: "USD",
    isEstimate: true,
  },
];

test("selects the correct seasonal rate for a travel date, including year-spanning seasons", () => {
  assert.equal(
    findSeasonalRate(seasonalRates, new Date("2027-01-15T00:00:00.000Z"))?.seasonName,
    "Green season",
  );
  assert.equal(
    findSeasonalRate(seasonalRates, new Date("2027-08-15T00:00:00.000Z"))?.seasonName,
    "Peak season",
  );
});

test("rejects impossible seasonal dates", () => {
  assert.equal(
    isValidSeasonRange({
      startMonth: 2,
      startDay: 30,
      endMonth: 3,
      endDay: 31,
    }),
    false,
  );
});

test("detects overlapping seasonal rates", () => {
  assert.equal(
    hasOverlappingSeasonRanges([
      { startMonth: 1, startDay: 1, endMonth: 6, endDay: 30 },
      { startMonth: 6, startDay: 1, endMonth: 12, endDay: 31 },
    ]),
    true,
  );
  assert.equal(hasOverlappingSeasonRanges(seasonalRates), false);
});
