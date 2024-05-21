/*
  Warnings:

  - You are about to drop the column `customCardId` on the `CustomCardImage` table. All the data in the column will be lost.
  - Added the required column `customCardImageId` to the `CustomCards` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CustomCardImage" DROP CONSTRAINT "CustomCardImage_customCardId_fkey";

-- DropIndex
DROP INDEX "CustomCardImage_customCardId_key";

-- AlterTable
ALTER TABLE "CustomCardImage" DROP COLUMN "customCardId";

-- AlterTable
ALTER TABLE "CustomCards" ADD COLUMN     "customCardImageId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "CustomCards" ADD CONSTRAINT "CustomCards_customCardImageId_fkey" FOREIGN KEY ("customCardImageId") REFERENCES "CustomCardImage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
