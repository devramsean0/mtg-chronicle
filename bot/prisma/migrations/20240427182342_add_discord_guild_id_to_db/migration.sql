/*
  Warnings:

  - Added the required column `discord_id` to the `Guild` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomCards" ALTER COLUMN "power" DROP NOT NULL,
ALTER COLUMN "toughness" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "discord_id" TEXT NOT NULL;
