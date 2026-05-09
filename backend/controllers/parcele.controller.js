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

function toNumberValue(value) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error('typeOfUse must be a valid number');
  }

  return parsed;
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
        "createdAt",
        "updatedAt",
        "userId"
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
        "createdAt",
        "updatedAt",
        "userId"
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
    gerk_pid,
    typeOfUse,
    coordinates
  } = req.body;

  if (
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

    const typeOfUseNumber =
      typeOfUse !== undefined
        ? toNumberValue(typeOfUse)
        : null;

    const geoJson =
      coordinates !== undefined
        ? JSON.stringify(coordinates)
        : null;

    const parcela = await prisma.$queryRaw`
      UPDATE "Parcela"
      SET
        gerk_pid = COALESCE(${gerkPidBigInt}, gerk_pid),

        "typeOfUse" = COALESCE(
          ${typeOfUseNumber},
          "typeOfUse"
        ),

        coordinates = COALESCE(
          ST_SetSRID(
            ST_GeomFromGeoJSON(${geoJson}),
            4326
          ),
          coordinates
        ),

        "updatedAt" = NOW()

      WHERE id = ${id}

      RETURNING
        id,
        gerk_pid::text,
        "typeOfUse",
        ST_AsGeoJSON(coordinates)::json AS coordinates,
        "createdAt",
        "updatedAt",
        "userId"
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

    await prisma.$executeRaw`
      DELETE FROM "Parcela"
      WHERE id = ${id}
    `;

    return res.status(204).send();
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}