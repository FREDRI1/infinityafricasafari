CREATE TABLE "MarketplaceClick" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "elementClicked" VARCHAR(160) NOT NULL,
    "targetUrl" VARCHAR(2048) NOT NULL,
    "country" VARCHAR(2) NOT NULL,
    CONSTRAINT "MarketplaceClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceClick_timestamp_idx"
ON "MarketplaceClick"("timestamp");
