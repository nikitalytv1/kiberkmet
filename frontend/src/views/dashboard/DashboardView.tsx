import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './dashboard.module.css';
import { ParcelaCard, ParcelaItem } from './ParcelaCard';
import { getParcele, ParcelaAnalysis } from '../../api/parcele';
import { COLORS } from '../map/types';

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
    nitrogen: 100,
    soc: 10,
  };

  return Number((value / (scales[name] ?? 1)).toFixed(2));
}

function getSoilTextureClass(sand: number | null, silt: number | null, clay: number | null) {
  if (sand == null || silt == null || clay == null) return null;
  if (clay >= 40) return 'Glinena tla';
  if (sand >= 70) return 'Peščena tla';
  if (silt >= 70) return 'Meljasta tla';
  if (sand >= 40 && sand <= 60 && clay >= 10 && clay <= 30 && silt >= 20 && silt <= 50) return 'Ilovnata tla';
  if (sand > 55 && clay < 25) return 'Peščeno-ilovnata tla';
  if (clay >= 30 && clay < 40) return 'Glineno-ilovnata tla';
  if (silt >= 50 && clay < 30) return 'Meljasto-ilovnata tla';
  return 'Mešana tekstura tal';
}

function formatHectares(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return undefined;
  return `${new Intl.NumberFormat('sl-SI', { maximumFractionDigits: value < 10 ? 2 : 1 }).format(value)} ha`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(value);
}

function getStatusLabel(warnings: number) {
  if (warnings === 0) return 'V redu';
  if (warnings === 1) return '1 opoz.';
  return `${warnings} opoz.`;
}

function DashboardView() {
  const navigate = useNavigate();
  const [parcele, setParcele] = useState<ParcelaItem[]>([]);
  const [areaValues, setAreaValues] = useState<number[]>([]);

  useEffect(() => {
    getParcele()
      .then(data => {
        setAreaValues(data.map(p => p.areaHectares).filter((value): value is number => value != null));
        setParcele(data.map(p => {
          const ph = getSoilValue(p.analysis, 'phh2o');
          const nitrogen = getSoilValue(p.analysis, 'nitrogen');
          const organicCarbon = getSoilValue(p.analysis, 'soc');
          const sand = getSoilValue(p.analysis, 'sand');
          const silt = getSoilValue(p.analysis, 'silt');
          const clay = getSoilValue(p.analysis, 'clay');
          const water33 = getSoilValue(p.analysis, 'wv0033');
          const warnings = [
            !p.analysis,
            ph != null && (ph < 6 || ph > 7.5),
            nitrogen != null && nitrogen < 1,
            organicCarbon != null && organicCarbon < 10,
            clay != null && clay >= 40,
            sand != null && sand >= 70,
          ].filter(Boolean).length;

          return {
            id: p.id,
            name: p.name || p.gerk_pid || 'Parcela',
            color: p.color ?? COLORS[0],
            kultura: p.typeOfUse ? String(p.typeOfUse) : 'Ostalo',
            area: formatHectares(p.areaHectares),
            ph,
            vlaga: water33,
            tip_tal: getSoilTextureClass(sand, silt, clay),
            status: warnings === 0 ? 'ok' : warnings >= 2 ? 'bad' : 'warn',
            statusLabel: getStatusLabel(warnings),
          };
        }));
      })
      .catch(err => console.error('Napaka pri nalaganju parcel:', err));
  }, []);

  const totalArea = areaValues.reduce((sum, value) => sum + value, 0);
  const phValues = parcele.map(p => p.ph).filter((value): value is number => value != null);
  const warningCount = parcele.filter(p => p.status === 'warn' || p.status === 'bad').length;

  const stats = [
    { label: 'Skupaj parcel', value: parcele.length > 0 ? String(parcele.length) : '-', sub: 'vseh parcel' },
    { label: 'Skupna površina', value: totalArea > 0 ? `${formatNumber(totalArea)} ha` : '-', sub: totalArea > 0 ? 'izrisanih parcel' : 'ni podatka' },
    { label: 'Povprečni pH', value: phValues.length > 0 ? formatNumber(phValues.reduce((sum, value) => sum + value, 0) / phValues.length) : '-', sub: phValues.length > 0 ? `${phValues.length} analiz` : 'ni podatka' },
    { label: 'Opozorila', value: warningCount > 0 ? String(warningCount) : '0', sub: warningCount > 0 ? 'parcel za pregled' : 'brez opozoril' },
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
            <ParcelaCard key={p.id} parcela={p} onClick={() => navigate(`/dashboard/${p.id}`)} />
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardView;
