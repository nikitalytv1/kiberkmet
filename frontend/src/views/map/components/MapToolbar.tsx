import { useMap } from 'react-leaflet';
import { Hand, Pencil, Trash2, Plus, Minus } from 'lucide-react';
import styles from '../map.module.css';

const tools = [
  { id: 'move',   icon: Hand,   label: 'Premikanje' },
  { id: 'draw',   icon: Pencil, label: 'Nariši parcelo' },
  { id: 'delete', icon: Trash2, label: 'Izbriši' },
];

export function MapToolbar({
  activeTool,
  choosingColor,
  selectedColor,
  onToolClick,
}: {
  activeTool: string;
  choosingColor: boolean;
  selectedColor: string;
  onToolClick: (id: string) => void;
}) {
  const map = useMap();
  return (
    <div className={styles.toolbar}>
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => onToolClick(id)}
          style={{ position: 'relative' }}
          className={[
            styles.toolBtn,
            (activeTool === id && !choosingColor) || (id === 'draw' && choosingColor)
              ? styles.toolBtnActive
              : '',
          ].join(' ')}
        >
          <Icon size={16} />
          {id === 'draw' && (activeTool === 'draw' || choosingColor) && (
            <span style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: selectedColor,
              border: '1.5px solid #ffffff',
            }} />
          )}
        </button>
      ))}
      <div className={styles.toolDivider} />
      <button className={styles.toolBtn} title="Povečaj"   onClick={() => map.zoomIn()}><Plus  size={16} /></button>
      <button className={styles.toolBtn} title="Pomanjšaj" onClick={() => map.zoomOut()}><Minus size={16} /></button>
    </div>
  );
}