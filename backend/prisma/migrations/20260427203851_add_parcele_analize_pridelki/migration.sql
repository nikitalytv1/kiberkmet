/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "Post";

-- CreateTable
CREATE TABLE "Parcela" (
    "id" TEXT NOT NULL,
    "gerk_pid" BIGINT NOT NULL,
    "typeOfUse" VARCHAR(100) NOT NULL,
    "coordinates" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Parcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analiza" (
    "id" TEXT NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "physicalSoil" JSONB,
    "soilClassification" JSONB,
    "derivedProperties" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parcelaId" TEXT NOT NULL,

    CONSTRAINT "Analiza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pridelek" (
    "id" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "leto" INTEGER NOT NULL,
    "povrsina" DOUBLE PRECISION,
    "kolicina" DOUBLE PRECISION,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parcelaId" TEXT NOT NULL,

    CONSTRAINT "Pridelek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_gerk_pid_key" ON "Parcela"("gerk_pid");

-- AddForeignKey
ALTER TABLE "Parcela" ADD CONSTRAINT "Parcela_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analiza" ADD CONSTRAINT "Analiza_parcelaId_fkey" FOREIGN KEY ("parcelaId") REFERENCES "Parcela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pridelek" ADD CONSTRAINT "Pridelek_parcelaId_fkey" FOREIGN KEY ("parcelaId") REFERENCES "Parcela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
