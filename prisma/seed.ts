import bcrypt from "bcryptjs";
import { PrismaClient, StaffRole } from "@prisma/client";
import { destinations, safaris } from "../src/data/safaris";

const prisma = new PrismaClient();

async function seed() {
  const email = process.env.ADMIN_EMAIL?.trim().toLocaleLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL before seeding the database.");
  }
  if (!email || !password || password.length < 14 || password.length > 128) {
    throw new Error(
      "Set ADMIN_EMAIL and an ADMIN_PASSWORD between 14 and 128 characters before seeding.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      name: process.env.ADMIN_NAME?.trim() || "Administrator",
      email,
      passwordHash,
      role: StaffRole.SUPER_ADMIN,
    },
    update: { role: StaffRole.SUPER_ADMIN },
  });

  const destinationIds = new Map<string, string>();
  for (const destination of destinations) {
    const existing = await prisma.destination.findUnique({
      where: { slug: destination.slug },
      select: { id: true },
    });
    const record =
      existing ??
      (await prisma.destination.create({
        data: {
          slug: destination.slug,
          name: destination.name,
          country: destination.name,
          summary: destination.description,
          heroImage: destination.image,
          heroImageAlt: destination.imageAlt,
          isPublished: true,
        },
        select: { id: true },
      }));
    destinationIds.set(destination.name, record.id);
  }

  for (const safari of safaris) {
    const existing = await prisma.safari.findUnique({
      where: { slug: safari.slug },
      select: { id: true },
    });
    if (existing) continue;

    const destinationId = destinationIds.get(safari.country);
    if (!destinationId) {
      throw new Error(`Missing destination for starter safari: ${safari.slug}`);
    }

    const record = await prisma.safari.create({
      data: {
        slug: safari.slug,
        title: safari.title,
        summary: safari.summary,
        durationDays: safari.durationDays,
        category: safari.category,
        coverImage: safari.image,
        imageAlt: safari.imageAlt,
        region: safari.region,
        highlights: safari.highlights,
        isPublished: true,
        destinationId,
        images: {
          create: {
            url: safari.image,
            altText: safari.imageAlt,
            position: 0,
          },
        },
      },
      select: { id: true },
    });

    await prisma.itineraryDay.createMany({
      data: safari.itinerary.map((day, index) => ({
        safariId: record.id,
        dayNumber: index + 1,
        title: day.title,
        description: day.description,
        activities: [],
        meals: [],
      })),
    });
  }

  console.info("Starter destinations, journeys and the initial admin account are ready.");
}

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
