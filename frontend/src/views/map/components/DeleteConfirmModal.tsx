import styles from '../map.module.css';

export function DeleteConfirmModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>Izbriši parcelo</h3>
        <p className={styles.modalText}>
          Ste prepričani, da želite izbrisati <strong>{name}</strong>?
        </p>
        <div className={styles.modalActions}>
          <button className={styles.modalBtnCancel} onClick={onCancel}>Ne</button>
          <button className={styles.modalBtnDelete} onClick={onConfirm}>Da, izbriši</button>
        </div>
      </div>
    </div>
  );
}