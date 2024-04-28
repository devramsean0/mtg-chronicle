/*
  Warnings:

  - You are about to drop the column `image_message_id` on the `CustomCards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CustomCards" DROP COLUMN "image_message_id";

-- CreateTable
CREATE TABLE "CustomCardImage" (
    "id" SERIAL NOT NULL,
    "image_url" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "customCardId" TEXT NOT NULL,

    CONSTRAINT "CustomCardImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomCardImage_message_id_key" ON "CustomCardImage"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomCardImage_customCardId_key" ON "CustomCardImage"("customCardId");

-- AddForeignKey
ALTER TABLE "CustomCardImage" ADD CONSTRAINT "CustomCardImage_customCardId_fkey" FOREIGN KEY ("customCardId") REFERENCES "CustomCards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
