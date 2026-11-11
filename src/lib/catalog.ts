import { prisma } from "@/lib/prisma";
import {
  destinations as starterDestinations,
  safaris as starterSafaris,
  type Destination,
  type Safari,
} from "@/data/safaris";

export async function getPublicSafaris(): Promise<Safari[]> {
  if (!process.env.DATABASE_URL) return starterSafaris;

  const records = await prisma.safari.findMany({
    where: {
      isPublished: true,
      archivedAt: null,
      coverImage: { not: null },
      destination: {
        is: { isPublished: true, archivedAt: null },
      },
    },
    include: {
      destination: { select: { name: true, country: true } },
      itineraryDays: { orderBy: { dayNumber: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return records.map((record) => ({
    slug: record.slug,
    title: record.title,
    country: record.destination?.country ?? "East Africa",
    region: record.region ?? record.destination?.name ?? "East Africa",
    durationDays: record.durationDays,
    category: record.category,
    image: record.coverImage ?? "",
    imageAlt: record.imageAlt ?? `${record.title} safari landscape`,
    summary: record.summary,
    highlights: record.highlights,
    itinerary: record.itineraryDays.map((day) => ({
      title: day.title,
      description: day.description,
    })),
  }));
}

export async function getPublicSafariBySlug(slug: string) {
  const catalogue = await getPublicSafaris();
  return catalogue.find((safari) => safari.slug === slug);
}

export async function getPublicDestinations(): Promise<Destination[]> {
  if (!process.env.DATABASE_URL) return starterDestinations;

  const records = await prisma.destination.findMany({
    where: { isPublished: true, archivedAt: null },
    orderBy: { name: "asc" },
  });

  return records.map((destination) => ({
    name: destination.name,
    slug: destination.slug,
    country: destination.country,
    summary: destination.summary,
    description: destination.description ?? destination.summary,
    image: destination.heroImage ?? "/assets/images/destinations/wild-africa.jpg",
    imageAlt: destination.heroImageAlt ?? `${destination.name} landscape`,
    seoTitle: destination.seoTitle,
    seoDescription: destination.seoDescription,
  }));
}

export async function getPublicDestinationBySlug(
  slug: string,
): Promise<Destination | undefined> {
  if (!process.env.DATABASE_URL) {
    return starterDestinations.find((destination) => destination.slug === slug);
  }

  const destination = await prisma.destination.findFirst({
    where: { slug, isPublished: true, archivedAt: null },
  });
  if (!destination) return undefined;

  return {
    name: destination.name,
    slug: destination.slug,
    country: destination.country,
    summary: destination.summary,
    description: destination.description ?? destination.summary,
    image: destination.heroImage ?? "/assets/images/destinations/wild-africa.jpg",
    imageAlt: destination.heroImageAlt ?? `${destination.name} landscape`,
    seoTitle: destination.seoTitle,
    seoDescription: destination.seoDescription,
  };
}
