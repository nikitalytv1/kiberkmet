import {
  getRegionForParcela,
  fetchTopCropsForRegion,
} from "../services/region.service.js";

export async function getTopCrops(req, res) {
  try {
    const regionCode = req.query.region ?? "0";
    return res.json(await fetchTopCropsForRegion(regionCode));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getTopCropsByParcela(req, res) {
  try {
    const region = await getRegionForParcela(req.params.id, req.user.userId);

    if (!region) {
      return res.status(404).json({ error: "Parcela not found" });
    }

    const location = {
      lon: Number(region.lon),
      lat: Number(region.lat),
      nutsId: region.nutsId,
      regionName: region.regionName,
      source: "parcela-point-on-surface",
    };

    return res.json(await fetchTopCropsForRegion(region.regionCode, location));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
