import { prisma } from "../index.js";
import {
  STATISTICAL_REGIONS,
  getSloveniaNuts3Geojson,
  isValidRegionCode,
  fetchRegionalYields,
  getYieldStatsForParcela,
} from "../services/region.service.js";

export function getRegions(_req, res) {
  res.json(STATISTICAL_REGIONS);
}

export async function getParceleByRegion(req, res) {
  const regionCode = String(req.params.regionCode).padStart(2, "0");
  const userId = req.user.userId;

  if (!isValidRegionCode(regionCode)) {
    return res.status(400).json({ error: "Invalid statistical region code" });
  }

  try {
    const nutsGeojson = JSON.stringify(await getSloveniaNuts3Geojson());
    let yieldsByCropCode = {};

    try {
      yieldsByCropCode = await fetchRegionalYields(regionCode);
    } catch (err) {
      console.warn("SURS yield fetch failed:", err.message);
    }

    const parcele = await prisma.$queryRaw`
      WITH nuts AS (
        SELECT
          feature.data->'properties'->>'regionCode' AS "regionCode",
          ST_SetSRID(ST_MakeValid(ST_GeomFromGeoJSON((feature.data->'geometry')::text)), 4326) AS geom
        FROM jsonb_array_elements(CAST(${nutsGeojson} AS jsonb)->'features') AS feature(data)
        WHERE feature.data->'properties'->>'regionCode' = ${regionCode}
      )
      SELECT
        p.id,
        p.name,
        p.color,
        p.gerk_pid::text,
        p."typeOfUse",
        ST_AsGeoJSON(p.coordinates)::json AS coordinates,
        ST_Area(p.coordinates::geography) / 10000 AS "areaHectares",
        p."createdAt",
        p."updatedAt",
        p."userId",
        (
          SELECT json_build_object(
            'id', a.id, 'lon', a.lon, 'lat', a.lat,
            'physicalSoil', a."physicalSoil",
            'chemicalProperties', a."chemicalProperties",
            'soilClassification', a."soilClassification",
            'derivedProperties', a."derivedProperties",
            'fetchedAt', a."fetchedAt"
          )
          FROM "Analiza" a
          WHERE a."parcelaId" = p.id
          ORDER BY a."fetchedAt" DESC
          LIMIT 1
        ) AS analysis
      FROM "Parcela" p
      CROSS JOIN nuts
      WHERE p."userId" = ${userId}
        AND ST_Intersects(nuts.geom, ST_PointOnSurface(p.coordinates))
      ORDER BY p."createdAt" DESC
    `;

    return res.json({
      region: STATISTICAL_REGIONS.find((r) => r.code === regionCode),
      yieldStats: Object.values(yieldsByCropCode),
      parcele: parcele.map((parcela) => ({
        ...parcela,
        sursYieldStats: getYieldStatsForParcela(parcela, yieldsByCropCode),
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
