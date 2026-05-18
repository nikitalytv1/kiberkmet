import { useMap } from 'react-leaflet';
import { Hand, Pencil, Trash2, Plus, Minus } from 'lucide-react';
import styles from '../map.module.css';
import { useLanguage } from '../../../context/LanguageContext';

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
  const { t } = useLanguage();

  const tools = [
    { id: 'move',   icon: Hand,   label: t('map.tool.move') },
    { id: 'draw',   icon: Pencil, label: t('map.tool.draw') },
    { id: 'delete', icon: Trash2, label: t('map.tool.delete') },
  ];

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
      <button className={styles.toolBtn} title={t('map.zoom.in')}  onClick={() => map.zoomIn()}><Plus  size={16} /></button>
      <button className={styles.toolBtn} title={t('map.zoom.out')} onClick={() => map.zoomOut()}><Minus size={16} /></button>
    </div>
  );
}
