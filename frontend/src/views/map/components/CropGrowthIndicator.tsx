import { useState, useEffect } from 'react';
import styles from '../map.module.css';

interface CropGrowthIndicatorProps {
  plantingDate?: string | null;
  harvestDate?: string | null;
  className?: string;
}

const WHEAT_STAGES = [
  '🌱', // 0-20%: Seme v zemlji
  '🌿', // 20-40%: Kalitev
  '🪴', // 40-60%: Mlada rastlina
  '🌾', // 60-80%: Rast
  '🌽', // 80-100%: Zrela
];

const STAGE_COLORS = [
  '#90EE90', // 0-20%
  '#32CD32', // 20-40%
  '#228B22', // 40-60%
  '#556B2F', // 60-80%
  '#FFA500', // 80-100%
];

export function CropGrowthIndicator({ plantingDate, harvestDate, className }: CropGrowthIndicatorProps) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  if (!plantingDate || !harvestDate) {
    return (
      <div className={`${styles.cropGrowthWrapper} ${className || ''}`}>
        <span className={styles.cropGrowthEmoji} style={{ color: STAGE_COLORS[0] }}>
          {WHEAT_STAGES[0]}
        </span>
        <div className={styles.cropGrowthBar}>
          <div className={styles.cropGrowthBarFill} style={{ '--progress-width': '0%' } as React.CSSProperties} />
        </div>
        <span className={styles.cropGrowthPercent}>0%</span>
      </div>
    );
  }

  const now = new Date();
  const start = new Date(plantingDate);
  const end = new Date(harvestDate);

  // Backend returns UTC dates without timezone, frontend interprets as local (GMT+2)
  // Adjust by adding 2 hours to convert UTC to local time
  start.setHours(start.getHours() + 2);
  end.setHours(end.getHours() + 2);

  if (now < start) {
    return (
      <div className={`${styles.cropGrowthWrapper} ${className || ''}`}>
        <span className={styles.cropGrowthEmoji} style={{ color: STAGE_COLORS[0] }}>
          {WHEAT_STAGES[0]}
        </span>
        <div className={styles.cropGrowthBar}>
          <div className={styles.cropGrowthBarFill} style={{ '--progress-width': '0%' } as React.CSSProperties} />
        </div>
        <span className={styles.cropGrowthPercent}>0%</span>
      </div>
    );
  }

  if (now > end) {
    return (
      <div className={`${styles.cropGrowthWrapper} ${className || ''}`}>
        <span className={styles.cropGrowthEmoji} style={{ color: STAGE_COLORS[4] }}>
          {WHEAT_STAGES[4]}
        </span>
        <div className={styles.cropGrowthBar}>
          <div className={styles.cropGrowthBarFill} style={{ '--progress-width': '100%', background: `linear-gradient(90deg, ${STAGE_COLORS[4]}, ${STAGE_COLORS[4]})` } as React.CSSProperties} />
        </div>
        <span className={styles.cropGrowthPercent}>100%</span>
      </div>
    );
  }

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const stage = Math.min(4, Math.floor(progress / 20));
  const color = STAGE_COLORS[stage];

  return (
    <div className={`${styles.cropGrowthWrapper} ${className || ''}`}>
      <span className={styles.cropGrowthEmoji} style={{ color }}>
        {WHEAT_STAGES[stage]}
      </span>
      <div className={styles.cropGrowthBar}>
        <div
          className={styles.cropGrowthBarFill}
          style={{
            '--progress-width': `${progress}%`,
            background: `linear-gradient(90deg, ${color}, ${STAGE_COLORS[Math.min(stage + 1, 4)]})`,
          } as React.CSSProperties}
        />
      </div>
      <span className={styles.cropGrowthPercent}>
        {progress.toFixed(0)}%
      </span>
    </div>
  );
}
