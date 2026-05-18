import { fetchSoilData } from "../services/soil.service.js";

export async function getSoil(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  try {
    const data = await fetchSoilData(lat, lon);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}