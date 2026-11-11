"use server";

import { Prisma, StaffRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminMediaSource } from "@/lib/admin-media";
import { requireStaff } from "@/lib/admin";
import { homepageContentSchema } from "@/lib/homepage-content";
import { prisma } from "@/lib/prisma";

const contentRoles = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.CONTENT_EDITOR,
];

export async function saveHomepageContent(formData: FormData) {
  const staff = await requireStaff(contentRoles);
  const rawContent = formData.get("homepageContent");
  if (typeof rawContent !== "string") {
    throw new Error("Homepage content is missing. Review the form and try again.");
  }

  let content: unknown;
  try {
    content = JSON.parse(rawContent);
  } catch {
    throw new Error("Homepage content could not be read. Review the form and try again.");
  }

  const parsed = homepageContentSchema.safeParse(content);
  if (!parsed.success) {
    throw new Error(
      `Homepage content is invalid: ${parsed.error.issues[0]?.message ?? "check the form."}`,
    );
  }

  const selectedImages = parsed.data.excursions.map((excursion) => excursion.image);
  if (!(await Promise.all(selectedImages.map(isAdminMediaSource))).every(Boolean)) {
    throw new Error("Choose excursion images from the media library.");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.websiteSetting.upsert({
      where: { key: "homepageContent" },
      update: { value: parsed.data },
      create: { key: "homepageContent", value: parsed.data },
    });
    await transaction.auditLog.create({
      data: {
        actorId: staff.id,
        action: "HOMEPAGE_CONTENT_UPDATED",
        entityType: "WebsiteSetting",
        entityId: "homepageContent",
        details: {
          excursionCount: parsed.data.excursions.length,
          reviewCount: parsed.data.reviews.length,
        } satisfies Prisma.InputJsonObject,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/admin/content");
  redirect("/admin/content?saved=1");
}
