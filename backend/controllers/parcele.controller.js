import * as parcelaService from "../services/parcela.service.js";

export const LAND_USE_TYPES = parcelaService.LAND_USE_TYPES;

export function getTypes(_req, res) {
  res.json(LAND_USE_TYPES);
}

export async function getParcele(req, res) {
  try {
    const parcele = await parcelaService.listParcele(req.user.userId);
    return res.json(parcele);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function getParcelaById(req, res) {
  try {
    const parcela = await parcelaService.getParcelaById(req.params.id, req.user.userId);
    return res.json(parcela);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function createParcela(req, res) {
  try {
    const parcela = await parcelaService.createParcela(req.user.userId, req.body);
    return res.status(201).json(parcela);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function updateParcela(req, res) {
  try {
    const parcela = await parcelaService.updateParcela(req.params.id, req.user.userId, req.body);
    return res.json(parcela);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function analyzeParcela(req, res) {
  try {
    const analysis = await parcelaService.analyzeParcela(req.params.id, req.user.userId);
    return res.status(201).json(analysis);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function deleteParcela(req, res) {
  try {
    await parcelaService.deleteParcela(req.params.id, req.user.userId);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function getCropPlans(req, res) {
  try {
    const plans = await parcelaService.listCropPlans(req.params.id, req.user.userId);
    return res.json(plans);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function createCropPlan(req, res) {
  try {
    const { plan, merged } = await parcelaService.createCropPlan(req.params.id, req.user.userId, req.body);
    return res.status(merged ? 200 : 201).json(plan);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function updateCropPlan(req, res) {
  try {
    const plan = await parcelaService.updateCropPlan(req.params.id, req.params.planId, req.user.userId, req.body);
    return res.json(plan);
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}

export async function deleteCropPlan(req, res) {
  try {
    await parcelaService.deleteCropPlan(req.params.id, req.params.planId, req.user.userId);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(err.status ?? 500).json({ error: err.message });
  }
}