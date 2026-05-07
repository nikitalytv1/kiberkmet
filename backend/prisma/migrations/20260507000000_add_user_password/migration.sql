-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

-- Remove the default after adding the column (existing rows get empty string)
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;
