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
  unit: string;
  crops: TopCrop[];
}

export async function getRegionalTopCrops(lon?: number | null): Promise<TopCropsResponse> {
  const params = new URLSearchParams();

  if (lon != null) {
    params.set('lon', String(lon));
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/statistics/top-crops${suffix}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Napaka pri nalaganju SURS podatkov.');
  }

  return data;
}
