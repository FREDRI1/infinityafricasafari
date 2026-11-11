import { localMedia } from "@/data/media";
import { getPublicMediaUrl } from "@/lib/media-storage";
import { prisma } from "@/lib/prisma";

export type AdminMediaChoice = {
  value: string;
  src: string;
  alt: string;
  category: string;
  width: number;
  height: number;
};

export async function getAdminMediaChoices(): Promise<AdminMediaChoice[]> {
  const uploadedMedia = process.env.DATABASE_URL
    ? await prisma.media.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          url: true,
          altText: true,
          category: true,
          width: true,
          height: true,
        },
      })
    : [];

  return [
    ...localMedia.map((media) => ({
      value: media.src,
      src: media.src,
      alt: media.alt,
      category: media.category,
      width: media.width,
      height: media.height,
    })),
    ...uploadedMedia.map((media) => ({
      value: media.url,
      src: getPublicMediaUrl(media.url),
      alt: media.altText,
      category: media.category,
      width: media.width ?? 1200,
      height: media.height ?? 800,
    })),
  ];
}

export async function isAdminMediaSource(value: string) {
  if (localMedia.some((media) => media.src === value)) return true;
  return Boolean(
    await prisma.media.findFirst({
      where: { url: value },
      select: { id: true },
    }),
  );
}
