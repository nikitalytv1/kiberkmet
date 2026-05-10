import { useState } from 'react';
import { Search } from 'lucide-react';
import styles from '../map.module.css';
import { DrawnPolygon } from '../types';

export function ParcelsSidebar({
  parcels,
  selectedId,
  onSelect,
  onColorChange,
}: {
  parcels: DrawnPolygon[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = parcels.filter(p =>
  (p.name ?? '').toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className={styles.parcelsSidebar}>
      <div className={styles.sidebarHeader}>
        <p className={styles.sidebarTitle}>Moje parcele</p>
        <span className={styles.sidebarCount}>{parcels.length}</span>
      </div>

      <div className={styles.sidebarSearch}>
        <Search size={13} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Išči parcelo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.sidebarList}>
        {filtered.map(p => (
          <div
            key={p.id}
            onClick={() => p.id && onSelect(p.id)}
            className={`${styles.sidebarItem} ${selectedId === p.id ? styles.sidebarItemActive : ''}`}
          >
            <div className={styles.sidebarColorBar} style={{ backgroundColor: p.color }} />

            <div className={styles.sidebarItemInfo}>
            <p className={styles.sidebarItemName}>{p.name ?? ''}</p>
              <p className={styles.sidebarItemArea}>{(p as any).area ?? '—'}</p>
            </div>

            <label className={styles.colorPickerWrap} title="Spremeni barvo" onClick={e => e.stopPropagation()}>
              <span className={styles.colorSwatch} style={{ backgroundColor: p.color }} />
              <input
                type="color"
                value={p.color}
                onChange={e => p.id && onColorChange(p.id, e.target.value)}
                className={styles.colorInput}
              />
            </label>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className={styles.sidebarEmpty}>Ni zadetkov.</p>
        )}
      </div>
    </div>
  );
}