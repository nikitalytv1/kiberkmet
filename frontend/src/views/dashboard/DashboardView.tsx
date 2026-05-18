import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './dashboard.module.css';
import { ParcelaCard, ParcelaItem } from './ParcelaCard';
import { getParcele, ParcelaAnalysis } from '../../api/parcele';
import { COLORS } from '../map/types';
import ParcelaBarChart, { BarItem } from './ParcelaBarChart';
import RabaDonutChart, { DonutSlice } from './RabaDonutChart';
import { useLanguage } from '../../context/LanguageContext';

type SoilLayer = {
  name: string;
  depths?: {
    label: string;
    values?: {
      mean?: number;
    };
  }[];
};

function readLayer(layers: SoilLayer[], name: string) {
  const layer = layers.find(item => item.name === name);
  const topDepth = layer?.depths?.find(depth => depth.label === '0-5cm') ?? layer?.depths?.[0];
  return topDepth?.values?.mean ?? null;
}

function getLayerValue(source: unknown, name: string) {
  const feature = source as { properties?: { layers?: SoilLayer[] } } | null;
  const compact = source as Record<string, { mean?: number } | number | null> | null;

  const layerValue = readLayer(feature?.properties?.layers ?? [], name);
  if (layerValue != null) return layerValue;

  const compactValue = compact?.[name];
  if (typeof compactValue === 'number') return compactValue;
  if (compactValue && typeof compactValue === 'object' && typeof compactValue.mean === 'number') {
    return compactValue.mean;
  }

  return null;
}

function getSoilValue(analysis: ParcelaAnalysis | null | undefined, name: string) {
  if (!analysis) return null;

  let source: unknown = analysis.physicalSoil;
  if (['phh2o', 'cec', 'nitrogen', 'soc'].includes(name)) {
    source = analysis.chemicalProperties;
  }

  const value = getLayerValue(source, name);
  if (value == null) return null;

  const scales: Record<string, number> = {
    clay: 10,
    sand: 10,
    silt: 10,
    wv0033: 10,
    phh2o: 10,
    cec: 10,
    nitrogen: 100,
    soc: 10,
  };

  return Number((value / (scales[name] ?? 1)).toFixed(2));
}

type SoilTextureKey = 'soil.clay' | 'soil.sand' | 'soil.silt' | 'soil.loam' | 'soil.sandyLoam' | 'soil.clayLoam' | 'soil.siltyLoam' | 'soil.mixed';

function getSoilTextureKey(sand: number | null, silt: number | null, clay: number | null): SoilTextureKey | null {
  if (sand == null || silt == null || clay == null) return null;
  if (clay >= 40) return 'soil.clay';
  if (sand >= 70) return 'soil.sand';
  if (silt >= 70) return 'soil.silt';
  if (sand >= 40 && sand <= 60 && clay >= 10 && clay <= 30 && silt >= 20 && silt <= 50) return 'soil.loam';
  if (sand > 55 && clay < 25) return 'soil.sandyLoam';
  if (clay >= 30 && clay < 40) return 'soil.clayLoam';
  if (silt >= 50 && clay < 30) return 'soil.siltyLoam';
  return 'soil.mixed';
}

function formatHectares(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return undefined;
  return `${new Intl.NumberFormat('sl-SI', { maximumFractionDigits: value < 10 ? 2 : 1 }).format(value)} ha`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(value);
}

type StatusLabelKey = 'dashboard.status.ok' | 'dashboard.status.warn';

function getStatusLabelKey(warnings: number): { key: StatusLabelKey; count?: number } {
  if (warnings === 0) return { key: 'dashboard.status.ok' };
  return { key: 'dashboard.status.warn', count: warnings };
}

function outsideRange(value: number | null, min: number, max: number) {
  return value != null && (value < min || value > max);
}

function DashboardView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [parcele, setParcele] = useState<ParcelaItem[]>([]);
  const [barItems, setBarItems] = useState<BarItem[]>([]);
  const [donutSlices, setDonutSlices] = useState<DonutSlice[]>([]);
  const [areaValues, setAreaValues] = useState<number[]>([]);

  useEffect(() => {
    getParcele()
      .then(data => {
        setAreaValues(data.map(p => p.areaHectares).filter((value): value is number => value != null));
        const rabaMap = new Map<string, number>();
        data.forEach(p => {
          const key = String(p.typeOfUse || 'Ostalo');
          rabaMap.set(key, (rabaMap.get(key) ?? 0) + (p.areaHectares ?? 0));
        });
        setDonutSlices(
          Array.from(rabaMap.entries())
            .map(([label, area]) => ({ label, area }))
            .sort((a, b) => b.area - a.area)
        );

        setBarItems(data.map(p => ({
          id: p.id,
          name: String(p.name || p.gerk_pid || 'Parcela'),
          color: p.color ?? COLORS[0],
          ph: getSoilValue(p.analysis, 'phh2o'),
          area: p.areaHectares ?? null,
        })));
        setParcele(data.map(p => {
          const ph = getSoilValue(p.analysis, 'phh2o');
          const cec = getSoilValue(p.analysis, 'cec');
          const nitrogen = getSoilValue(p.analysis, 'nitrogen');
          const organicCarbon = getSoilValue(p.analysis, 'soc');
          const sand = getSoilValue(p.analysis, 'sand');
          const silt = getSoilValue(p.analysis, 'silt');
          const clay = getSoilValue(p.analysis, 'clay');
          const water33 = getSoilValue(p.analysis, 'wv0033');
          const warnings = [
            outsideRange(ph, 6, 7.5),
            outsideRange(cec, 10, 25),
            outsideRange(nitrogen, 1, 3),
            organicCarbon != null && organicCarbon < 10,
            outsideRange(clay, 10, 35),
            outsideRange(sand, 20, 60),
          ].filter(Boolean).length;
          const status = !p.analysis
            ? 'pending'
            : warnings === 0
              ? 'ok'
              : warnings >= 2
                ? 'bad'
                : 'warn';

          const soilKey = getSoilTextureKey(sand, silt, clay);
          const statusLabelInfo = getStatusLabelKey(warnings);
          return {
            id: p.id,
            name: p.name || p.gerk_pid || 'Parcela',
            color: p.color ?? COLORS[0],
            kultura: p.typeOfUse ? String(p.typeOfUse) : 'Ostalo',
            area: formatHectares(p.areaHectares),
            ph,
            vlaga: water33,
            tip_tal: soilKey ? t(soilKey) : null,
            status,
            statusLabel: !p.analysis
              ? t('dashboard.analysis.running')
              : statusLabelInfo.count != null
                ? `${statusLabelInfo.count} ${t(statusLabelInfo.key)}`
                : t(statusLabelInfo.key),
          };
        }));
      })
      .catch(err => console.error(t('dashboard.error.load'), err));
  }, [t]);

  const totalArea = areaValues.reduce((sum, value) => sum + value, 0);
  const phValues = parcele.map(p => p.ph).filter((value): value is number => value != null);
  const warningCount = parcele.filter(p => p.status === 'warn' || p.status === 'bad').length;

  const stats = [
    { label: t('dashboard.stat.totalParcels'), value: parcele.length > 0 ? String(parcele.length) : '-', sub: t('dashboard.stat.totalParcels.sub') },
    { label: t('dashboard.stat.totalArea'), value: totalArea > 0 ? `${formatNumber(totalArea)} ha` : '-', sub: totalArea > 0 ? t('dashboard.stat.totalArea.sub') : t('dashboard.stat.noData') },
    { label: t('dashboard.stat.avgPh'), value: phValues.length > 0 ? formatNumber(phValues.reduce((sum, value) => sum + value, 0) / phValues.length) : '-', sub: phValues.length > 0 ? `${phValues.length} ${t('dashboard.stat.avgPh.sub')}` : t('dashboard.stat.noData') },
    { label: t('dashboard.stat.warnings'), value: warningCount > 0 ? String(warningCount) : '0', sub: warningCount > 0 ? t('dashboard.stat.warnings.sub') : t('dashboard.stat.noWarnings') },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('dashboard.title')}</h1>

      <div className={styles.statsGrid}>
        {stats.map(({ label, value, sub }) => (
          <div key={label} className={styles.statCard}>
            <p className={styles.statLabel}>{label}</p>
            <p className={styles.statValue}>{value}</p>
            <p className={styles.statSub}>{sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {donutSlices.length > 0 && (
          <div className={styles.statCard} style={{ padding: '20px 22px', flex: 1, minWidth: 0 }}>
            <p className={styles.statLabel} style={{ marginBottom: 14 }}>{t('dashboard.chart.landUse')}</p>
            <RabaDonutChart slices={donutSlices} />
          </div>
        )}

        {barItems.length > 1 && (
          <div className={styles.statCard} style={{ padding: '20px 22px', flex: 1, minWidth: 0 }}>
            <p className={styles.statLabel} style={{ marginBottom: 14 }}>{t('dashboard.chart.comparison')}</p>
            <ParcelaBarChart items={barItems} onClickItem={id => navigate(`/dashboard/${id}`)} />
          </div>
        )}
      </div>


      <div className={styles.parceleGrid} style={{ marginTop: 20 }}>
        {parcele.length === 0 ? (
          <p className={styles.empty}>{t('dashboard.empty')}</p>
        ) : (
          parcele.map(p => (
            <ParcelaCard key={p.id} parcela={p} onClick={() => navigate(`/dashboard/${p.id}`)} />
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardView;
