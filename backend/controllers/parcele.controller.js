import { prisma } from '../index.js';

function isValidPolygon(coordinates) {
  if (!coordinates || typeof coordinates !== 'object') return false;

  return (
    coordinates.type === 'Polygon' &&
    Array.isArray(coordinates.coordinates) &&
    Array.isArray(coordinates.coordinates[0]) &&
    coordinates.coordinates[0].length >= 4
  );
}

function toBigIntValue(value) {
  try {
    return BigInt(value);
  } catch {
    throw new Error('gerk_pid must be a valid integer');
  }
}

function getSoilUrl(base, lon, lat, properties) {
  const params = new URLSearchParams({
    lon: String(lon),
    lat: String(lat),
    depth: '0-5cm'
  });

  properties.forEach(property => params.append('property', property));
  ['mean', 'Q0.05', 'Q0.95'].forEach(value => params.append('value', value));

  return `${base}/properties/query?${params.toString()}`;
}

async function fetchJsonOrThrow(url, label) {
  const res = await fetch(url);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.detail ?? data?.error ?? res.statusText;
    throw new Error(`${label} failed (${res.status}): ${detail}`);
  }

  return data;
}

function pickLayers(source, names) {
  const layers = source?.properties?.layers ?? [];

  return {
    ...source,
    properties: {
      ...(source?.properties ?? {}),
      layers: layers.filter(layer => names.includes(layer.name))
    }
  };
}

async function fetchSoilAnalysis(lon, lat) {
  const base = 'https://dev-rest.isric.org/soilgrids/v2.0';
  const physicalProperties = ['bdod', 'clay', 'cfvo', 'sand', 'silt', 'wv0010', 'wv0033', 'wv1500'];
  const chemicalProperties = ['phh2o', 'cec', 'nitrogen', 'soc'];
  const derivedProperties = ['ocd', 'ocs'];

  const properties = await fetchJsonOrThrow(
    getSoilUrl(base, lon, lat, [
      ...physicalProperties,
      ...chemicalProperties,
      ...derivedProperties
    ]),
    'SoilGrids properties'
  );

  return {
    physical: pickLayers(properties, physicalProperties),
    chemical: pickLayers(properties, chemicalProperties),
    derived: pickLayers(properties, derivedProperties),
    classification: null
  };
}

function sourceHasMeanValue(source) {
  const layers = source?.properties?.layers ?? [];

  return layers.some(layer => (
    layer.depths ?? []
  ).some(depth => depth.values?.mean != null));
}

function analysisHasData(soil) {
  return [
    soil.physical,
    soil.chemical,
    soil.derived
  ].some(sourceHasMeanValue);
}

function getAnalysisCandidates(coordinates, lon, lat) {
  const ring = coordinates?.coordinates?.[0] ?? [];
  const vertices = ring.map(([vertexLon, vertexLat]) => ({
    lon: Number(vertexLon),
    lat: Number(vertexLat)
  }));

  const offsets = [
    { lon, lat },
    ...vertices,
    { lon: lon + 0.01, lat },
    { lon: lon - 0.01, lat },
    { lon, lat: lat + 0.01 },
    { lon, lat: lat - 0.01 },
    { lon: lon + 0.02, lat: lat + 0.02 },
    { lon: lon - 0.02, lat: lat - 0.02 }
  ];

  return offsets.filter((point, index, all) => (
    Number.isFinite(point.lon) &&
    Number.isFinite(point.lat) &&
    all.findIndex(other => (
      Math.abs(other.lon - point.lon) < 0.000001 &&
      Math.abs(other.lat - point.lat) < 0.000001
    )) === index
  ));
}

// GET ALL
export async function getParcele(req, res) {
  try {
    const parcele = await prisma.$queryRaw`
      SELECT
        id,
        name,
        color,
        gerk_pid::text,
        "typeOfUse",
        ST_AsGeoJSON(coordinates)::json AS coordinates,
        ST_Area(coordinates::geography) / 10000 AS "areaHectares",
        "createdAt",
        "updatedAt",
        "userId",
        (
          SELECT json_build_object(
            'id', a.id,
            'lon', a.lon,
            'lat', a.lat,
            'physicalSoil', a."physicalSoil",
            'chemicalProperties', a."chemicalProperties",
            'soilClassification', a."soilClassification",
            'derivedProperties', a."derivedProperties",
            'fetchedAt', a."fetchedAt"
          )
          FROM "Analiza" a
          WHERE a."parcelaId" = "Parcela".id
          ORDER BY a."fetchedAt" DESC
          LIMIT 1
        ) AS analysis
      FROM "Parcela"
      ORDER BY "createdAt" DESC
    `;

    return res.json(parcele);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}

// GET BY ID
export async function getParcelaById(req, res) {
  const { id } = req.params;

  try {
    const parcela = await prisma.$queryRaw`
      SELECT
        id,
        name,
        color,
        gerk_pid::text,
        "typeOfUse",
        ST_AsGeoJSON(coordinates)::json AS coordinates,
        ST_Area(coordinates::geography) / 10000 AS "areaHectares",
        "createdAt",
        "updatedAt",
        "userId",
        (
          SELECT json_build_object(
            'id', a.id,
            'lon', a.lon,
            'lat', a.lat,
            'physicalSoil', a."physicalSoil",
            'chemicalProperties', a."chemicalProperties",
            'soilClassification', a."soilClassification",
            'derivedProperties', a."derivedProperties",
            'fetchedAt', a."fetchedAt"
          )
          FROM "Analiza" a
          WHERE a."parcelaId" = "Parcela".id
          ORDER BY a."fetchedAt" DESC
          LIMIT 1
        ) AS analysis
      FROM "Parcela"
      WHERE id = ${id}
    `;

    if (!parcela[0]) {
      return res.status(404).json({
        error: 'Parcela not found'
      });
    }

    return res.json(parcela[0]);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}

// CREATE
export async function createParcela(req, res) {
  const { name, color, coordinates } = req.body;

  if (!name || !coordinates) {
    return res.status(400).json({
      error: 'Manjkata name in coordinates'
    });
  }

  if (!isValidPolygon(coordinates)) {
    return res.status(400).json({
      error: 'Invalid GeoJSON Polygon'
    });
  }

  try {
    const geoJson = JSON.stringify(coordinates);

    const parcela = await prisma.$queryRaw`
      INSERT INTO "Parcela" (
        id,
        name,
        color,
        "typeOfUse",
        coordinates,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${name},
        ${color ?? null},
        'Ostalo',
        ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326),
        NOW(),
        NOW()
      )
      RETURNING
        id,
        name,
        color,
        gerk_pid::text,
        "typeOfUse",
        ST_AsGeoJSON(coordinates)::json AS coordinates,
        "createdAt",
        "updatedAt",
        "userId"
    `;

    return res.status(201).json(parcela[0]);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}

// UPDATE
export async function updateParcela(req, res) {
  const { id } = req.params;

  const {
    name,
    color,
    gerk_pid,
    typeOfUse,
    coordinates
  } = req.body;

  if (
    name === undefined &&
    color === undefined &&
    gerk_pid === undefined &&
    typeOfUse === undefined &&
    coordinates === undefined
  ) {
    return res.status(400).json({
      error: 'At least one field is required'
    });
  }

  if (
    coordinates !== undefined &&
    !isValidPolygon(coordinates)
  ) {
    return res.status(400).json({
      error: 'Invalid GeoJSON Polygon'
    });
  }

  try {
    const gerkPidBigInt =
      gerk_pid !== undefined
        ? toBigIntValue(gerk_pid)
        : null;

    const geoJson =
      coordinates !== undefined
        ? JSON.stringify(coordinates)
        : null;

    const parcela = await prisma.$queryRaw`
      UPDATE "Parcela"
      SET
        name = CASE
          WHEN ${name !== undefined} THEN ${name ?? null}
          ELSE name
        END,

        color = CASE
          WHEN ${color !== undefined} THEN ${color ?? null}
          ELSE color
        END,

        gerk_pid = CASE
          WHEN ${gerk_pid !== undefined} THEN ${gerkPidBigInt}
          ELSE gerk_pid
        END,

        "typeOfUse" = CASE
          WHEN ${typeOfUse !== undefined} THEN ${typeOfUse != null ? String(typeOfUse) : 'Ostalo'}
          ELSE "typeOfUse"
        END,

        coordinates = CASE
          WHEN ${coordinates !== undefined} THEN ST_SetSRID(
            ST_GeomFromGeoJSON(${geoJson}),
            4326
          )
          ELSE coordinates
        END,

        "updatedAt" = NOW()

      WHERE id = ${id}

      RETURNING
        id,
        name,
        color,
        gerk_pid::text,
        "typeOfUse",
        ST_AsGeoJSON(coordinates)::json AS coordinates,
        ST_Area(coordinates::geography) / 10000 AS "areaHectares",
        "createdAt",
        "updatedAt",
        "userId"
    `;

    if (!parcela[0]) {
      return res.status(404).json({
        error: 'Parcela not found'
      });
    }

    if (coordinates !== undefined) {
      await prisma.$executeRaw`
        DELETE FROM "Analiza"
        WHERE "parcelaId" = ${id}
      `;
    }

    return res.json(parcela[0]);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}

// RUN AND SAVE SOIL ANALYSIS
export async function analyzeParcela(req, res) {
  const { id } = req.params;

  try {
    const parcela = await prisma.$queryRaw`
      SELECT
        id,
        ST_X(ST_PointOnSurface(coordinates)) AS lon,
        ST_Y(ST_PointOnSurface(coordinates)) AS lat,
        ST_AsGeoJSON(coordinates)::json AS coordinates
      FROM "Parcela"
      WHERE id = ${id}
    `;

    if (!parcela[0]) {
      return res.status(404).json({
        error: 'Parcela not found'
      });
    }

    const lon = Number(parcela[0].lon);
    const lat = Number(parcela[0].lat);

    const recent = await prisma.$queryRaw`
      SELECT
        id,
        lon,
        lat,
        "physicalSoil",
        "chemicalProperties",
        "soilClassification",
        "derivedProperties",
        "fetchedAt",
        "parcelaId"
      FROM "Analiza"
      WHERE
        "parcelaId" = ${id} AND
        "fetchedAt" >= NOW() - INTERVAL '2 minutes'
      ORDER BY "fetchedAt" DESC
      LIMIT 1
    `;

    if (recent[0]) {
      return res.json(recent[0]);
    }

    const candidates = getAnalysisCandidates(parcela[0].coordinates, lon, lat);
    let soil = null;
    let sourcePoint = { lon, lat };

    for (const candidate of candidates) {
      const candidateSoil = await fetchSoilAnalysis(candidate.lon, candidate.lat);
      soil = candidateSoil;
      sourcePoint = candidate;

      if (analysisHasData(candidateSoil)) {
        break;
      }
    }

    if (!soil) {
      throw new Error('Soil analysis failed');
    }

    const analysis = await prisma.$queryRaw`
      INSERT INTO "Analiza" (
        id,
        lon,
        lat,
        "physicalSoil",
        "chemicalProperties",
        "soilClassification",
        "derivedProperties",
        "fetchedAt",
        "parcelaId"
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
        id,
        lon,
        lat,
        "physicalSoil",
        "chemicalProperties",
        "soilClassification",
        "derivedProperties",
        "fetchedAt",
        "parcelaId"
    `;

    return res.status(201).json(analysis[0]);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}

// DELETE
export async function deleteParcela(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.$queryRaw`
      SELECT id
      FROM "Parcela"
      WHERE id = ${id}
    `;

    if (!existing[0]) {
      return res.status(404).json({
        error: 'Parcela not found'
      });
    }

    await prisma.$transaction([
      prisma.$executeRaw`
        DELETE FROM "Pridelek"
        WHERE "parcelaId" = ${id}
      `,
      prisma.$executeRaw`
        DELETE FROM "Analiza"
        WHERE "parcelaId" = ${id}
      `,
      prisma.$executeRaw`
        DELETE FROM "Parcela"
        WHERE id = ${id}
      `
    ]);

    return res.status(204).send();
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}
