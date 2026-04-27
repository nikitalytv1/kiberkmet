CREATE EXTENSION IF NOT EXISTS postgis;

-- Odstrani staro Json kolono
ALTER TABLE "Parcela" DROP COLUMN "coordinates";

-- Dodaj novo geometry kolono
ALTER TABLE "Parcela" 
ADD COLUMN "coordinates" geometry(Polygon, 4326);

-- Spatial index
CREATE INDEX "Parcela_coordinates_idx" 
ON "Parcela" USING GIST ("coordinates");
