import styles from './dashboard.module.css';

export interface ParcelaItem {
  id: string;
  name: string;
  color: string;
  kultura?: string;
  area?: string;
  owner?: string | null;
  ph?: number | null;
  vlaga?: number | null;
  tip_tal?: string | null;
  status?: 'ok' | 'warn' | 'bad' | 'pending';
  statusLabel?: string;
}

export function ParcelaCard({ parcela, onClick }: { parcela: ParcelaItem; onClick?: () => void }) {
  const dash = '—';
  return (
    <div
      className={styles.parcelaCard}
      onClick={onClick}
      style={!onClick ? { cursor: 'default' } : undefined}
    >
      <div className={styles.colorBar} style={{ backgroundColor: parcela.color }} />
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <p className={styles.cardName}>{parcela.name}</p>
          {parcela.statusLabel ? (
            <span className={`${styles.statusBadge} ${parcela.status === 'bad' ? styles.statusBad : parcela.status === 'warn' || parcela.status === 'pending' ? styles.statusWarn : styles.statusOk}`}>
              {parcela.statusLabel}
            </span>
          ) : null}
        </div>

        <div className={styles.cardMeta}>
          <span>{parcela.area ?? dash}</span>
          <span className={styles.dot} />
          <span>{parcela.kultura ?? dash}</span>
          {parcela.owner ? (
            <>
              <span className={styles.dot} />
              <span>{parcela.owner}</span>
            </>
          ) : null}
        </div>

        <div className={styles.miniGrid}>
          {[
            { label: 'pH', value: parcela.ph != null ? parcela.ph : dash },
            { label: 'Vlaga', value: parcela.vlaga != null ? `${parcela.vlaga}%` : dash },
            { label: 'Tip tal', value: parcela.tip_tal ?? dash },
          ].map(({ label, value }) => (
            <div key={label} className={styles.miniCell}>
              <p className={styles.miniLabel}>{label}</p>
              <p className={styles.miniValue}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
