ALTER TABLE "Parcela" ADD COLUMN IF NOT EXISTS "plannedCropName" VARCHAR(100);
ALTER TABLE "Parcela" ADD COLUMN IF NOT EXISTS "plannedCropPercent" DOUBLE PRECISION;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Parcela_plannedCropPercent_range'
  ) THEN
    ALTER TABLE "Parcela"
      ADD CONSTRAINT "Parcela_plannedCropPercent_range"
      CHECK ("plannedCropPercent" IS NULL OR ("plannedCropPercent" >= 0 AND "plannedCropPercent" <= 100));
  END IF;
END $$;
