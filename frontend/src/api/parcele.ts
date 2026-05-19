import { Point } from '../views/map/types';
import { fetchWithAuth } from './fetchWithAuth';

export interface Parcela {
  id: string;
  name: string;
  color: string | null;
  gerk_pid?: string | null;
  typeOfUse?: string | number | null;
  plannedCropName?: string | null;
  plannedCropPercent?: number | string | null;
  cropPlans?: CropPlan[];
  coordinates: {
    type: string;
    coordinates: number[][][];
  };
  areaHectares?: number | string | null;
  analysis?: ParcelaAnalysis | null;
}

export interface CropPlan {
  id: string;
  cropName: string;
  areaPercent: number;
  plantedAmountKg?: number | null;
  plantingDate: string | null;
  harvestDate: string | null;
  createdAt?: string;
  updatedAt?: string;
  parcelaId?: string;
}

export interface ParcelaAnalysis {
  id: string;
  lon: number;
  lat: number;
  physicalSoil: unknown;
  chemicalProperties: unknown;
  soilClassification: unknown;
  derivedProperties: unknown;
  fetchedAt: string;
}

// Leaflet uses [lat, lng], GeoJSON uses [lng, lat] — pretvorimo
function toGeoJSON(pts: Point[]) {
  if (!Array.isArray(pts)) throw new Error(`toGeoJSON: pričakovan array, dobil ${typeof pts}: ${JSON.stringify(pts)}`);
  const ring = pts.map(([lat, lng]) => [lng, lat]);
  ring.push(ring[0]); // GeoJSON polygon mora biti zaprt
  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

// GeoJSON [lng, lat] v Leaflet [lat, lng]
function fromGeoJSON(geo: { coordinates: number[][][] }): Point[] {
  return geo.coordinates[0].slice(0, -1).map(([lng, lat]) => [lat, lng] as Point);
}

export async function getLandUseTypes(): Promise<string[]> {
  const res = await fetch('/api/parcele/types');
  const data = await res.json();
  if (!res.ok) throw new Error('Napaka pri nalaganju tipov rabe.');
  return data;
}

export async function saveParcela(
  name: string,
  color: string,
  pts: Point[],
  typeOfUse?: string,
  plannedCropName?: string | null,
  plannedCropPercent?: number | null
): Promise<Parcela> {
  const res = await fetchWithAuth('/api/parcele', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color, typeOfUse, plannedCropName, plannedCropPercent, coordinates: toGeoJSON(pts) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri shranjevanju parcele.');
  return data;
}

export async function getParcele(): Promise<{ id: string; name: string; color: string | null; gerk_pid?: string | null; typeOfUse?: string | number | null; plannedCropName?: string | null; plannedCropPercent?: number | null; cropPlans?: CropPlan[]; areaHectares?: number | null; pts: Point[]; analysis?: ParcelaAnalysis | null }[]> {
  const res = await fetchWithAuth('/api/parcele');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri nalaganju parcel.');
  return data.map((p: Parcela) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    gerk_pid: p.gerk_pid,
    typeOfUse: p.typeOfUse,
    plannedCropName: p.plannedCropName ?? null,
    plannedCropPercent: p.plannedCropPercent == null ? null : Number(p.plannedCropPercent),
    cropPlans: p.cropPlans ?? [],
    areaHectares: p.areaHectares == null ? null : Number(p.areaHectares),
    pts: fromGeoJSON(p.coordinates),
    analysis: p.analysis ?? null,
  }));
}

export async function getParcela(id: string): Promise<{ id: string; name: string; color: string | null; gerk_pid?: string | null; typeOfUse?: string | number | null; plannedCropName?: string | null; plannedCropPercent?: number | null; cropPlans?: CropPlan[]; areaHectares?: number | null; pts: Point[]; analysis?: ParcelaAnalysis | null }> {
  const res = await fetchWithAuth(`/api/parcele/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri nalaganju parcele.');
  return {
    id: data.id,
    name: data.name,
    color: data.color,
    gerk_pid: data.gerk_pid,
    typeOfUse: data.typeOfUse,
    plannedCropName: data.plannedCropName ?? null,
    plannedCropPercent: data.plannedCropPercent == null ? null : Number(data.plannedCropPercent),
    cropPlans: data.cropPlans ?? [],
    areaHectares: data.areaHectares == null ? null : Number(data.areaHectares),
    pts: fromGeoJSON(data.coordinates),
    analysis: data.analysis ?? null,
  };
}

export async function analyzeParcela(id: string): Promise<ParcelaAnalysis> {
  const res = await fetchWithAuth(`/api/parcele/${id}/analyze`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri analizi parcele.');
  return data;
}

export async function updateParcela(
  id: string,
  updates: {
    name?: string | null;
    color?: string | null;
    gerk_pid?: string | number | null;
    typeOfUse?: string | number | null;
    plannedCropName?: string | null;
    plannedCropPercent?: number | null;
    pts?: Point[];
  }
): Promise<Parcela> {
  const body: Record<string, unknown> = {
    ...updates,
  };

  if (updates.pts) {
    body.coordinates = toGeoJSON(updates.pts);
    delete body.pts;
  }

  const res = await fetchWithAuth(`/api/parcele/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri posodabljanju parcele.');
  return data;
}

export async function deleteParcela(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/parcele/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Napaka pri brisanju parcele.');
  }
}

export async function deleteAllParcele(): Promise<void> {
  const parcele = await getParcele();
  await Promise.all(parcele.map(p => deleteParcela(p.id)));
}

export async function getCropPlans(parcelaId: string): Promise<CropPlan[]> {
  const res = await fetchWithAuth(`/api/parcele/${parcelaId}/crop-plans`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri nalaganju nacrta pridelkov.');
  return data;
}

export async function createCropPlan(
  parcelaId: string,
  payload: { cropName: string; areaPercent: number; plantedAmountKg?: number | null; plantingDate?: string | null; harvestDate?: string | null }
): Promise<CropPlan> {
  const res = await fetchWithAuth(`/api/parcele/${parcelaId}/crop-plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri shranjevanju pridelka.');
  return data;
}

export async function updateCropPlan(
  parcelaId: string,
  planId: string,
  payload: Partial<{ cropName: string; areaPercent: number; plantedAmountKg: number | null; plantingDate: string | null; harvestDate: string | null }>
): Promise<CropPlan> {
  const res = await fetchWithAuth(`/api/parcele/${parcelaId}/crop-plans/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri posodabljanju pridelka.');
  return data;
}

export async function deleteCropPlan(parcelaId: string, planId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/parcele/${parcelaId}/crop-plans/${planId}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Napaka pri brisanju pridelka.');
  }
}
