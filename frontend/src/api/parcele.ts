import { Point } from '../views/map/types';

export interface Parcela {
  id: string;
  name: string;
  color: string | null;
  gerk_pid?: string | null;
  typeOfUse?: string | number | null;
  coordinates: {
    type: string;
    coordinates: number[][][];
  };
  areaHectares?: number | string | null;
  analysis?: ParcelaAnalysis | null;
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

export async function saveParcela(name: string, color: string, pts: Point[]): Promise<Parcela> {
  const res = await fetch('/api/parcele', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color, coordinates: toGeoJSON(pts) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri shranjevanju parcele.');
  return data;
}

export async function getParcele(): Promise<{ id: string; name: string; color: string | null; gerk_pid?: string | null; typeOfUse?: string | number | null; areaHectares?: number | null; pts: Point[]; analysis?: ParcelaAnalysis | null }[]> {
  const res = await fetch('/api/parcele');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri nalaganju parcel.');
  return data.map((p: Parcela) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    gerk_pid: p.gerk_pid,
    typeOfUse: p.typeOfUse,
    areaHectares: p.areaHectares == null ? null : Number(p.areaHectares),
    pts: fromGeoJSON(p.coordinates),
    analysis: p.analysis ?? null,
  }));
}

export async function getParcela(id: string): Promise<{ id: string; name: string; color: string | null; gerk_pid?: string | null; typeOfUse?: string | number | null; areaHectares?: number | null; pts: Point[]; analysis?: ParcelaAnalysis | null }> {
  const res = await fetch(`/api/parcele/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri nalaganju parcele.');
  return {
    id: data.id,
    name: data.name,
    color: data.color,
    gerk_pid: data.gerk_pid,
    typeOfUse: data.typeOfUse,
    areaHectares: data.areaHectares == null ? null : Number(data.areaHectares),
    pts: fromGeoJSON(data.coordinates),
    analysis: data.analysis ?? null,
  };
}

export async function analyzeParcela(id: string): Promise<ParcelaAnalysis> {
  const res = await fetch(`/api/parcele/${id}/analyze`, { method: 'POST' });
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

  const res = await fetch(`/api/parcele/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri posodabljanju parcele.');
  return data;
}

export async function deleteParcela(id: string): Promise<void> {
  const res = await fetch(`/api/parcele/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Napaka pri brisanju parcele.');
  }
}
