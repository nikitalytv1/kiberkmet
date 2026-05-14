import { Point } from '../views/map/types';
import { ParcelaAnalysis } from './parcele';
import { fetchWithAuth } from './fetchWithAuth';

export interface StatisticalRegion {
  code: string;
  name: string;
}

export interface RegionParcela {
  id: string;
  name: string;
  color: string | null;
  gerk_pid?: string | null;
  typeOfUse?: string | number | null;
  areaHectares?: number | null;
  coordinates: {
    type: string;
    coordinates: number[][][];
  };
  pts: Point[];
  analysis?: ParcelaAnalysis | null;
  sursYieldStats?: {
    cropCode: string;
    cropName: string;
    unit: string;
    history: {
      year: number;
      value: number;
    }[];
    latest: {
      year: number;
      value: number;
    } | null;
    prediction: {
      year: number | null;
      value: number | null;
    };
  } | null;
}

function fromGeoJSON(geo: { coordinates: number[][][] }): Point[] {
  return geo.coordinates[0].slice(0, -1).map(([lng, lat]) => [lat, lng] as Point);
}

export async function getStatisticalRegions(): Promise<StatisticalRegion[]> {
  const res = await fetchWithAuth('/api/regions');
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Napaka pri nalaganju statističnih regij.');
  }

  return data;
}

export async function getRegionParcele(regionCode: string): Promise<{
  region: StatisticalRegion;
  parcele: RegionParcela[];
}> {
  const res = await fetchWithAuth(`/api/regions/${regionCode}/parcele`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Napaka pri nalaganju parcel za regijo.');
  }

  return {
    region: data.region,
    parcele: data.parcele.map((p: RegionParcela) => ({
      ...p,
      areaHectares: p.areaHectares == null ? null : Number(p.areaHectares),
      pts: fromGeoJSON(p.coordinates),
      analysis: p.analysis ?? null,
    })),
  };
}
