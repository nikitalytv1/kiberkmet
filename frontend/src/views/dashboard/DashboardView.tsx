import { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import { ParcelaCard, ParcelaItem } from './ParcelaCard';
import { getParcele } from '../../api/parcele';
import { COLORS } from '../map/types';

function DashboardView() {
  const [parcele, setParcele] = useState<ParcelaItem[]>([]);

  useEffect(() => {
    getParcele().then(data => {
      setParcele(data.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color ?? COLORS[0],
      })));
    }).catch(err => console.error('Napaka pri nalaganju parcel:', err));
  }, []);

  const stats = [
    { label: 'Skupaj parcel', value: parcele.length > 0 ? String(parcele.length) : '—', sub: 'vseh parcel' },
    { label: 'Skupna površina', value: '—', sub: 'ni podatka' },
    { label: 'Povprečni pH', value: '—', sub: 'ni podatka' },
    { label: 'Opozorila', value: '—', sub: 'ni podatka' },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Moje parcele</h1>

      <div className={styles.statsGrid}>
        {stats.map(({ label, value, sub }) => (
          <div key={label} className={styles.statCard}>
            <p className={styles.statLabel}>{label}</p>
            <p className={styles.statValue}>{value}</p>
            <p className={styles.statSub}>{sub}</p>
          </div>
        ))}
      </div>

      <div className={styles.parceleGrid}>
        {parcele.length === 0 ? (
          <p className={styles.empty}>Ni še nobene parcele. Nariši jo na zemljevidu.</p>
        ) : (
          parcele.map(p => (
            <ParcelaCard key={p.id} parcela={p} onClick={() => { }} />
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardView;
