export type Point = [number, number];
export type DrawnPolygon = { id?: string; pts: Point[]; color: string; name: string; areaHectares?: number | null };

export const MARIBOR_CENTER: Point = [46.5547, 15.6459];

export const COLORS = [
  '#1A4D3A', '#16a34a', '#2563eb', '#0891b2',
  '#7c3aed', '#be185d', '#dc2626', '#d97706',
];