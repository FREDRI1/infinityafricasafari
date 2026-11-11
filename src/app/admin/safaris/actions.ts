"use server";

import { Prisma, StaffRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminMediaSource } from "@/lib/admin-media";
import { requireStaff } from "@/lib/admin";
import { hasOverlappingSeasonRanges, isValidSeasonRange } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

const seasonalPriceSchema = z.object({
  seasonName: z.string().trim().min(2).max(60),
  startMonth: z.coerce.number().int().min(1).max(12),
  startDay: z.coerce.number().int().min(1).max(31),
  endMonth: z.coerce.number().int().min(1).max(12),
  endDay: z.coerce.number().int().min(1).max(31),
  pricePerPerson: z.coerce.number().positive().max(10_000_000),
  currency: z.literal("USD"),
  isEstimate: z.boolean(),
});

const safariInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  summary: z.string().trim().min(30).max(1000),
  description: z.string().trim().max(8000),
  durationDays: z.coerce.number().int().min(1).max(60),
  category: z.string().trim().min(2).max(60),
  region: z.string().trim().min(2).max(120),
  destinationId: z.string().min(1),
  coverImage: z.string().min(1).max(1000),
  imageAlt: z.string().trim().min(5).max(250),
  highlights: z.string().max(1000),
  isPublished: z.boolean(),
  seasonalPrices: z.array(seasonalPriceSchema).max(12),
});

const itineraryDaySchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1500),
});

const contentRoles = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.CONTENT_EDITOR,
];

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field : "";
}

function isChecked(formData: FormData, key: string) {
  return formData.get(key) === "true";
}

function invalidateCatalogue(slug?: string) {
  revalidatePath("/");
  revalidatePath("/safaris");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/safaris/${slug}`);
  revalidatePath("/admin/safaris");
}

export async function saveSafari(formData: FormData) {
  const staff = await requireStaff(contentRoles);
  const rawId = value(formData, "id");
  const parsed = safariInputSchema.safeParse({
    title: value(formData, "title"),
    slug: value(formData, "slug"),
    summary: value(formData, "summary"),
    description: value(formData, "description"),
    durationDays: value(formData, "durationDays"),
    category: value(formData, "category"),
    region: value(formData, "region"),
    destinationId: value(formData, "destinationId"),
    coverImage: value(formData, "coverImage"),
    imageAlt: value(formData, "imageAlt"),
    highlights: value(formData, "highlights"),
    isPublished: isChecked(formData, "isPublished"),
    seasonalPrices: (() => {
      try {
        const parsed: unknown = JSON.parse(value(formData, "seasonalPrices"));
        return parsed;
      } catch {
        throw new Error("Seasonal prices could not be read. Review the pricing section.");
      }
    })(),
  });
  if (!parsed.success) {
    throw new Error(
      `Safari details are invalid: ${parsed.error.issues[0]?.message ?? "check the form."}`,
    );
  }
  if (!(await isAdminMediaSource(parsed.data.coverImage))) {
    throw new Error("Choose an image from the media library.");
  }

  let itinerary: z.infer<typeof itineraryDaySchema>[];
  try {
    const rawItinerary: unknown = JSON.parse(value(formData, "itinerary"));
    const parsedItinerary = z
      .array(itineraryDaySchema)
      .min(1)
      .max(30)
      .safeParse(rawItinerary);
    if (!parsedItinerary.success) {
      throw new Error("Add at least one valid itinerary day (maximum 30).");
    }
    itinerary = parsedItinerary.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("The itinerary could not be read. Review the day details.");
    }
    throw error;
  }

  const highlights = parsed.data.highlights
    .split(",")
    .map((highlight) => highlight.trim())
    .filter(Boolean)
    .slice(0, 12);
  const destination = await prisma.destination.findUnique({
    where: { id: parsed.data.destinationId },
    select: { id: true, isPublished: true, archivedAt: true },
  });
  if (!destination || destination.archivedAt) {
    throw new Error("Choose an active destination.");
  }
  if (parsed.data.isPublished && !destination.isPublished) {
    throw new Error("Publish the destination before publishing this safari.");
  }
  const prices = parsed.data.seasonalPrices;
  for (const price of prices) {
    if (!isValidSeasonRange(price)) {
      throw new Error(`The date range for "${price.seasonName}" is not valid.`);
    }
  }
  if (new Set(prices.map((price) => price.seasonName.toLocaleLowerCase())).size !== prices.length) {
    throw new Error("Each seasonal rate must have a unique season name.");
  }
  if (hasOverlappingSeasonRanges(prices)) {
    throw new Error("Seasonal date ranges cannot overlap.");
  }
  if (parsed.data.isPublished && prices.length === 0) {
    throw new Error("Add at least one seasonal price before publishing this safari.");
  }

  const id = rawId || undefined;
  const result = await prisma.$transaction(async (transaction) => {
    const existing = id
      ? await transaction.safari.findUnique({
          where: { id },
          select: { id: true, slug: true },
        })
      : null;
    if (id && !existing) throw new Error("Safari record was not found.");

    const commonData = {
      slug: parsed.data.slug,
      title: parsed.data.title,
      summary: parsed.data.summary,
      description: parsed.data.description || null,
      durationDays: parsed.data.durationDays,
      category: parsed.data.category,
      region: parsed.data.region,
      destinationId: destination.id,
      coverImage: parsed.data.coverImage,
      imageAlt: parsed.data.imageAlt,
      highlights,
      isPublished: parsed.data.isPublished,
      archivedAt: null,
    };

    const safari = existing
      ? await transaction.safari.update({
          where: { id: existing.id },
          data: commonData,
          select: { id: true, slug: true },
        })
      : await transaction.safari.create({
          data: {
            ...commonData,
            itineraryDays: {
              create: itinerary.map((day, index) => ({
                dayNumber: index + 1,
                title: day.title,
                description: day.description,
                activities: [],
                meals: [],
              })),
            },
            images: {
              create: {
                url: parsed.data.coverImage,
                altText: parsed.data.imageAlt,
                position: 0,
              },
            },
          },
          select: { id: true, slug: true },
        });

    if (existing) {
      await transaction.itineraryDay.deleteMany({
        where: { safariId: safari.id },
      });
      await transaction.itineraryDay.createMany({
        data: itinerary.map((day, index) => ({
          safariId: safari.id,
          dayNumber: index + 1,
          title: day.title,
          description: day.description,
          activities: [],
          meals: [],
        })),
      });
      await transaction.safariImage.deleteMany({
        where: { safariId: safari.id },
      });
      await transaction.safariImage.create({
        data: {
          safariId: safari.id,
          url: parsed.data.coverImage,
          altText: parsed.data.imageAlt,
          position: 0,
        },
      });
    }

    await transaction.safariSeasonPrice.deleteMany({
      where: { safariId: safari.id },
    });
    if (prices.length) {
      await transaction.safariSeasonPrice.createMany({
        data: prices.map((price) => ({
          safariId: safari.id,
          seasonName: price.seasonName,
          startMonth: price.startMonth,
          startDay: price.startDay,
          endMonth: price.endMonth,
          endDay: price.endDay,
          pricePerPerson: new Prisma.Decimal(price.pricePerPerson),
          currency: price.currency,
          isEstimate: price.isEstimate,
        })),
      });
    }

    await transaction.auditLog.create({
      data: {
        actorId: staff.id,
        action: existing ? "SAFARI_UPDATED" : "SAFARI_CREATED",
        entityType: "Safari",
        entityId: safari.id,
        details: {
          slug: safari.slug,
          published: parsed.data.isPublished,
          seasonalPrices: prices.map((price) => ({
            seasonName: price.seasonName,
            startMonth: price.startMonth,
            startDay: price.startDay,
            endMonth: price.endMonth,
            endDay: price.endDay,
            pricePerPerson: price.pricePerPerson.toFixed(2),
            currency: price.currency,
            isEstimate: price.isEstimate,
          })),
        } satisfies Prisma.InputJsonObject,
      },
    });

    return { safari, previousSlug: existing?.slug };
  });

  invalidateCatalogue(result.previousSlug);
  invalidateCatalogue(result.safari.slug);
  redirect("/admin/safaris?saved=1");
}

export async function archiveSafari(safariId: string, _formData: FormData) {
  void _formData;
  const staff = await requireStaff(contentRoles);
  const safari = await prisma.safari.findUnique({
    where: { id: safariId },
    select: { id: true, slug: true },
  });
  if (!safari) throw new Error("Safari record was not found.");

  await prisma.$transaction([
    prisma.safari.update({
      where: { id: safari.id },
      data: { isPublished: false, archivedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: staff.id,
        action: "SAFARI_ARCHIVED",
        entityType: "Safari",
        entityId: safari.id,
        details: { slug: safari.slug },
      },
    }),
  ]);
  invalidateCatalogue(safari.slug);
  redirect("/admin/safaris?archived=1");
}
