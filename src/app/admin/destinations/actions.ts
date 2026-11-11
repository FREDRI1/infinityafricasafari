"use server";

import { Prisma, StaffRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { localMedia } from "@/data/media";
import { requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const roles = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.CONTENT_EDITOR,
];

const destinationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  country: z.string().trim().min(2).max(100),
  summary: z.string().trim().min(30).max(1500),
  description: z.string().trim().min(30).max(10000),
  heroImage: z.string().refine(
    (value) => localMedia.some((media) => media.src === value),
    "Choose an image from the local media library.",
  ),
  heroImageAlt: z.string().trim().min(5).max(250),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(200),
  isPublished: z.boolean(),
});

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field : "";
}

function revalidateDestination(slug: string) {
  revalidatePath("/");
  revalidatePath("/safaris");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/destinations/${slug}`);
  revalidatePath("/admin/destinations");
}

export async function saveDestination(formData: FormData) {
  const staff = await requireStaff(roles);
  const id = value(formData, "id");
  const parsed = destinationSchema.safeParse({
    name: value(formData, "name"),
    slug: value(formData, "slug"),
    country: value(formData, "country"),
    summary: value(formData, "summary"),
    description: value(formData, "description"),
    heroImage: value(formData, "heroImage"),
    heroImageAlt: value(formData, "heroImageAlt"),
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
    isPublished: formData.get("isPublished") === "true",
  });
  if (!parsed.success) {
    throw new Error(
      `Destination details are invalid: ${parsed.error.issues[0]?.message ?? "check the form."}`,
    );
  }

  const destination = await prisma.$transaction(async (transaction) => {
    const existing = id
      ? await transaction.destination.findUnique({
          where: { id },
          select: { id: true, slug: true },
        })
      : null;
    if (id && !existing) throw new Error("Destination record was not found.");

    const data = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      country: parsed.data.country,
      summary: parsed.data.summary,
      description: parsed.data.description,
      heroImage: parsed.data.heroImage,
      heroImageAlt: parsed.data.heroImageAlt,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      isPublished: parsed.data.isPublished,
      archivedAt: null,
    };
    const saved = existing
      ? await transaction.destination.update({
          where: { id: existing.id },
          data,
          select: { id: true, slug: true },
        })
      : await transaction.destination.create({
          data,
          select: { id: true, slug: true },
        });

    await transaction.auditLog.create({
      data: {
        actorId: staff.id,
        action: existing ? "DESTINATION_UPDATED" : "DESTINATION_CREATED",
        entityType: "Destination",
        entityId: saved.id,
        details: {
          slug: saved.slug,
          published: parsed.data.isPublished,
        } satisfies Prisma.InputJsonObject,
      },
    });
    return { saved, previousSlug: existing?.slug };
  });

  if (destination.previousSlug) revalidateDestination(destination.previousSlug);
  revalidateDestination(destination.saved.slug);
  redirect("/admin/destinations?saved=1");
}

export async function archiveDestination(
  destinationId: string,
  _formData: FormData,
) {
  void _formData;
  const staff = await requireStaff(roles);
  const destination = await prisma.destination.findUnique({
    where: { id: destinationId },
    select: { id: true, slug: true },
  });
  if (!destination) throw new Error("Destination record was not found.");

  await prisma.$transaction(async (transaction) => {
    await transaction.destination.update({
      where: { id: destination.id },
      data: { isPublished: false, archivedAt: new Date() },
    });
    await transaction.safari.updateMany({
      where: { destinationId: destination.id },
      data: { isPublished: false },
    });
    await transaction.auditLog.create({
      data: {
        actorId: staff.id,
        action: "DESTINATION_ARCHIVED",
        entityType: "Destination",
        entityId: destination.id,
        details: { slug: destination.slug },
      },
    });
  });
  revalidateDestination(destination.slug);
  redirect("/admin/destinations?archived=1");
}
