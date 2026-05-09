import { Point } from '../views/map/types';

export interface Parcela {
  id: string;
  name: string;
  color: string | null;
  coordinates: {
    type: string;
    coordinates: number[][][];
  };
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

export async function getParcele(): Promise<{ id: string; name: string; color: string | null; pts: Point[] }[]> {
  const res = await fetch('/api/parcele');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Napaka pri nalaganju parcel.');
  return data.map((p: Parcela) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    pts: fromGeoJSON(p.coordinates),
  }));
}

export async function deleteParcela(id: string): Promise<void> {
  const res = await fetch(`/api/parcele/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Napaka pri brisanju parcele.');
  }
}