import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { DrawnPolygon } from '../types';

export function MapFlyTo({ selectedId, polygons }: { selectedId: string | null; polygons: DrawnPolygon[] }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const pg = polygons.find(p => p.id === selectedId);
    if (!pg || pg.pts.length === 0) return;

    const lats = pg.pts.map(p => p[0]);
    const lngs = pg.pts.map(p => p[1]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [40, 40], animate: true });
  }, [selectedId, polygons, map]);

  return null;
}