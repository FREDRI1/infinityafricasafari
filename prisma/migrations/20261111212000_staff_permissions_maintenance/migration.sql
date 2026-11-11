CREATE TYPE "StaffPermission" AS ENUM (
    'BOOKING_OPERATIONS',
    'CATALOG_MANAGEMENT',
    'WEBSITE_CONTENT',
    'MEDIA_LIBRARY',
    'SYSTEM_SETTINGS',
    'ANALYTICS'
);

ALTER TABLE "User"
ADD COLUMN "permissions" "StaffPermission"[] NOT NULL DEFAULT ARRAY[]::"StaffPermission"[];
