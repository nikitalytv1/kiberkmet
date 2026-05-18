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
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    map.panTo([centerLat, centerLng], { animate: true, duration: 0.3 });
  }, [selectedId, polygons, map]);

  return null;
}