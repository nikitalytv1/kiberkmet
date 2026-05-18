import { Point } from '../views/map/types';
import { ParcelaAnalysis } from './parcele';
import { fetchWithAuth } from './fetchWithAuth';
import type { SursYieldStats } from '../views/dashboard/SursYieldHistoryChart';

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
  sursYieldStats?: SursYieldStats | null;
}

type RegionParceleResponse = {
  region: StatisticalRegion;
  yieldStats: SursYieldStats[];
  parcele: RegionParcela[];
};

let statisticalRegionsPromise: Promise<StatisticalRegion[]> | null = null;
const regionParceleCache = new Map<string, Promise<RegionParceleResponse>>();

function fromGeoJSON(geo: { coordinates: number[][][] }): Point[] {
  return geo.coordinates[0].slice(0, -1).map(([lng, lat]) => [lat, lng] as Point);
}

export async function getStatisticalRegions(): Promise<StatisticalRegion[]> {
  if (statisticalRegionsPromise) return statisticalRegionsPromise;

  statisticalRegionsPromise = fetchStatisticalRegions();
  return statisticalRegionsPromise;
}

async function fetchStatisticalRegions(): Promise<StatisticalRegion[]> {
  const res = await fetchWithAuth('/api/regions');
  const data = await res.json();

  if (!res.ok) {
    statisticalRegionsPromise = null;
    throw new Error(data.error || 'Napaka pri nalaganju statističnih regij.');
  }

  return data;
}

export function prefetchStatisticalRegions() {
  void getStatisticalRegions().catch(() => {});
}

export async function getRegionParcele(regionCode: string): Promise<RegionParceleResponse> {
  const normalizedRegionCode = regionCode.padStart(2, '0');
  const cached = regionParceleCache.get(normalizedRegionCode);
  if (cached) return cached;

  const request = fetchRegionParcele(normalizedRegionCode).catch(err => {
    regionParceleCache.delete(normalizedRegionCode);
    throw err;
  });

  regionParceleCache.set(normalizedRegionCode, request);
  return request;
}

async function fetchRegionParcele(regionCode: string): Promise<RegionParceleResponse> {
  const res = await fetchWithAuth(`/api/regions/${regionCode}/parcele`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Napaka pri nalaganju parcel za regijo.');
  }

  return {
    region: data.region,
    yieldStats: data.yieldStats ?? [],
    parcele: data.parcele.map((p: RegionParcela) => ({
      ...p,
      areaHectares: p.areaHectares == null ? null : Number(p.areaHectares),
      pts: fromGeoJSON(p.coordinates),
      analysis: p.analysis ?? null,
    })),
  };
}

export function prefetchRegionParcele(regionCode = '08') {
  void getRegionParcele(regionCode).catch(() => {});
}
