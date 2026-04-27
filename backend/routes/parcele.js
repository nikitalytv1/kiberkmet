import { Router } from "express";
import { prisma } from "../index.js";

const router = Router();

// GET vse parcele
router.get("/", async (req, res) => {
  const parcele = await prisma.$queryRaw`
    SELECT 
      id, gerk_pid, "typeOfUse",
      ST_AsGeoJSON(coordinates)::json AS coordinates,
      "createdAt", "userId"
    FROM "Parcela"
  `;
  res.json(parcele);
});

// POST nova parcela
// coordinates pricakuje GeoJSON Polygon:
// { "type": "Polygon", "coordinates": [[[lon, lat], [lon, lat], ...]] }
router.post("/", async (req, res) => {
  const { gerk_pid, typeOfUse, coordinates, userId } = req.body;

  try {
    const parcela = await prisma.$queryRaw`
      INSERT INTO "Parcela" (id, gerk_pid, "typeOfUse", coordinates, "userId", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${BigInt(gerk_pid)},
        ${typeOfUse},
        ST_GeomFromGeoJSON(${JSON.stringify(coordinates)}),
        ${userId}::uuid,
        NOW(),
        NOW()
      )
      RETURNING id, gerk_pid::text, "typeOfUse", ST_AsGeoJSON(coordinates)::json AS coordinates
    `;
    res.status(201).json(parcela[0]);
  } catch (err) {
    console.error("MESSAGE:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET parcela po id
router.get("/", async (req, res) => {
  try {
    const parcele = await prisma.$queryRaw`
      SELECT 
        id, gerk_pid::text, "typeOfUse",
        ST_AsGeoJSON(coordinates)::json AS coordinates,
        "createdAt", "userId"
      FROM "Parcela"
    `;
    res.json(parcele);
  } catch (err) {
    console.error("MESSAGE:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;