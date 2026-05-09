import { useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { MARIBOR_CENTER } from '../types';
import styles from '../map.module.css';

export function CoordinatesDisplay() {
  const [coords, setCoords] = useState(MARIBOR_CENTER);
  useMapEvents({
    move(e) {
      const { lat, lng } = e.target.getCenter();
      setCoords([lat, lng]);
    },
  });
  return (
    <div className={styles.coords}>
      {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
    </div>
  );
}