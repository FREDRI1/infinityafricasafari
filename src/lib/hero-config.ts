import { HeroMode } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type HeroConfigContent = {
  mode: HeroMode;
  videoUrl: string | null;
  imageUrls: string[];
  headingText: string;
  subheadingText: string;
};

export const DEFAULT_HERO_CONFIG: HeroConfigContent = {
  mode: HeroMode.SINGLE_IMAGE,
  videoUrl: null,
  imageUrls: ["/assets/images/hero/savannah-dawn.jpg"],
  headingText: "Africa is not just a place. It stays with you.",
  subheadingText:
    "Thoughtful journeys, shaped around the way you want to experience the wild.",
};

const localAssetPattern =
  /^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp|gif)$/i;

export function isLocalHeroImagePath(value: string) {
  return (
    localAssetPattern.test(value) &&
    !value.split("/").some((part) => part === "." || part === "..")
  );
}

export function isHeroImageSource(value: string) {
  if (isLocalHeroImagePath(value)) return true;
  return (
    /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.(?:jpe?g|png|webp|gif)$/i.test(
      value,
    )
  );
}

export function normalizeHeroVideoPath(value: string) {
  const path = value.trim();
  if (
    !/^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.mp4$/i.test(path) ||
    path.split("/").some((part) => part === "." || part === "..")
  ) {
    return null;
  }
  return path;
}

export const heroConfigInputSchema = z
  .object({
    mode: z.nativeEnum(HeroMode),
    imageUrls: z.array(z.string().trim().min(1).max(1000)).max(8),
    videoUrl: z.string().trim().max(1000),
    headingText: z.string().trim().min(3).max(120),
    subheadingText: z.string().trim().min(10).max(300),
  })
  .superRefine((config, context) => {
    if (new Set(config.imageUrls).size !== config.imageUrls.length) {
      context.addIssue({
        code: "custom",
        path: ["imageUrls"],
        message: "Each hero image can only be selected once.",
      });
    }
    if (config.mode === HeroMode.SINGLE_IMAGE && config.imageUrls.length !== 1) {
      context.addIssue({
        code: "custom",
        path: ["imageUrls"],
        message: "Choose exactly one image for Single Image mode.",
      });
    }
    if (
      config.mode === HeroMode.ANIMATED_SLIDESHOW &&
      config.imageUrls.length < 2
    ) {
      context.addIssue({
        code: "custom",
        path: ["imageUrls"],
        message: "Choose at least two images for Animated Slideshow mode.",
      });
    }
    if (config.mode === HeroMode.VIDEO) {
      if (!normalizeHeroVideoPath(config.videoUrl)) {
        context.addIssue({
          code: "custom",
          path: ["videoUrl"],
          message: "Enter a local MP4 path under /assets/.",
        });
      }
      if (config.imageUrls.length !== 0) {
        context.addIssue({
          code: "custom",
          path: ["imageUrls"],
          message: "Video mode does not use hero images.",
        });
      }
    } else if (config.videoUrl) {
      context.addIssue({
        code: "custom",
        path: ["videoUrl"],
        message: "A video path is only allowed in Video mode.",
      });
    }
    if (config.mode !== HeroMode.VIDEO && config.imageUrls.some((url) => !isHeroImageSource(url))) {
      context.addIssue({
        code: "custom",
        path: ["imageUrls"],
        message: "Choose image paths from the media library.",
      });
    }
  });

export async function getHeroConfig(): Promise<HeroConfigContent> {
  if (!process.env.DATABASE_URL) return DEFAULT_HERO_CONFIG;

  const config = await prisma.heroConfig.findUnique({
    where: { id: "homepage" },
    select: {
      mode: true,
      videoUrl: true,
      imageUrls: true,
      headingText: true,
      subheadingText: true,
    },
  });
  if (!config) return DEFAULT_HERO_CONFIG;

  const parsed = heroConfigInputSchema.safeParse({
    mode: config.mode,
    videoUrl: config.videoUrl ?? "",
    imageUrls: config.imageUrls,
    headingText: config.headingText,
    subheadingText: config.subheadingText,
  });
  if (!parsed.success) {
    console.error("Stored homepage hero configuration is invalid.", parsed.error);
    throw new Error("Homepage hero content could not be loaded.");
  }

  return {
    mode: parsed.data.mode,
    videoUrl: parsed.data.videoUrl || null,
    imageUrls: parsed.data.imageUrls,
    headingText: parsed.data.headingText,
    subheadingText: parsed.data.subheadingText,
  };
}
