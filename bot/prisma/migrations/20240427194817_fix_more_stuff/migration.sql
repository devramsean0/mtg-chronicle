-- DropForeignKey
ALTER TABLE "CustomCardImage" DROP CONSTRAINT "CustomCardImage_customCardId_fkey";

-- AlterTable
ALTER TABLE "CustomCardImage" ALTER COLUMN "customCardId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CustomCardImage" ADD CONSTRAINT "CustomCardImage_customCardId_fkey" FOREIGN KEY ("customCardId") REFERENCES "CustomCards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
