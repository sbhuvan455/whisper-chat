-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "fullName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "muted" BOOLEAN NOT NULL DEFAULT false;
