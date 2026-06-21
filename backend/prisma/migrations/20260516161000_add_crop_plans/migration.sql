CREATE TABLE IF NOT EXISTS "CropPlan" (
  "id" TEXT NOT NULL,
  "cropName" VARCHAR(100) NOT NULL,
  "areaPercent" DOUBLE PRECISION NOT NULL,
  "plantingDate" TIMESTAMP(3),
  "harvestDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "parcelaId" TEXT NOT NULL,
  CONSTRAINT "CropPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CropPlan_areaPercent_range" CHECK ("areaPercent" >= 0 AND "areaPercent" <= 100)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CropPlan_parcelaId_fkey'
  ) THEN
    ALTER TABLE "CropPlan"
      ADD CONSTRAINT "CropPlan_parcelaId_fkey"
      FOREIGN KEY ("parcelaId") REFERENCES "Parcela"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
