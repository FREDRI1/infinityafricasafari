import { z } from "zod";
import { defaultHomepageContent, type HomepageContent } from "@/data/homepage";
import { prisma } from "@/lib/prisma";

export const homepageContentSchema = z.object({
  excursions: z
    .array(
      z.object({
        title: z.string().trim().min(3).max(120),
        duration: z.string().trim().min(3).max(50),
        description: z.string().trim().min(10).max(500),
        priceUsd: z.number().finite().positive().max(100_000),
        image: z.string().trim().min(1).max(1000),
        imageAlt: z.string().trim().min(5).max(250),
      }),
    )
    .min(1)
    .max(12),
  reviews: z
    .array(
      z.object({
        quote: z.string().trim().min(15).max(1000),
        name: z.string().trim().min(2).max(100),
        country: z.string().trim().min(2).max(100),
        rating: z.number().int().min(1).max(5),
      }),
    )
    .max(12),
});

export async function getHomepageContent(): Promise<HomepageContent> {
  if (!process.env.DATABASE_URL) return defaultHomepageContent;

  const setting = await prisma.websiteSetting.findUnique({
    where: { key: "homepageContent" },
    select: { value: true },
  });
  if (!setting) return defaultHomepageContent;

  return homepageContentSchema.parse(setting.value);
}
