import { Point } from '../views/map/types';
import { CropPlan } from '../api/parcele';

interface ParcelaExportItem {
  id: string;
  name: string;
  color: string | null;
  gerk_pid?: string | null;
  typeOfUse?: string | number | null;
  areaHectares?: number | null;
  pts: Point[];
  cropPlans?: CropPlan[];
}

export function downloadGeoJSON(parcele: ParcelaExportItem[]) {
  const features = parcele.map(p => {
    // pts is Leaflet [lat, lng] — GeoJSON requires [lng, lat]
    const ring = p.pts.map(([lat, lng]) => [lng, lat]);
    ring.push(ring[0]);
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {
        id: p.id,
        name: p.name,
        color: p.color ?? null,
        gerk_pid: p.gerk_pid ?? null,
        typeOfUse: p.typeOfUse ?? null,
        areaHectares: p.areaHectares ?? null,
        cropPlans: (p.cropPlans ?? []).map(plan => ({
          cropName: plan.cropName,
          areaPercent: plan.areaPercent,
          plantedAmountKg: plan.plantedAmountKg ?? null,
          plantingDate: plan.plantingDate,
          harvestDate: plan.harvestDate,
        })),
      },
    };
  });

  const geojson = { type: 'FeatureCollection', features };
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kiberkmet-parcele-${new Date().toISOString().slice(0, 10)}.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
