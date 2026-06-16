-- Add security fields to users table
ALTER TABLE "users" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN     "lockedUntil" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN     "resetToken" TEXT;
ALTER TABLE "users" ADD COLUMN     "resetTokenExpiry" TIMESTAMPTZ;

-- Add view count to rooms table
ALTER TABLE "rooms" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "rooms_city_status_idx" ON "rooms" ("city", "status");
CREATE INDEX IF NOT EXISTS "rooms_price_idx" ON "rooms" ("priceDaily", "priceMonthly");
CREATE INDEX IF NOT EXISTS "rooms_status_created_at_idx" ON "rooms" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "rooms_owner_id_idx" ON "rooms" ("ownerId");
