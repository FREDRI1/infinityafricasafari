CREATE TABLE "SafariSeasonPrice" (
    "id" TEXT NOT NULL,
    "safariId" TEXT NOT NULL,
    "seasonName" TEXT NOT NULL,
    "startMonth" INTEGER NOT NULL,
    "startDay" INTEGER NOT NULL,
    "endMonth" INTEGER NOT NULL,
    "endDay" INTEGER NOT NULL,
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isEstimate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SafariSeasonPrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SafariSeasonPrice_safariId_seasonName_key"
ON "SafariSeasonPrice"("safariId", "seasonName");

CREATE INDEX "SafariSeasonPrice_safariId_startMonth_startDay_idx"
ON "SafariSeasonPrice"("safariId", "startMonth", "startDay");

ALTER TABLE "SafariSeasonPrice"
ADD CONSTRAINT "SafariSeasonPrice_safariId_fkey"
FOREIGN KEY ("safariId") REFERENCES "Safari"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SafariSeasonPrice" (
    "id", "safariId", "seasonName", "startMonth", "startDay",
    "endMonth", "endDay", "pricePerPerson", "currency", "isEstimate", "updatedAt"
)
SELECT
    'estimate-' || safari."id" || '-' || lower(replace(rate."seasonName", ' ', '-')),
    safari."id",
    rate."seasonName",
    rate."startMonth",
    rate."startDay",
    rate."endMonth",
    rate."endDay",
    rate."pricePerPerson",
    'USD',
    true,
    CURRENT_TIMESTAMP
FROM "Safari" AS safari
JOIN (
    VALUES
        ('maasai-mara-safari', 'Green season', 11, 1, 5, 31, 1800.00::DECIMAL(10,2)),
        ('maasai-mara-safari', 'Peak season', 6, 1, 10, 31, 2500.00::DECIMAL(10,2)),
        ('tanzania-wilderness', 'Green season', 11, 1, 5, 31, 3200.00::DECIMAL(10,2)),
        ('tanzania-wilderness', 'Peak season', 6, 1, 10, 31, 4500.00::DECIMAL(10,2)),
        ('kenya-wildlife-journey', 'Green season', 11, 1, 5, 31, 2300.00::DECIMAL(10,2)),
        ('kenya-wildlife-journey', 'Peak season', 6, 1, 10, 31, 3100.00::DECIMAL(10,2)),
        ('wildlife-conservation-journey', 'Green season', 11, 1, 5, 31, 1450.00::DECIMAL(10,2)),
        ('wildlife-conservation-journey', 'Peak season', 6, 1, 10, 31, 1950.00::DECIMAL(10,2)),
        ('uganda-wild-places', 'Green season', 11, 1, 5, 31, 2800.00::DECIMAL(10,2)),
        ('uganda-wild-places', 'Peak season', 6, 1, 10, 31, 3900.00::DECIMAL(10,2)),
        ('rwanda-wildlife-journey', 'Green season', 11, 1, 5, 31, 2600.00::DECIMAL(10,2)),
        ('rwanda-wildlife-journey', 'Peak season', 6, 1, 10, 31, 3600.00::DECIMAL(10,2))
) AS rate("slug", "seasonName", "startMonth", "startDay", "endMonth", "endDay", "pricePerPerson")
ON safari."slug" = rate."slug";
