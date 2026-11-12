import { randomBytes } from "node:crypto";
import { Prisma, BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPublicSafariBySlug } from "@/lib/catalog";
import { getBrandSettings } from "@/lib/brand-settings";
import { sendBookingEmails } from "@/lib/booking-email";
import { bookingRequestSchema } from "@/lib/booking-validation";
import { findSeasonalRate } from "@/lib/pricing";
import { getOperationalSettings } from "@/lib/operational-settings";
import { prisma } from "@/lib/prisma";
import { createRequestRateLimitKey } from "@/lib/request-rate-limit";

function generateReference() {
  const year = new Date().getUTCFullYear();
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `IAS-${year}-${suffix}`;
}

async function isRateLimited(request: Request) {
  const key = createRequestRateLimitKey(request, "booking-request");
  const now = new Date();
  const resetAt = new Date(now.getTime() + 15 * 60 * 1000);
  const result = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "BookingRateLimit" ("key", "count", "windowResetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "BookingRateLimit"."windowResetAt" <= ${now} THEN 1
        ELSE "BookingRateLimit"."count" + 1
      END,
      "windowResetAt" = CASE
        WHEN "BookingRateLimit"."windowResetAt" <= ${now}
          THEN ${resetAt}
        ELSE "BookingRateLimit"."windowResetAt"
      END
    RETURNING "count"
  `;
  return (result[0]?.count ?? 0) > 5;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== requestHost) {
        return NextResponse.json(
          { error: "Request origin is not allowed." },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Request origin is not allowed." },
        { status: 403 },
      );
    }
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_000) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json(
      { error: "Submit the request as JSON." },
      { status: 415 },
    );
  }

  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "The booking service is not configured yet. Please try again later." },
      { status: 503 },
    );
  }

  try {
    if (await isRateLimited(request)) {
      return NextResponse.json(
        { error: "Too many booking requests. Please try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }
  } catch (error) {
    console.error("Could not enforce booking request rate limit.", error);
    return NextResponse.json(
      { error: "The booking service is not available. Please try again later." },
      { status: 503 },
    );
  }

  let operationalSettings: Awaited<ReturnType<typeof getOperationalSettings>>;
  try {
    operationalSettings = await getOperationalSettings();
  } catch (error) {
    console.error("Could not load booking operational settings.", error);
    return NextResponse.json(
      { error: "The booking service is not available. Please try again later." },
      { status: 503 },
    );
  }
  if (!operationalSettings.bookingRequestsEnabled) {
    return NextResponse.json(
      { error: "Booking requests are temporarily paused. Please contact our team." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please review the highlighted booking details.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const values = parsed.data;
  if (values.website) {
    return NextResponse.json({ error: "Request could not be accepted." }, { status: 400 });
  }

  let safari: Awaited<ReturnType<typeof getPublicSafariBySlug>>;
  try {
    safari = await getPublicSafariBySlug(values.safariSlug);
  } catch (error) {
    console.error("Could not load safari details for booking request.", error);
    return NextResponse.json(
      { error: "The booking service is not available. Please try again later." },
      { status: 503 },
    );
  }
  if (!safari) {
    return NextResponse.json(
      { error: "Choose a safari journey from the list." },
      { status: 400 },
    );
  }

  try {
    const databaseSafari = await prisma.safari.findFirst({
      where: {
        slug: safari.slug,
        isPublished: true,
        archivedAt: null,
      },
      select: {
        id: true,
        seasonalPrices: {
          select: {
            seasonName: true,
            startMonth: true,
            startDay: true,
            endMonth: true,
            endDay: true,
            pricePerPerson: true,
            currency: true,
            isEstimate: true,
          },
        },
      },
    });
    if (!databaseSafari) {
      return NextResponse.json(
        { error: "This safari is no longer available for requests." },
        { status: 409 },
      );
    }
    const applicablePrice = findSeasonalRate(
      databaseSafari.seasonalPrices,
      new Date(`${values.travelDate}T00:00:00.000Z`),
    );

    const existing = await prisma.booking.findUnique({
      where: { submissionId: values.submissionId },
      select: { reference: true },
    });
    if (existing) {
      return NextResponse.json({ reference: existing.reference });
    }

    const branding = await getBrandSettings();
    const normalizedEmail = values.email.toLocaleLowerCase();
    const booking = await prisma.$transaction(async (transaction) => {
      const customer = await transaction.customer.upsert({
        where: { email: normalizedEmail },
        create: {
          fullName: values.fullName,
          email: normalizedEmail,
          phone: values.phone,
          whatsapp: values.whatsapp || null,
          countryOfResidence: values.countryOfResidence || null,
          preferredCommunication: values.preferredCommunication,
        },
        update: {
          fullName: values.fullName,
          phone: values.phone,
          whatsapp: values.whatsapp || null,
          countryOfResidence: values.countryOfResidence || null,
          preferredCommunication: values.preferredCommunication,
        },
        select: { id: true },
      });

      const created = await transaction.booking.create({
        data: {
          reference: generateReference(),
          submissionId: values.submissionId,
          status: BookingStatus.NEW_REQUEST,
          customerId: customer.id,
          safariId: databaseSafari.id,
          travelStart: new Date(`${values.travelDate}T00:00:00.000Z`),
          adults: values.adults,
          children: values.children,
          rooms: values.rooms,
          accommodationPreference: values.accommodationPreference || null,
          requestedActivities: values.requestedActivities
            .split(",")
            .map((activity) => activity.trim())
            .filter(Boolean)
            .slice(0, 10),
          preferredCommunication: values.preferredCommunication,
          specialRequirements: values.specialRequirements || null,
          safariSnapshot: {
            slug: safari.slug,
            title: safari.title,
            country: safari.country,
            region: safari.region,
            durationDays: safari.durationDays,
            category: safari.category,
            summary: safari.summary,
            seasonalPrice: applicablePrice
              ? {
                  seasonName: applicablePrice.seasonName,
                  pricePerPerson: applicablePrice.pricePerPerson.toString(),
                  currency: applicablePrice.currency,
                  isEstimate: applicablePrice.isEstimate,
                }
              : null,
          } satisfies Prisma.InputJsonObject,
          customerSnapshot: {
            fullName: values.fullName,
            email: normalizedEmail,
            phone: values.phone,
            whatsapp: values.whatsapp || null,
            countryOfResidence: values.countryOfResidence || null,
            preferredCommunication: values.preferredCommunication,
          } satisfies Prisma.InputJsonObject,
        },
        select: { id: true, reference: true },
      });

      await transaction.bookingStatusHistory.create({
        data: {
          bookingId: created.id,
          newStatus: BookingStatus.NEW_REQUEST,
          reason: "Public booking request received.",
        },
      });
      await transaction.auditLog.create({
        data: {
          action: "BOOKING_REQUEST_RECEIVED",
          entityType: "Booking",
          entityId: created.id,
          details: {
            reference: created.reference,
            safariSlug: safari.slug,
          },
        },
      });
      return created;
    });

    const emailStatus = await sendBookingEmails({
      reference: booking.reference,
      customerName: values.fullName,
      customerEmail: normalizedEmail,
      brandName: branding.name,
      notificationEmail: operationalSettings.notificationEmail,
      safariTitle: safari.title,
      travelDate: values.travelDate,
      guests: values.adults + values.children,
    });

    try {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { notificationStatus: emailStatus },
      });
    } catch (error) {
      console.error(
        `Could not record email status for booking ${booking.reference}.`,
        error,
      );
    }

    return NextResponse.json({ reference: booking.reference }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await prisma.booking.findUnique({
        where: { submissionId: values.submissionId },
        select: { reference: true },
      });
      if (duplicate) {
        return NextResponse.json({ reference: duplicate.reference });
      }
      return NextResponse.json(
        { error: "We could not assign a booking reference. Please try again." },
        { status: 409 },
      );
    }

    console.error("Could not save safari booking request.", error);
    return NextResponse.json(
      { error: "We could not save your request. Please try again later." },
      { status: 503 },
    );
  }
}
