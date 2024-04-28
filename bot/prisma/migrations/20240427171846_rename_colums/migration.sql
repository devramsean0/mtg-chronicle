/*
  Warnings:

  - You are about to drop the column `cost` on the `CustomCards` table. All the data in the column will be lost.
  - You are about to drop the column `subtypes` on the `CustomCards` table. All the data in the column will be lost.
  - You are about to drop the column `supertypes` on the `CustomCards` table. All the data in the column will be lost.
  - You are about to drop the column `types` on the `CustomCards` table. All the data in the column will be lost.
  - Added the required column `image_message_id` to the `CustomCards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_line` to the `CustomCards` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `CustomCards` required. This step will fail if there are existing NULL values in that column.
  - Made the column `power` on table `CustomCards` required. This step will fail if there are existing NULL values in that column.
  - Made the column `toughness` on table `CustomCards` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CustomCards" DROP COLUMN "cost",
DROP COLUMN "subtypes",
DROP COLUMN "supertypes",
DROP COLUMN "types",
ADD COLUMN     "image_message_id" TEXT NOT NULL,
ADD COLUMN     "mana_cost" TEXT,
ADD COLUMN     "type_line" TEXT NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "power" SET NOT NULL,
ALTER COLUMN "toughness" SET NOT NULL,
ALTER COLUMN "artist" DROP NOT NULL,
ALTER COLUMN "setName" DROP NOT NULL;
