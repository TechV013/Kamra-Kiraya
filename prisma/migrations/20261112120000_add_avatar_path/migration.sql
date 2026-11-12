-- Store the Supabase storage path for avatars so signed URLs can be
-- regenerated on demand instead of expiring after 1 hour.
ALTER TABLE "users" ADD COLUMN "avatarPath" TEXT;

-- Best-effort backfill for avatars previously stored as signed URLs, e.g.
-- https://<ref>.supabase.co/storage/v1/object/sign/<bucket>/avatars/<id>.jpg?token=...
-- The stored path must be relative to the bucket, so the bucket segment is stripped.
UPDATE "users"
SET "avatarPath" = regexp_replace(
  split_part(split_part("avatar", '/object/sign/', 2), '?', 1),
  '^[^/]+/',
  ''
)
WHERE "avatar" LIKE '%/object/sign/%'
  AND split_part(split_part("avatar", '/object/sign/', 2), '?', 1) <> '';
