export type SeasonalRate = {
  seasonName: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  pricePerPerson: number | string | { toString(): string };
  currency: string;
  isEstimate: boolean;
};

export function getSeasonalPriceSnapshot(snapshot: unknown) {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) {
    return null;
  }
  const price = (snapshot as Record<string, unknown>).seasonalPrice;
  if (typeof price !== "object" || price === null || Array.isArray(price)) {
    return null;
  }
  const values = price as Record<string, unknown>;
  if (
    typeof values.seasonName !== "string" ||
    typeof values.pricePerPerson !== "string" ||
    typeof values.currency !== "string" ||
    typeof values.isEstimate !== "boolean"
  ) {
    return null;
  }
  return {
    seasonName: values.seasonName,
    pricePerPerson: values.pricePerPerson,
    currency: values.currency,
    isEstimate: values.isEstimate,
  };
}

function dayOfYear(month: number, day: number) {
  const date = new Date(Date.UTC(2000, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return Math.floor((date.getTime() - Date.UTC(2000, 0, 1)) / 86_400_000);
}

export function isValidSeasonRange(rate: Pick<
  SeasonalRate,
  "startMonth" | "startDay" | "endMonth" | "endDay"
>) {
  return (
    dayOfYear(rate.startMonth, rate.startDay) !== null &&
    dayOfYear(rate.endMonth, rate.endDay) !== null
  );
}

function containsDay(
  rate: Pick<SeasonalRate, "startMonth" | "startDay" | "endMonth" | "endDay">,
  day: number,
) {
  const start = dayOfYear(rate.startMonth, rate.startDay);
  const end = dayOfYear(rate.endMonth, rate.endDay);
  if (start === null || end === null) return false;
  return start <= end ? day >= start && day <= end : day >= start || day <= end;
}

export function findSeasonalRate<T extends SeasonalRate>(
  rates: T[],
  travelDate: Date,
) {
  const day = dayOfYear(travelDate.getUTCMonth() + 1, travelDate.getUTCDate());
  if (day === null) return undefined;
  return rates.find((rate) => containsDay(rate, day));
}

export function hasOverlappingSeasonRanges(
  rates: Array<
    Pick<SeasonalRate, "startMonth" | "startDay" | "endMonth" | "endDay">
  >,
) {
  const coveredDays = new Set<number>();
  for (const rate of rates) {
    for (let day = 0; day < 366; day += 1) {
      if (!containsDay(rate, day)) continue;
      if (coveredDays.has(day)) return true;
      coveredDays.add(day);
    }
  }
  return false;
}

export function formatSeasonDate(month: number, day: number) {
  return new Date(Date.UTC(2000, month - 1, day)).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatPrice(amount: number | string | { toString(): string }, currency = "USD") {
  const numericAmount = Number(amount);
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: Number.isInteger(numericAmount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}
