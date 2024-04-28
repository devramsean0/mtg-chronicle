/*
  Warnings:

  - You are about to drop the column `image_url` on the `CustomCardImage` table. All the data in the column will be lost.
  - Added the required column `original_image_url` to the `CustomCardImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomCardImage" DROP COLUMN "image_url",
ADD COLUMN     "original_image_url" TEXT NOT NULL,
ALTER COLUMN "message_id" DROP NOT NULL;
