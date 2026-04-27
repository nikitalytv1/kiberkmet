/*
  Warnings:

  - Made the column `coordinates` on table `Parcela` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Parcela_coordinates_idx";

-- AlterTable
ALTER TABLE "Parcela" ALTER COLUMN "coordinates" SET NOT NULL;
