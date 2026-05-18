import { COLORS } from '../types';
import styles from '../map.module.css';

export function ColorPickerPanel({
  selectedColor,
  onPick,
  onCancel,
}: {
  selectedColor: string;
  onPick: (c: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.colorPanel}>
      <div className={styles.colorPanelGrid}>
        {COLORS.map(c => (
          <button
            key={c}
            title={c}
            className={[styles.colorSwatch, c === selectedColor ? styles.colorSwatchActive : ''].join(' ')}
            style={{ backgroundColor: c }}
            onClick={() => onPick(c)}
          />
        ))}
      </div>
      <button className={styles.colorPanelCancel} onClick={onCancel}>Prekliči</button>
    </div>
  );
}