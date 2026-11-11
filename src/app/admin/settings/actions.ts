"use server";

import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { Prisma, StaffPermission, StaffRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  heroConfigInputSchema,
  isUploadedHeroVideoKey,
  normalizeHeroVideoPath,
  normalizeHeroVideoSource,
} from "@/lib/hero-config";
import { requireStaffPermission } from "@/lib/admin";
import { operationalSettingsSchema } from "@/lib/operational-settings";
import { maintenanceSettingsSchema } from "@/lib/maintenance-settings";
import { prisma } from "@/lib/prisma";
import { isAdminMediaSource } from "@/lib/admin-media";

export async function saveOperationalSettings(formData: FormData) {
  const staff = await requireStaffPermission(
    [StaffRole.SUPER_ADMIN, StaffRole.ADMIN],
    StaffPermission.SYSTEM_SETTINGS,
  );
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

export async function saveMaintenanceSettings(formData: FormData) {
  const staff = await requireStaffPermission(
    [StaffRole.SUPER_ADMIN, StaffRole.ADMIN],
    StaffPermission.SYSTEM_SETTINGS,
  );
  const enabled = formData.get("enabled");
  if (enabled !== "true" && enabled !== "false") {
    throw new Error("Choose whether the marketplace should be open or in maintenance.");
  }
  const parsed = maintenanceSettingsSchema.safeParse({
    enabled: enabled === "true",
    backgroundImage: formData.get("backgroundImage"),
    heading: formData.get("heading"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    throw new Error(
      `Maintenance settings are invalid: ${parsed.error.issues[0]?.message ?? "check the form."}`,
    );
  }
  if (!(await isAdminMediaSource(parsed.data.backgroundImage))) {
    throw new Error("Choose a maintenance background image from the media library.");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.websiteSetting.upsert({
      where: { key: "marketplaceMaintenance" },
      update: { value: parsed.data },
      create: { key: "marketplaceMaintenance", value: parsed.data },
    });
    await transaction.auditLog.create({
      data: {
        actorId: staff.id,
        action: "MARKETPLACE_MAINTENANCE_UPDATED",
        entityType: "WebsiteSetting",
        entityId: "marketplaceMaintenance",
        details: {
          enabled: parsed.data.enabled,
          backgroundImage: parsed.data.backgroundImage,
        } satisfies Prisma.InputJsonObject,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?maintenanceSaved=1");
}

export async function saveHeroConfig(formData: FormData) {
  const staff = await requireStaffPermission(
    [StaffRole.SUPER_ADMIN, StaffRole.ADMIN],
    StaffPermission.SYSTEM_SETTINGS,
  );
  const rawImages = formData.get("imageUrls");
  let imageUrls: unknown;
  try {
    imageUrls = JSON.parse(typeof rawImages === "string" ? rawImages : "");
  } catch {
    throw new Error("The selected hero images could not be read. Please choose them again.");
  }

  const parsed = heroConfigInputSchema.safeParse({
    mode: formData.get("mode"),
    imageUrls,
    videoUrl: formData.get("videoUrl") ?? "",
    headingText: formData.get("headingText") ?? "",
    subheadingText: formData.get("subheadingText") ?? "",
  });
  if (!parsed.success) {
    throw new Error(
      `Homepage hero settings are invalid: ${parsed.error.issues[0]?.message ?? "check the form."}`,
    );
  }

  if (parsed.data.mode === "VIDEO") {
    const videoSource = normalizeHeroVideoSource(parsed.data.videoUrl);
    if (!videoSource) throw new Error("Choose an uploaded MP4 video from the media library.");
    if (normalizeHeroVideoPath(videoSource)) {
      const publicRoot = path.resolve(process.cwd(), "public");
      const absolutePath = path.resolve(publicRoot, `.${videoSource}`);
      const relativePath = path.relative(publicRoot, absolutePath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw new Error("The video path must stay inside the public assets directory.");
      }
      try {
        const actualPublicRoot = await realpath(publicRoot);
        const actualPath = await realpath(absolutePath);
        const actualRelativePath = path.relative(actualPublicRoot, actualPath);
        if (
          actualRelativePath.startsWith("..") ||
          path.isAbsolute(actualRelativePath)
        ) {
          throw new Error("The video path must resolve inside the public assets directory.");
        }
        const file = await stat(actualPath);
        if (!file.isFile()) throw new Error("The selected video asset is not a file.");
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
          throw new Error("The video asset was not found. Add the MP4 to public first.");
        }
        throw error;
      }
    } else if (
      !isUploadedHeroVideoKey(videoSource) ||
      !(await isAdminMediaSource(videoSource, "video"))
    ) {
      throw new Error("The selected MP4 is no longer available in the media library.");
    }
  } else {
    const validImages = await Promise.all(
      parsed.data.imageUrls.map((image) => isAdminMediaSource(image)),
    );
    if (validImages.some((valid) => !valid)) {
      throw new Error("One or more selected images are no longer in the media library.");
    }
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.heroConfig.upsert({
      where: { id: "homepage" },
      update: {
        mode: parsed.data.mode,
        videoUrl: parsed.data.mode === "VIDEO" ? parsed.data.videoUrl : null,
        imageUrls: parsed.data.imageUrls,
        headingText: parsed.data.headingText,
        subheadingText: parsed.data.subheadingText,
      },
      create: {
        id: "homepage",
        mode: parsed.data.mode,
        videoUrl: parsed.data.mode === "VIDEO" ? parsed.data.videoUrl : null,
        imageUrls: parsed.data.imageUrls,
        headingText: parsed.data.headingText,
        subheadingText: parsed.data.subheadingText,
      },
    });
    await transaction.auditLog.create({
      data: {
        actorId: staff.id,
        action: "HOMEPAGE_HERO_UPDATED",
        entityType: "HeroConfig",
        entityId: "homepage",
        details: {
          mode: parsed.data.mode,
          imageCount: parsed.data.imageUrls.length,
        } satisfies Prisma.InputJsonObject,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?heroSaved=1");
}
