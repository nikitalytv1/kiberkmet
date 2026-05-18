import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPinned } from 'lucide-react';
import styles from './dashboard.module.css';
import { ParcelaCard, ParcelaItem } from './ParcelaCard';
import { ParcelaAnalysis } from '../../api/parcele';
import { getRegionParcele, getStatisticalRegions, prefetchRegionParcele, StatisticalRegion } from '../../api/regions';
import { COLORS } from '../map/types';
import ParcelaBarChart, { BarItem } from './ParcelaBarChart';
import RabaDonutChart, { DonutSlice } from './RabaDonutChart';
import SursYieldHistoryChart, { SursYieldStats } from './SursYieldHistoryChart';
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

function RegionDashboardView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { regionCode = '08' } = useParams();
  const normalizedRegionCode = regionCode.padStart(2, '0');
  const [regions, setRegions] = useState<StatisticalRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<StatisticalRegion | null>(null);
  const [parcele, setParcele] = useState<ParcelaItem[]>([]);
  const [barItems, setBarItems] = useState<BarItem[]>([]);
  const [donutSlices, setDonutSlices] = useState<DonutSlice[]>([]);
  const [yieldStats, setYieldStats] = useState<SursYieldStats[]>([]);
  const [areaValues, setAreaValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStatisticalRegions()
      .then(data => {
        setRegions(data);
        data.forEach(region => {
          if (region.code !== normalizedRegionCode) prefetchRegionParcele(region.code);
        });
      })
      .catch(err => setError(err.message));
  }, [normalizedRegionCode]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getRegionParcele(normalizedRegionCode)
      .then(data => {
        if (!active) return;

        setSelectedRegion(data.region);
        setYieldStats(data.yieldStats ?? []);
        setAreaValues(data.parcele.map(p => p.areaHectares).filter((value): value is number => value != null));

        const rabaMap = new Map<string, number>();
        data.parcele.forEach(p => {
          const key = String(p.typeOfUse || 'Ostalo');
          rabaMap.set(key, (rabaMap.get(key) ?? 0) + (p.areaHectares ?? 0));
        });
        setDonutSlices(
          Array.from(rabaMap.entries())
            .map(([label, area]) => ({ label, area }))
            .sort((a, b) => b.area - a.area)
        );

        setBarItems(data.parcele.map(p => ({
          id: p.id,
          name: String(p.name || p.gerk_pid || 'Parcela'),
          color: p.color ?? COLORS[0],
          ph: getSoilValue(p.analysis, 'phh2o'),
          area: p.areaHectares ?? null,
        })));

        setParcele(data.parcele.map(p => {
          const ph = getSoilValue(p.analysis, 'phh2o');
          const sand = getSoilValue(p.analysis, 'sand');
          const silt = getSoilValue(p.analysis, 'silt');
          const clay = getSoilValue(p.analysis, 'clay');
          const water33 = getSoilValue(p.analysis, 'wv0033');

          const soilKey = getSoilTextureKey(sand, silt, clay);
          return {
            id: p.id,
            name: p.typeOfUse ? String(p.typeOfUse) : 'Parcela',
            color: p.color ?? COLORS[0],
            kultura: p.name || p.gerk_pid || 'Brez imena',
            area: formatHectares(p.areaHectares),
            ph,
            vlaga: water33,
            tip_tal: soilKey ? t(soilKey) : null,
          };
        }));
      })
      .catch(err => {
        if (!active) return;
        setError(err.message);
        setSelectedRegion(null);
        setParcele([]);
        setBarItems([]);
        setDonutSlices([]);
        setYieldStats([]);
        setAreaValues([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [normalizedRegionCode]);

  const totalArea = areaValues.reduce((sum, value) => sum + value, 0);
  const phValues = parcele.map(p => p.ph).filter((value): value is number => value != null);

  const stats = [
    { label: t('region.stat.totalParcels'), value: loading ? '-' : String(parcele.length), sub: selectedRegion?.name ?? t('region.stat.region') },
    { label: t('region.stat.totalArea'), value: totalArea > 0 ? `${formatNumber(totalArea)} ha` : '-', sub: totalArea > 0 ? t('region.stat.totalArea.sub') : t('region.stat.noData') },
    { label: t('region.stat.avgPh'), value: phValues.length > 0 ? formatNumber(phValues.reduce((sum, value) => sum + value, 0) / phValues.length) : '-', sub: phValues.length > 0 ? `${phValues.length} ${t('region.stat.avgPh.sub')}` : t('region.stat.noData') },
  ];

  const regionOptions = useMemo(() => (
    regions.length > 0 ? regions : [{ code: normalizedRegionCode, name: selectedRegion?.name ?? 'Regija' }]
  ), [regions, normalizedRegionCode, selectedRegion?.name]);

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div>
          <p className={styles.detailEyebrow}>{t('region.eyebrow')}</p>
          <h1 className={styles.title}>{selectedRegion?.name ?? t('region.title')}</h1>
        </div>

        <select
          value={normalizedRegionCode}
          onChange={event => navigate(`/regions/${event.target.value}`)}
          style={{
            minWidth: 240,
            height: 42,
            border: '1px solid #dbe5df',
            borderRadius: 8,
            padding: '0 12px',
            background: '#ffffff',
            color: '#12382d',
            fontWeight: 700,
          }}
        >
          {regionOptions.map(region => (
            <option key={region.code} value={region.code}>{region.name}</option>
          ))}
        </select>
      </div>

      {error && <p className={styles.panelNotice}>{error}</p>}

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
            <p className={styles.statLabel} style={{ marginBottom: 14 }}>{t('region.chart.landUse')}</p>
            <RabaDonutChart slices={donutSlices} />
          </div>
        )}

        {barItems.length > 1 && (
          <div className={styles.statCard} style={{ padding: '20px 22px', flex: 1, minWidth: 0 }}>
            <p className={styles.statLabel} style={{ marginBottom: 14 }}>{t('region.chart.comparison')}</p>
            <ParcelaBarChart items={barItems} onClickItem={() => {}} />
          </div>
        )}
      </div>

      <section className={styles.chartPanel} style={{ marginTop: 0 }}>
        <div className={styles.chartHeader}>
          <div>
            <p className={styles.chartTitle}>{t('region.chart.history')}</p>
            <p className={styles.chartSub}>{t('region.chart.history.sub')}</p>
          </div>
        </div>
        <div className={styles.chartBox} style={{ height: 340 }}>
          <SursYieldHistoryChart stats={yieldStats} />
        </div>
      </section>


      <div className={styles.parceleGrid} style={{ marginTop: 0 }}>
        {loading ? (
          <p className={styles.empty}>{t('region.loading')}</p>
        ) : parcele.length === 0 ? (
          <div className={styles.regionEmptyState}>
            <div className={styles.regionEmptyIcon}>
              <MapPinned size={24} />
            </div>
            <div>
              <p className={styles.regionEmptyTitle}>{t('region.empty.title')}</p>
              <p className={styles.regionEmptyText}>{t('region.empty.text')}</p>
            </div>
          </div>
        ) : (
          parcele.map(p => (
            <ParcelaCard key={p.id} parcela={p} />
          ))
        )}
      </div>

    </div>
  );
}

export default RegionDashboardView;
