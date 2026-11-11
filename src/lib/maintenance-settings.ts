import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const maintenanceSettingsSchema = z.object({
  enabled: z.boolean(),
  backgroundImage: z.string().trim().min(1).max(1000),
  heading: z.string().trim().min(3).max(100),
  message: z.string().trim().min(10).max(500),
});

export type MaintenanceSettings = z.infer<typeof maintenanceSettingsSchema>;

export const defaultMaintenanceSettings: MaintenanceSettings = {
  enabled: false,
  backgroundImage: "/assets/images/hero/savannah-dawn.jpg",
  heading: "We’ll be back soon",
  message:
    "Infinity Africa Safari is receiving a few thoughtful updates. Please check back shortly.",
};

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  if (!process.env.DATABASE_URL) return defaultMaintenanceSettings;

  const setting = await prisma.websiteSetting.findUnique({
    where: { key: "marketplaceMaintenance" },
    select: { value: true },
  });
  if (!setting) return defaultMaintenanceSettings;

  const parsed = maintenanceSettingsSchema.safeParse(setting.value);
  if (!parsed.success) {
    console.error("Stored marketplace maintenance settings are invalid.", parsed.error);
    throw new Error("Marketplace maintenance settings could not be loaded.");
  }
  return parsed.data;
}
