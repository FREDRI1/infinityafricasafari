import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const operationalSettingsSchema = z.object({
  bookingRequestsEnabled: z.boolean(),
  notificationEmail: z.union([z.literal(""), z.string().email().max(254)]),
});

export type OperationalSettings = z.infer<typeof operationalSettingsSchema>;

export const defaultOperationalSettings: OperationalSettings = {
  bookingRequestsEnabled: true,
  notificationEmail: "",
};

export async function getOperationalSettings(): Promise<OperationalSettings> {
  const setting = await prisma.websiteSetting.findUnique({
    where: { key: "operationalSettings" },
    select: { value: true },
  });
  if (!setting) return defaultOperationalSettings;

  const parsed = operationalSettingsSchema.safeParse(setting.value);
  if (!parsed.success) {
    console.error("Stored operational settings are invalid.", parsed.error);
    throw new Error("Operational settings could not be loaded.");
  }
  return parsed.data;
}
