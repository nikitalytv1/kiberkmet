import { useMap } from 'react-leaflet';

export function MapInteraction({ active }: { active: boolean }) {
  const map = useMap();
  if (active) map.dragging.enable();
  else map.dragging.disable();
  return null;
}