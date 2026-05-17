import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Search } from 'lucide-react';
import styles from '../map.module.css';
import { DrawnPolygon } from '../types';
import { useLanguage } from '../../../context/LanguageContext';

export function ParcelsSidebar({
  parcels,
  selectedId,
  onSelect,
  onColorChange,
  onRename,
}: {
  parcels: DrawnPolygon[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = parcels.filter(p =>
    (p.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(p: DrawnPolygon, e: React.MouseEvent) {
    e.stopPropagation();
    if (!p.id) return;
    setEditingId(p.id);
    setEditValue(p.name ?? '');
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit(id: string) {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== parcels.find(p => p.id === id)?.name) {
      onRename(id, trimmed);
    }
    setEditingId(null);
  }

  function handleKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(id); }
    if (e.key === 'Escape') { setEditingId(null); }
  }

  return (
    <div className={styles.parcelsSidebar}>
      <div className={styles.sidebarHeader}>
        <p className={styles.sidebarTitle}>{t('map.sidebar.title')}</p>
        <span className={styles.sidebarCount}>{parcels.length}</span>
      </div>

      <div className={styles.sidebarSearch}>
        <Search size={13} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder={t('map.sidebar.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.sidebarList}>
        {filtered.map(p => (
          <div
            key={p.id}
            onClick={() => { if (editingId !== p.id && p.id) onSelect(p.id); }}
            onDoubleClick={() => { if (editingId !== p.id && p.id) navigate(`/dashboard/${p.id}`); }}
            className={`${styles.sidebarItem} ${selectedId === p.id ? styles.sidebarItemActive : ''}`}
          >
            <div className={styles.sidebarColorBar} style={{ backgroundColor: p.color }} />

            <div className={styles.sidebarItemInfo}>
              {editingId === p.id ? (
                <input
                  ref={inputRef}
                  className={styles.sidebarRenameInput}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(p.id!)}
                  onKeyDown={e => handleKeyDown(e, p.id!)}
                  onClick={e => e.stopPropagation()}
                  onDoubleClick={e => e.stopPropagation()}
                />
              ) : (
                <p className={styles.sidebarItemName}>{p.name ?? ''}</p>
              )}

              <p className={styles.sidebarItemArea}>
                {p.areaHectares != null ? `${p.areaHectares.toFixed(2)} ha` : '-'}
              </p>

              <div className={styles.cropSummary}>
                <span className={styles.cropSummaryText}>
                  {p.cropPlans?.length
                    ? p.cropPlans.map(plan => `${plan.cropName} ${Math.round(plan.areaPercent)}%`).join(', ')
                    : p.plannedCropName || p.plannedCropPercent != null
                      ? `${p.plannedCropName ?? t('map.sidebar.noCrops')} ${p.plannedCropPercent ?? 0}%`
                      : t('map.sidebar.noCrops')}
                </span>
              </div>
            </div>

            {editingId !== p.id && (
              <button
                className={styles.renameBtn}
                title={t('map.sidebar.rename')}
                onClick={e => startEdit(p, e)}
              >
                <Pencil size={11} />
              </button>
            )}

            <label className={styles.colorPickerWrap} title={t('map.sidebar.colorChange')} onClick={e => e.stopPropagation()}>
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
          <p className={styles.sidebarEmpty}>{t('map.sidebar.empty')}</p>
        )}
      </div>
    </div>
  );
}
