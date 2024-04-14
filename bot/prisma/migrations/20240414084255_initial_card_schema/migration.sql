-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomCards" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "cost" TEXT,
    "power" INTEGER,
    "toughness" INTEGER,
    "supertypes" TEXT[],
    "types" TEXT[],
    "subtypes" TEXT[],
    "collectorNumber" TEXT,
    "rarity" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "setName" TEXT NOT NULL,
    "setCode" TEXT,
    "oracleText" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,

    CONSTRAINT "CustomCards_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomCards" ADD CONSTRAINT "CustomCards_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
