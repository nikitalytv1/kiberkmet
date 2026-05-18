import { useMap, useMapEvents } from 'react-leaflet';
import { Point, DrawnPolygon } from '../types';

export function DrawHandler({
  enabled,
  drawing,
  polygons,
  onAddPoint,
  onFinish,
  onMouseMove,
  onSnapChange,
}: {
  enabled: boolean;
  drawing: Point[];
  polygons: DrawnPolygon[];
  onAddPoint: (p: Point) => void;
  onFinish: (pts: Point[]) => void;
  onMouseMove: (p: Point | null) => void;
  onSnapChange: (pt: Point | null) => void;
}) {
  const SNAP_PX = 20;
  const map = useMap();

  function findSnap(latlng: Point): Point | null {
    const curPx = map.latLngToContainerPoint(latlng);
    let best: Point | null = null;
    let bestDist = SNAP_PX;
    [...drawing, ...polygons.flatMap(p => p.pts)].forEach(pt => {
      const px = map.latLngToContainerPoint(pt);
      const d = Math.sqrt((px.x - curPx.x) ** 2 + (px.y - curPx.y) ** 2);
      if (d < bestDist) { bestDist = d; best = pt; }
    });
    return best;
  }

  useMapEvents({
    click(e) {
      if (!enabled) return;
      const { lat, lng } = e.latlng;
      const snap = findSnap([lat, lng]);
      if (snap && drawing.length >= 3 && snap === drawing[0]) {
        onFinish(drawing); onSnapChange(null); return;
      }
      onAddPoint(snap ?? [lat, lng]);
    },
    dblclick(e) {
      if (!enabled) return;
      e.originalEvent.preventDefault();
      const pts = drawing.slice(0, -1);
      if (pts.length >= 3) onFinish(pts);
    },
    mousemove(e) {
      if (!enabled) { onMouseMove(null); onSnapChange(null); return; }
      const { lat, lng } = e.latlng;
      const snap = findSnap([lat, lng]);
      onSnapChange(snap);
      onMouseMove(snap ?? [lat, lng]);
    },
  });

  return null;
}