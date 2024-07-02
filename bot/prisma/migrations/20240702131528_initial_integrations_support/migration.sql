-- DropForeignKey
ALTER TABLE "CustomCards" DROP CONSTRAINT "CustomCards_customCardImageId_fkey";

-- AlterTable
ALTER TABLE "CustomCards" ADD COLUMN     "imageUrl" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "customCardImageId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "GuildIntegration" (
    "id" TEXT NOT NULL,
    "auth_token" TEXT NOT NULL,
    "Integration" TEXT NOT NULL,
    "guildId" TEXT,

    CONSTRAINT "GuildIntegration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomCards" ADD CONSTRAINT "CustomCards_customCardImageId_fkey" FOREIGN KEY ("customCardImageId") REFERENCES "CustomCardImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildIntegration" ADD CONSTRAINT "GuildIntegration_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;
