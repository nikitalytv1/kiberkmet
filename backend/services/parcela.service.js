import { prisma } from "../index.js";
import { fetchSoilAnalysis } from "./soil.service.js";
import { createError } from "../utils/errors.js";

export const LAND_USE_TYPES = [
  "Njiva",
  "Travnik",
  "Vinograd",
  "Sadovnjak",
  "Gozd",
  "Vrt",
  "Ostalo",
];

const CROP_GROWING_DAYS = {
  Pšenica: 300,
  Psenica: 300,
  Ječmen: 120,
  Jecmen: 120,
  Koruza: 140,
  Sončnica: 115,
  Soncnica: 115,
  Krompir: 110,
  Fižol: 90,
  Fizol: 90,
  Solata: 55,
  Paradižnik: 90,
  Paradiznik: 90,
  Lucerna: 75,
};

const analysisJobs = new Map();

export function isValidPolygon(coordinates) {
  if (!coordinates || typeof coordinates !== "object") return false;
  return (
    coordinates.type === "Polygon" &&
    Array.isArray(coordinates.coordinates) &&
    Array.isArray(coordinates.coordinates[0]) &&
    coordinates.coordinates[0].length >= 4
  );
}

function toBigIntValue(value) {
  try {
    return BigInt(value);
  } catch {
    throw new Error("gerk_pid must be a valid integer");
  }
}

function normalizePlannedCropName(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.slice(0, 100) : null;
}

function normalizePercent(value, label = "plannedCropPercent") {
  if (value == null || value === "") return null;
  const percent = Number(value);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw createError(`${label} mora biti stevilo med 0 in 100.`, 400);
  }
  return percent;
}

function normalizeCropPlanPercent(value) {
  const percent = normalizePercent(value, "areaPercent");
  if (percent == null || percent <= 0) {
    throw createError("Procent pridelka mora biti vecji od 0.", 400);
  }
  return percent;
}

function normalizeOptionalPositiveNumber(value, label) {
  if (value == null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw createError(`${label} mora biti pozitivno stevilo.`, 400);
  }
  return number;
}

function normalizeDate(value, label) {
  if (value == null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError(`${label} mora biti veljaven datum.`, 400);
  }
  return date;
}

function getTodayDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function estimateHarvestDate(cropName, plantingDate) {
  if (!plantingDate) return null;
  const days = CROP_GROWING_DAYS[cropName] ?? 100;
  const harvest = new Date(plantingDate);
  harvest.setDate(harvest.getDate() + days);
  return harvest;
}

async function assertParcelaOwner(parcelaId, userId) {
  const existing = await prisma.$queryRaw`
    SELECT id FROM "Parcela"
    WHERE id = ${parcelaId} AND "userId" = ${userId}
  `;
  if (!existing[0]) throw createError("Parcela not found", 404);
}

async function assertCropPlanCapacity(parcelaId, areaPercent, excludePlanId = null) {
  const rows = excludePlanId
    ? await prisma.$queryRaw`
        SELECT COALESCE(SUM("areaPercent"), 0) AS total
        FROM "CropPlan"
        WHERE "parcelaId" = ${parcelaId} AND id <> ${excludePlanId}
      `
    : await prisma.$queryRaw`
        SELECT COALESCE(SUM("areaPercent"), 0) AS total
        FROM "CropPlan"
        WHERE "parcelaId" = ${parcelaId}
      `;

  const usedPercent = Number(rows[0]?.total ?? 0);
  if (usedPercent + areaPercent > 100) {
    throw createError(
      `Na parceli je prostih se ${Math.max(0, 100 - usedPercent).toFixed(0)}%.`,
      400,
    );
  }
}

function sourceHasMeanValue(source) {
  const layers = source?.properties?.layers ?? [];
  return layers.some((layer) =>
    (layer.depths ?? []).some((depth) => depth.values?.mean != null),
  );
}

function analysisHasData(soil) {
  return [soil.physical, soil.chemical, soil.derived].some(sourceHasMeanValue);
}

function getAnalysisCandidates(coordinates, lon, lat) {
  const ring = coordinates?.coordinates?.[0] ?? [];
  const vertices = ring.map(([vertexLon, vertexLat]) => ({
    lon: Number(vertexLon),
    lat: Number(vertexLat),
  }));

  const offsets = [
    { lon, lat },
    ...vertices,
    { lon: lon + 0.01, lat },
    { lon: lon - 0.01, lat },
    { lon, lat: lat + 0.01 },
    { lon, lat: lat - 0.01 },
    { lon: lon + 0.02, lat: lat + 0.02 },
    { lon: lon - 0.02, lat: lat - 0.02 },
  ];

  return offsets.filter(
    (point, index, all) =>
      Number.isFinite(point.lon) &&
      Number.isFinite(point.lat) &&
      all.findIndex(
        (other) =>
          Math.abs(other.lon - point.lon) < 0.000001 &&
          Math.abs(other.lat - point.lat) < 0.000001,
      ) === index,
  );
}

async function findOverlappingParcela(geoJson, userId, excludeId = null) {
  const overlapAreaThreshold = 1;

  if (excludeId) {
    return prisma.$queryRaw`
      WITH new_parcela AS (
        SELECT ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326)) AS geom
      )
      SELECT
        p.id,
        p.name,
        ST_Area(ST_Intersection(p.coordinates, new_parcela.geom)::geography) AS "overlapArea"
      FROM "Parcela" p, new_parcela
      WHERE
        p."userId" = ${userId} AND
        p.id <> ${excludeId} AND
        ST_Intersects(p.coordinates, new_parcela.geom) AND
        ST_Area(ST_Intersection(p.coordinates, new_parcela.geom)::geography) > ${overlapAreaThreshold}
      ORDER BY "overlapArea" DESC
      LIMIT 1
    `;
  }

  return prisma.$queryRaw`
    WITH new_parcela AS (
      SELECT ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326)) AS geom
    )
    SELECT
      p.id,
      p.name,
      ST_Area(ST_Intersection(p.coordinates, new_parcela.geom)::geography) AS "overlapArea"
    FROM "Parcela" p, new_parcela
    WHERE
      p."userId" = ${userId} AND
      ST_Intersects(p.coordinates, new_parcela.geom) AND
      ST_Area(ST_Intersection(p.coordinates, new_parcela.geom)::geography) > ${overlapAreaThreshold}
    ORDER BY "overlapArea" DESC
    LIMIT 1
  `;
}

async function assertNoParcelaOverlap(geoJson, userId, excludeId = null) {
  const overlaps = await findOverlappingParcela(geoJson, userId, excludeId);
  if (!overlaps[0]) return;
  throw createError(
    `Parcela se prekriva z obstoječo parcelo "${overlaps[0].name}".`,
    409,
  );
}

// const PARCELA_SELECT_FIELDS = `
//   id,
//   name,
//   color,
//   gerk_pid::text,
//   "typeOfUse",
//   "plannedCropName",
//   "plannedCropPercent",
//   (
//     SELECT COALESCE(json_agg(json_build_object(
//       'id', cp.id,
//       'cropName', cp."cropName",
//       'areaPercent', cp."areaPercent",
//       'plantedAmountKg', cp."plantedAmountKg",
//       'plantingDate', cp."plantingDate",
//       'harvestDate', cp."harvestDate",
//       'createdAt', cp."createdAt",
//       'updatedAt', cp."updatedAt"
//     ) ORDER BY cp."createdAt" DESC), '[]'::json)
//     FROM "CropPlan" cp
//     WHERE cp."parcelaId" = "Parcela".id
//   ) AS "cropPlans",
//   ST_AsGeoJSON(coordinates)::json AS coordinates,
//   ST_Area(coordinates::geography) / 10000 AS "areaHectares",
//   "createdAt",
//   "updatedAt",
//   "userId",
//   (
//     SELECT json_build_object(
//       'id', a.id,
//       'lon', a.lon,
//       'lat', a.lat,
//       'physicalSoil', a."physicalSoil",
//       'chemicalProperties', a."chemicalProperties",
//       'soilClassification', a."soilClassification",
//       'derivedProperties', a."derivedProperties",
//       'fetchedAt', a."fetchedAt"
//     )
//     FROM "Analiza" a
//     WHERE a."parcelaId" = "Parcela".id
//     ORDER BY a."fetchedAt" DESC
//     LIMIT 1
//   ) AS analysis
// `;

async function runParcelaAnalysis(id, userId) {
  const jobKey = `${userId}:${id}`;

  if (analysisJobs.has(jobKey)) {
    return analysisJobs.get(jobKey);
  }

  const job = (async () => {
    const parcela = await prisma.$queryRaw`
      SELECT
        id,
        ST_X(ST_PointOnSurface(coordinates)) AS lon,
        ST_Y(ST_PointOnSurface(coordinates)) AS lat,
        ST_AsGeoJSON(coordinates)::json AS coordinates
      FROM "Parcela"
      WHERE id = ${id} AND "userId" = ${userId}
    `;

    if (!parcela[0]) throw createError("Parcela not found", 404);

    const lon = Number(parcela[0].lon);
    const lat = Number(parcela[0].lat);

    const recent = await prisma.$queryRaw`
      SELECT
        id, lon, lat,
        "physicalSoil", "chemicalProperties",
        "soilClassification", "derivedProperties",
        "fetchedAt", "parcelaId"
      FROM "Analiza"
      WHERE "parcelaId" = ${id} AND "fetchedAt" >= NOW() - INTERVAL '2 minutes'
      ORDER BY "fetchedAt" DESC
      LIMIT 1
    `;

    if (recent[0]) return recent[0];

    const candidates = getAnalysisCandidates(parcela[0].coordinates, lon, lat);
    let soil = null;
    let sourcePoint = { lon, lat };

    for (const candidate of candidates) {
      const candidateSoil = await fetchSoilAnalysis(candidate.lon, candidate.lat);
      soil = candidateSoil;
      sourcePoint = candidate;
      if (analysisHasData(candidateSoil)) break;
    }

    if (!soil) throw new Error("Soil analysis failed");

    const analysis = await prisma.$queryRaw`
      INSERT INTO "Analiza" (
        id, lon, lat,
        "physicalSoil", "chemicalProperties",
        "soilClassification", "derivedProperties",
        "fetchedAt", "parcelaId"
      )
      VALUES (
        gen_random_uuid(),
        ${sourcePoint.lon},
        ${sourcePoint.lat},
        CAST(${JSON.stringify(soil.physical)} AS jsonb),
        CAST(${JSON.stringify(soil.chemical)} AS jsonb),
        CAST(${JSON.stringify(soil.classification)} AS jsonb),
        CAST(${JSON.stringify(soil.derived)} AS jsonb),
        NOW(),
        ${id}
      )
      RETURNING
        id, lon, lat,
        "physicalSoil", "chemicalProperties",
        "soilClassification", "derivedProperties",
        "fetchedAt", "parcelaId"
    `;

    return analysis[0];
  })().finally(() => {
    analysisJobs.delete(jobKey);
  });

  analysisJobs.set(jobKey, job);
  return job;
}

export async function listParcele(userId) {
  return prisma.$queryRaw`
    SELECT
      id, name, color, gerk_pid::text, "typeOfUse",
      "plannedCropName", "plannedCropPercent",
      (
        SELECT COALESCE(json_agg(json_build_object(
          'id', cp.id, 'cropName', cp."cropName",
          'areaPercent', cp."areaPercent",
          'plantedAmountKg', cp."plantedAmountKg",
          'plantingDate', cp."plantingDate",
          'harvestDate', cp."harvestDate",
          'createdAt', cp."createdAt",
          'updatedAt', cp."updatedAt"
        ) ORDER BY cp."createdAt" DESC), '[]'::json)
        FROM "CropPlan" cp WHERE cp."parcelaId" = "Parcela".id
      ) AS "cropPlans",
      ST_AsGeoJSON(coordinates)::json AS coordinates,
      ST_Area(coordinates::geography) / 10000 AS "areaHectares",
      "createdAt", "updatedAt", "userId",
      (
        SELECT json_build_object(
          'id', a.id, 'lon', a.lon, 'lat', a.lat,
          'physicalSoil', a."physicalSoil",
          'chemicalProperties', a."chemicalProperties",
          'soilClassification', a."soilClassification",
          'derivedProperties', a."derivedProperties",
          'fetchedAt', a."fetchedAt"
        )
        FROM "Analiza" a WHERE a."parcelaId" = "Parcela".id
        ORDER BY a."fetchedAt" DESC LIMIT 1
      ) AS analysis
    FROM "Parcela"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
  `;
}

export async function getParcelaById(id, userId) {
  const rows = await prisma.$queryRaw`
    SELECT
      id, name, color, gerk_pid::text, "typeOfUse",
      "plannedCropName", "plannedCropPercent",
      (
        SELECT COALESCE(json_agg(json_build_object(
          'id', cp.id, 'cropName', cp."cropName",
          'areaPercent', cp."areaPercent",
          'plantedAmountKg', cp."plantedAmountKg",
          'plantingDate', cp."plantingDate",
          'harvestDate', cp."harvestDate",
          'createdAt', cp."createdAt",
          'updatedAt', cp."updatedAt"
        ) ORDER BY cp."createdAt" DESC), '[]'::json)
        FROM "CropPlan" cp WHERE cp."parcelaId" = "Parcela".id
      ) AS "cropPlans",
      ST_AsGeoJSON(coordinates)::json AS coordinates,
      ST_Area(coordinates::geography) / 10000 AS "areaHectares",
      "createdAt", "updatedAt", "userId",
      (
        SELECT json_build_object(
          'id', a.id, 'lon', a.lon, 'lat', a.lat,
          'physicalSoil', a."physicalSoil",
          'chemicalProperties', a."chemicalProperties",
          'soilClassification', a."soilClassification",
          'derivedProperties', a."derivedProperties",
          'fetchedAt', a."fetchedAt"
        )
        FROM "Analiza" a WHERE a."parcelaId" = "Parcela".id
        ORDER BY a."fetchedAt" DESC LIMIT 1
      ) AS analysis
    FROM "Parcela"
    WHERE id = ${id} AND "userId" = ${userId}
  `;

  if (!rows[0]) throw createError("Parcela not found", 404);
  return rows[0];
}

export async function createParcela(userId, { name, color, coordinates, typeOfUse, plannedCropName, plannedCropPercent }) {
  if (!name || !coordinates) throw createError("Manjkata name in coordinates", 400);
  if (!isValidPolygon(coordinates)) throw createError("Invalid GeoJSON Polygon", 400);

  const landUseType = LAND_USE_TYPES.includes(typeOfUse) ? typeOfUse : "Ostalo";
  const geoJson = JSON.stringify(coordinates);
  const cropName = normalizePlannedCropName(plannedCropName);
  const cropPercent = normalizePercent(plannedCropPercent);

  await assertNoParcelaOverlap(geoJson, userId);

  const rows = await prisma.$queryRaw`
    INSERT INTO "Parcela" (
      id, name, color, "typeOfUse",
      "plannedCropName", "plannedCropPercent",
      coordinates, "userId", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      ${name},
      ${color ?? null},
      ${landUseType},
      ${cropName},
      ${cropPercent},
      ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326),
      ${userId},
      NOW(), NOW()
    )
    RETURNING
      id, name, color, gerk_pid::text, "typeOfUse",
      "plannedCropName", "plannedCropPercent",
      ST_AsGeoJSON(coordinates)::json AS coordinates,
      "createdAt", "updatedAt", "userId"
  `;

  runParcelaAnalysis(rows[0].id, userId).catch((err) => {
    console.error("Background soil analysis failed:", err);
  });

  return rows[0];
}

export async function updateParcela(id, userId, body) {
  const { name, color, gerk_pid, typeOfUse, plannedCropName, plannedCropPercent, coordinates } = body;

  if (
    name === undefined && color === undefined && gerk_pid === undefined &&
    typeOfUse === undefined && plannedCropName === undefined &&
    plannedCropPercent === undefined && coordinates === undefined
  ) {
    throw createError("At least one field is required", 400);
  }

  if (coordinates !== undefined && !isValidPolygon(coordinates)) {
    throw createError("Invalid GeoJSON Polygon", 400);
  }

  const gerkPidBigInt = gerk_pid !== undefined ? toBigIntValue(gerk_pid) : null;
  const geoJson = coordinates !== undefined ? JSON.stringify(coordinates) : null;
  const cropName = plannedCropName !== undefined ? normalizePlannedCropName(plannedCropName) : null;
  const cropPercent = plannedCropPercent !== undefined ? normalizePercent(plannedCropPercent) : null;

  if (geoJson) await assertNoParcelaOverlap(geoJson, userId, id);

  const rows = await prisma.$queryRaw`
    UPDATE "Parcela"
    SET
      name = CASE WHEN ${name !== undefined} THEN ${name ?? null} ELSE name END,
      color = CASE WHEN ${color !== undefined} THEN ${color ?? null} ELSE color END,
      gerk_pid = CASE WHEN ${gerk_pid !== undefined} THEN ${gerkPidBigInt} ELSE gerk_pid END,
      "typeOfUse" = CASE WHEN ${typeOfUse !== undefined} THEN ${typeOfUse != null ? String(typeOfUse) : "Ostalo"} ELSE "typeOfUse" END,
      "plannedCropName" = CASE WHEN ${plannedCropName !== undefined} THEN ${cropName} ELSE "plannedCropName" END,
      "plannedCropPercent" = CASE WHEN ${plannedCropPercent !== undefined} THEN ${cropPercent} ELSE "plannedCropPercent" END,
      coordinates = CASE WHEN ${coordinates !== undefined} THEN ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326) ELSE coordinates END,
      "updatedAt" = NOW()
    WHERE id = ${id} AND "userId" = ${userId}
    RETURNING
      id, name, color, gerk_pid::text, "typeOfUse",
      "plannedCropName", "plannedCropPercent",
      ST_AsGeoJSON(coordinates)::json AS coordinates,
      ST_Area(coordinates::geography) / 10000 AS "areaHectares",
      "createdAt", "updatedAt", "userId"
  `;

  if (!rows[0]) throw createError("Parcela not found", 404);

  if (coordinates !== undefined) {
    await prisma.$executeRaw`DELETE FROM "Analiza" WHERE "parcelaId" = ${id}`;
  }

  return rows[0];
}

export async function deleteParcela(id, userId) {
  const existing = await prisma.$queryRaw`
    SELECT id FROM "Parcela" WHERE id = ${id} AND "userId" = ${userId}
  `;
  if (!existing[0]) throw createError("Parcela not found", 404);

  await prisma.$transaction([
    prisma.$executeRaw`DELETE FROM "Pridelek" WHERE "parcelaId" = ${id}`,
    prisma.$executeRaw`DELETE FROM "Analiza" WHERE "parcelaId" = ${id}`,
    prisma.$executeRaw`DELETE FROM "Parcela" WHERE id = ${id}`,
  ]);
}

export async function analyzeParcela(id, userId) {
  return runParcelaAnalysis(id, userId);
}

export async function listCropPlans(parcelaId, userId) {
  await assertParcelaOwner(parcelaId, userId);
  return prisma.$queryRaw`
    SELECT
      id, "cropName", "areaPercent", "plantedAmountKg",
      "plantingDate", "harvestDate", "createdAt", "updatedAt", "parcelaId"
    FROM "CropPlan"
    WHERE "parcelaId" = ${parcelaId}
    ORDER BY "createdAt" DESC
  `;
}

export async function createCropPlan(parcelaId, userId, body) {
  const cropName = normalizePlannedCropName(body.cropName);
  const areaPercent = normalizeCropPlanPercent(body.areaPercent);
  const plantedAmountKg = normalizeOptionalPositiveNumber(body.plantedAmountKg, "plantedAmountKg");
  const plantingDate = normalizeDate(body.plantingDate, "plantingDate") ?? getTodayDate();
  const harvestDate = normalizeDate(body.harvestDate, "harvestDate") ?? estimateHarvestDate(cropName, plantingDate);

  if (!cropName || areaPercent == null) {
    throw createError("cropName in areaPercent sta obvezna.", 400);
  }

  await assertParcelaOwner(parcelaId, userId);

  const existingPlan = await prisma.$queryRaw`
    SELECT id, "areaPercent", "plantedAmountKg", "plantingDate"
    FROM "CropPlan"
    WHERE "parcelaId" = ${parcelaId} AND LOWER("cropName") = LOWER(${cropName})
    LIMIT 1
  `;

  if (existingPlan[0]) {
    const nextPercent = Number(existingPlan[0].areaPercent) + areaPercent;
    const nextPlantedAmountKg =
      plantedAmountKg == null
        ? existingPlan[0].plantedAmountKg
        : Number(existingPlan[0].plantedAmountKg ?? 0) + plantedAmountKg;
    await assertCropPlanCapacity(parcelaId, nextPercent, existingPlan[0].id);

    const mergedPlantingDate = plantingDate ?? existingPlan[0].plantingDate;
    const mergedHarvestDate =
      normalizeDate(body.harvestDate, "harvestDate") ??
      estimateHarvestDate(cropName, mergedPlantingDate);

    const updated = await prisma.$queryRaw`
      UPDATE "CropPlan"
      SET
        "areaPercent" = ${nextPercent},
        "plantedAmountKg" = ${nextPlantedAmountKg},
        "plantingDate" = ${mergedPlantingDate},
        "harvestDate" = ${mergedHarvestDate},
        "updatedAt" = NOW()
      WHERE id = ${existingPlan[0].id} AND "parcelaId" = ${parcelaId}
      RETURNING id, "cropName", "areaPercent", "plantedAmountKg", "plantingDate", "harvestDate", "createdAt", "updatedAt", "parcelaId"
    `;

    return { plan: updated[0], merged: true };
  }

  await assertCropPlanCapacity(parcelaId, areaPercent);

  const plan = await prisma.$queryRaw`
    INSERT INTO "CropPlan" (
      id, "cropName", "areaPercent", "plantedAmountKg",
      "plantingDate", "harvestDate", "createdAt", "updatedAt", "parcelaId"
    )
    VALUES (
      gen_random_uuid(),
      ${cropName}, ${areaPercent}, ${plantedAmountKg},
      ${plantingDate}, ${harvestDate},
      NOW(), NOW(), ${parcelaId}
    )
    RETURNING id, "cropName", "areaPercent", "plantedAmountKg", "plantingDate", "harvestDate", "createdAt", "updatedAt", "parcelaId"
  `;

  return { plan: plan[0], merged: false };
}

export async function updateCropPlan(parcelaId, planId, userId, body) {
  const hasCropName = body.cropName !== undefined;
  const hasAreaPercent = body.areaPercent !== undefined;
  const hasPlantedAmountKg = body.plantedAmountKg !== undefined;
  const hasPlantingDate = body.plantingDate !== undefined;
  const hasHarvestDate = body.harvestDate !== undefined;

  if (!hasCropName && !hasAreaPercent && !hasPlantedAmountKg && !hasPlantingDate && !hasHarvestDate) {
    throw createError("At least one field is required", 400);
  }

  await assertParcelaOwner(parcelaId, userId);

  const cropName = hasCropName ? normalizePlannedCropName(body.cropName) : null;
  let areaPercent = hasAreaPercent ? normalizeCropPlanPercent(body.areaPercent) : null;
  const plantedAmountKg = hasPlantedAmountKg
    ? normalizeOptionalPositiveNumber(body.plantedAmountKg, "plantedAmountKg")
    : null;
  const plantingDate = hasPlantingDate ? normalizeDate(body.plantingDate, "plantingDate") : null;
  const harvestDate = hasHarvestDate ? normalizeDate(body.harvestDate, "harvestDate") : null;

  if (hasAreaPercent) {
    await assertCropPlanCapacity(parcelaId, areaPercent, planId);
  } else {
    const current = await prisma.$queryRaw`
      SELECT "areaPercent" FROM "CropPlan"
      WHERE id = ${planId} AND "parcelaId" = ${parcelaId}
    `;
    areaPercent = Number(current[0]?.areaPercent ?? 0);
  }

  const rows = await prisma.$queryRaw`
    UPDATE "CropPlan"
    SET
      "cropName" = CASE WHEN ${hasCropName} THEN ${cropName} ELSE "cropName" END,
      "areaPercent" = CASE WHEN ${hasAreaPercent} THEN ${areaPercent} ELSE "areaPercent" END,
      "plantedAmountKg" = CASE WHEN ${hasPlantedAmountKg} THEN ${plantedAmountKg} ELSE "plantedAmountKg" END,
      "plantingDate" = CASE WHEN ${hasPlantingDate} THEN ${plantingDate} ELSE "plantingDate" END,
      "harvestDate" = CASE
        WHEN ${hasHarvestDate} THEN ${harvestDate}
        WHEN ${hasCropName || hasPlantingDate} THEN COALESCE(${estimateHarvestDate(cropName, plantingDate)}, "harvestDate")
        ELSE "harvestDate"
      END,
      "updatedAt" = NOW()
    WHERE id = ${planId} AND "parcelaId" = ${parcelaId}
    RETURNING id, "cropName", "areaPercent", "plantedAmountKg", "plantingDate", "harvestDate", "createdAt", "updatedAt", "parcelaId"
  `;

  if (!rows[0]) throw createError("Crop plan not found", 404);
  return rows[0];
}

export async function deleteCropPlan(parcelaId, planId, userId) {
  await assertParcelaOwner(parcelaId, userId);

  const deleted = await prisma.$queryRaw`
    DELETE FROM "CropPlan"
    WHERE id = ${planId} AND "parcelaId" = ${parcelaId}
    RETURNING id
  `;

  if (!deleted[0]) throw createError("Crop plan not found", 404);
}
