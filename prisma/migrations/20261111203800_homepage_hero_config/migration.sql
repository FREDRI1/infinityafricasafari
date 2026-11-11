CREATE TYPE "HeroMode" AS ENUM ('SINGLE_IMAGE', 'ANIMATED_SLIDESHOW', 'VIDEO');

CREATE TABLE "HeroConfig" (
    "id" TEXT NOT NULL DEFAULT 'homepage',
    "mode" "HeroMode" NOT NULL DEFAULT 'SINGLE_IMAGE',
    "videoUrl" TEXT,
    "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "headingText" TEXT NOT NULL DEFAULT 'Africa is not just a place. It stays with you.',
    "subheadingText" TEXT NOT NULL DEFAULT 'Thoughtful journeys, shaped around the way you want to experience the wild.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HeroConfig_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HeroConfig_singleton_check" CHECK ("id" = 'homepage')
);

INSERT INTO "HeroConfig" ("id", "mode", "imageUrls", "headingText", "subheadingText", "updatedAt")
VALUES (
    'homepage',
    'SINGLE_IMAGE',
    ARRAY['/assets/images/hero/savannah-dawn.jpg']::TEXT[],
    'Africa is not just a place. It stays with you.',
    'Thoughtful journeys, shaped around the way you want to experience the wild.',
    CURRENT_TIMESTAMP
);
