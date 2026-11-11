"use server";

import { Prisma, StaffRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { operationalSettingsSchema } from "@/lib/operational-settings";
import { prisma } from "@/lib/prisma";

export async function saveOperationalSettings(formData: FormData) {
  const staff = await requireStaff([StaffRole.SUPER_ADMIN, StaffRole.ADMIN]);
  const bookingRequestsEnabled = formData.get("bookingRequestsEnabled");
  if (bookingRequestsEnabled !== "true" && bookingRequestsEnabled !== "false") {
    throw new Error("Choose whether new booking requests are open or paused.");
  }
  const parsed = operationalSettingsSchema.safeParse({
    bookingRequestsEnabled: bookingRequestsEnabled === "true",
    notificationEmail:
      typeof formData.get("notificationEmail") === "string"
        ? formData.get("notificationEmail")
        : "",
  });
  if (!parsed.success) {
    throw new Error(
      `Settings are invalid: ${parsed.error.issues[0]?.message ?? "check the form."}`,
    );
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.websiteSetting.upsert({
      where: { key: "operationalSettings" },
      update: { value: parsed.data },
      create: { key: "operationalSettings", value: parsed.data },
    });
    await transaction.auditLog.create({
      data: {
        actorId: staff.id,
        action: "OPERATIONAL_SETTINGS_UPDATED",
        entityType: "WebsiteSetting",
        entityId: "operationalSettings",
        details: {
          bookingRequestsEnabled: parsed.data.bookingRequestsEnabled,
          hasNotificationEmail: parsed.data.notificationEmail.length > 0,
        } satisfies Prisma.InputJsonObject,
      },
    });
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  redirect("/admin/settings?saved=1");
}
