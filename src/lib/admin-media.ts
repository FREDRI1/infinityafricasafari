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
  mediaType: "image" | "video";
};

export async function getAdminMediaChoices({
  mediaType = "image",
}: {
  mediaType?: "image" | "video";
} = {}): Promise<AdminMediaChoice[]> {
  const uploadedMedia = process.env.DATABASE_URL
    ? await prisma.media.findMany({
        where:
          mediaType === "video"
            ? { mimeType: "video/mp4" }
            : { mimeType: { startsWith: "image/" } },
        orderBy: { createdAt: "desc" },
        select: {
          url: true,
          altText: true,
          category: true,
          width: true,
          height: true,
          mimeType: true,
        },
      })
    : [];

  return [
    ...(mediaType === "image" ? localMedia.map((media) => ({
      value: media.src,
      src: media.src,
      alt: media.alt,
      category: media.category,
      width: media.width,
      height: media.height,
      mediaType: "image" as const,
    })) : []),
    ...uploadedMedia.map((media) => ({
      value: media.url,
      src: getPublicMediaUrl(media.url),
      alt: media.altText,
      category: media.category,
      width: media.width ?? 1200,
      height: media.height ?? 800,
      mediaType: media.mimeType.startsWith("video/") ? "video" as const : "image" as const,
    })),
  ];
}

export async function isAdminMediaSource(
  value: string,
  mediaType: "image" | "video" = "image",
) {
  if (mediaType === "video") {
    return Boolean(
      await prisma.media.findFirst({
        where: { url: value, mimeType: "video/mp4" },
        select: { id: true },
      }),
    );
  }
  if (localMedia.some((media) => media.src === value)) return true;
  return Boolean(
    await prisma.media.findFirst({
      where: { url: value, mimeType: { startsWith: "image/" } },
      select: { id: true },
    }),
  );
}
