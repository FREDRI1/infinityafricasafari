import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const brandSettingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(120),
  logo: z.string().trim().max(1000),
  icon: z.string().trim().max(1000),
});

export type BrandSettings = z.infer<typeof brandSettingsSchema>;

export const defaultBrandSettings: BrandSettings = {
  name: "Infinity Africa Safari",
  tagline: "Journeys shaped around you",
  logo: "",
  icon: "",
};

export async function getBrandSettings(): Promise<BrandSettings> {
  if (!process.env.DATABASE_URL) return defaultBrandSettings;

  const setting = await prisma.websiteSetting.findUnique({
    where: { key: "brandSettings" },
    select: { value: true },
  });
  if (!setting) return defaultBrandSettings;

  const parsed = brandSettingsSchema.safeParse(setting.value);
  if (!parsed.success) {
    console.error("Stored website brand settings are invalid.", parsed.error);
    throw new Error("Website brand settings could not be loaded.");
  }
  return parsed.data;
}
