import { useState, useEffect, useRef } from 'react';
import styles from '../map.module.css';

export function NamePolygonModal({
  color,
  onConfirm,
  onCancel,
}: {
  color: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const confirm = () => {
    const trimmed = name.trim();
    if (trimmed) onConfirm(trimmed);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalDot} style={{ background: color }} />
        <h3 className={styles.modalTitle}>Ime parcele</h3>
        <input
          ref={inputRef}
          className={styles.modalInput}
          placeholder="npr. Njiva pri gozdu"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className={styles.modalActions}>
          <button className={styles.modalBtnCancel} onClick={onCancel}>Prekliči</button>
          <button
            className={styles.modalBtnConfirm}
            style={{ background: color }}
            disabled={!name.trim()}
            onClick={confirm}
          >
            Shrani
          </button>
        </div>
      </div>
    </div>
  );
}