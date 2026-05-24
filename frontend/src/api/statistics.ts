import { fetchWithAuth } from './fetchWithAuth';

export interface TopCrop {
  code: string;
  name: string;
  value: number;
}

export interface TopCropsResponse {
  source: string;
  table: string;
  year: string | null;
  region: string;
  regionCode?: string;
  location?: {
    lon: number;
    lat: number;
    nutsId?: string;
    regionName?: string;
    source: string;
  } | null;
  unit: string;
  crops: TopCrop[];
}

export interface SursYieldStat {
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
}

export interface ParcelaYieldStatsResponse {
  source: string;
  table: string;
  unit: string;
  region: string;
  regionCode: string;
  stats: SursYieldStat[];
}

export async function getRegionalTopCrops(options?: {
  lon?: number | null;
  parcelaId?: string | null;
}): Promise<TopCropsResponse> {
  if (options?.parcelaId) {
    const res = await fetchWithAuth(`/api/statistics/top-crops/parcela/${options.parcelaId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Napaka pri nalaganju SURS podatkov.');
    }

    return data;
  }

  const params = new URLSearchParams();

  if (options?.lon != null) {
    params.set('lon', String(options.lon));
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/statistics/top-crops${suffix}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Napaka pri nalaganju SURS podatkov.');
  }

  return data;
}

export async function getParcelaYieldStats(parcelaId: string): Promise<ParcelaYieldStatsResponse> {
  const res = await fetchWithAuth(`/api/statistics/yields/parcela/${parcelaId}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Napaka pri nalaganju SURS donosov.');
  }

  return data;
}
