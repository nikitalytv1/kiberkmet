import { useState, useEffect, useRef } from 'react';
import { getLandUseTypes } from '../../../api/parcele';
import styles from '../map.module.css';

export function NamePolygonModal({
  color,
  onConfirm,
  onCancel,
}: {
  color: string;
  onConfirm: (name: string, typeOfUse: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [typeOfUse, setTypeOfUse] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    getLandUseTypes().then(t => {
      setTypes(t);
      setTypeOfUse(t[0] ?? '');
    }).catch(() => {
      const fallback = ['Njiva', 'Travnik', 'Vinograd', 'Sadovnjak', 'Gozd', 'Vrt', 'Ostalo'];
      setTypes(fallback);
      setTypeOfUse(fallback[0]);
    });
  }, []);

  const confirm = () => {
    const trimmed = name.trim();
    if (trimmed && typeOfUse) onConfirm(trimmed, typeOfUse);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalDot} style={{ background: color }} />
        <h3 className={styles.modalTitle}>Nova parcela</h3>
        <input
          ref={inputRef}
          className={styles.modalInput}
          placeholder="Ime parcele (npr. Njiva pri gozdu)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <select
          className={styles.modalSelect}
          value={typeOfUse}
          onChange={e => setTypeOfUse(e.target.value)}
        >
          {types.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className={styles.modalActions}>
          <button className={styles.modalBtnCancel} onClick={onCancel}>Prekliči</button>
          <button
            className={styles.modalBtnConfirm}
            style={{ background: color }}
            disabled={!name.trim() || !typeOfUse}
            onClick={confirm}
          >
            Shrani
          </button>
        </div>
      </div>
    </div>
  );
}
