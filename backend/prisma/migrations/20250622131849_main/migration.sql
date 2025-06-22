-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "reference" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text',
ALTER COLUMN "message" DROP NOT NULL;
