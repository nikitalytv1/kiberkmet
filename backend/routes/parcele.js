import { Router } from "express";
import { prisma } from "../index.js";
const router = Router();

// GET all
router.get("/", async (req, res) => {
  try {
    const parcele = await prisma.$queryRaw`
      SELECT
        id, name, color, gerk_pid::text, "typeOfUse",
        ST_AsGeoJSON(coordinates)::json AS coordinates,
        "createdAt", "userId"
      FROM "Parcela"
    `;
    res.json(parcele);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const parcela = await prisma.$queryRaw`
      SELECT 
        id, gerk_pid::text, "typeOfUse",
        ST_AsGeoJSON(coordinates)::json AS coordinates,
        "createdAt", "userId"
      FROM "Parcela"
      WHERE id = ${id}
    `;
    if (!parcela[0]) return res.status(404).json({ error: "Not found" });
    res.json(parcela[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST
router.post("/", async (req, res) => {
  const { name, color, coordinates } = req.body;

  if (!name || !coordinates) {
    return res.status(400).json({ error: "Manjkata name in coordinates" });
  }

  try {
    const parcela = await prisma.$queryRaw`
      INSERT INTO "Parcela" (id, name, color, "typeOfUse", coordinates, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${name},
        ${color ?? null},
        'Ostalo',
        ST_GeomFromGeoJSON(${JSON.stringify(coordinates)}),
        NOW(),
        NOW()
      )
      RETURNING id, name, color, "typeOfUse", ST_AsGeoJSON(coordinates)::json AS coordinates
    `;
    res.status(201).json(parcela[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { typeOfUse, coordinates } = req.body;
  
  // Validate required fields
  if (!typeOfUse && !coordinates) {
    return res.status(400).json({ error: "At least one field to update is required: typeOfUse or coordinates" });
  }
  
  try {
    const parcela = await prisma.$queryRaw`
      UPDATE "Parcela"
      SET 
        "typeOfUse" = COALESCE(${typeOfUse}, "typeOfUse"),
        coordinates = COALESCE(ST_GeomFromGeoJSON(${coordinates ? JSON.stringify(coordinates) : null}), coordinates),
        "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING id, gerk_pid::text, "typeOfUse", ST_AsGeoJSON(coordinates)::json AS coordinates
    `;
    
    // Check if record was found
    if (!parcela || parcela.length === 0) {
      return res.status(404).json({ error: "Parcela not found" });
    }
    
    res.json(parcela[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.$queryRaw`
      SELECT id FROM "Parcela" WHERE id = ${id}   -- ← remove ::uuid
    `;
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: "Parcela not found" });
    }
    await prisma.$queryRaw`DELETE FROM "Parcela" WHERE id = ${id}`;  
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;