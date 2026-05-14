import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './dashboard.module.css';
import { ParcelaCard, ParcelaItem } from './ParcelaCard';
import { ParcelaAnalysis } from '../../api/parcele';
import { getRegionParcele, getStatisticalRegions, StatisticalRegion } from '../../api/regions';
import { COLORS } from '../map/types';
import ParcelaBarChart, { BarItem } from './ParcelaBarChart';
import RabaDonutChart, { DonutSlice } from './RabaDonutChart';
import SursYieldHistoryChart, { SursYieldStats } from './SursYieldHistoryChart';

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

function getSoilTextureClass(sand: number | null, silt: number | null, clay: number | null) {
  if (sand == null || silt == null || clay == null) return null;
  if (clay >= 40) return 'Glinena tla';
  if (sand >= 70) return 'Pescena tla';
  if (silt >= 70) return 'Meljasta tla';
  if (sand >= 40 && sand <= 60 && clay >= 10 && clay <= 30 && silt >= 20 && silt <= 50) return 'Ilovnata tla';
  if (sand > 55 && clay < 25) return 'Pesceno-ilovnata tla';
  if (clay >= 30 && clay < 40) return 'Glineno-ilovnata tla';
  if (silt >= 50 && clay < 30) return 'Meljasto-ilovnata tla';
  return 'Mesana tekstura tal';
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
      .then(setRegions)
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getRegionParcele(normalizedRegionCode)
      .then(data => {
        if (!active) return;

        setSelectedRegion(data.region);
        setYieldStats(
          data.parcele
            .map(p => p.sursYieldStats)
            .filter((value): value is SursYieldStats => value != null)
        );
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

          return {
            id: p.id,
            name: p.typeOfUse ? String(p.typeOfUse) : 'Parcela',
            color: p.color ?? COLORS[0],
            kultura: p.name || p.gerk_pid || 'Brez imena',
            area: formatHectares(p.areaHectares),
            ph,
            vlaga: water33,
            tip_tal: getSoilTextureClass(sand, silt, clay),
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
    { label: 'Skupaj parcel', value: loading ? '-' : String(parcele.length), sub: selectedRegion?.name ?? 'statisticna regija' },
    { label: 'Skupna povrsina', value: totalArea > 0 ? `${formatNumber(totalArea)} ha` : '-', sub: totalArea > 0 ? 'izrisanih parcel' : 'ni podatka' },
    { label: 'Povprecni pH', value: phValues.length > 0 ? formatNumber(phValues.reduce((sum, value) => sum + value, 0) / phValues.length) : '-', sub: phValues.length > 0 ? `${phValues.length} analiz` : 'ni podatka' },
  ];

  const regionOptions = useMemo(() => (
    regions.length > 0 ? regions : [{ code: normalizedRegionCode, name: selectedRegion?.name ?? 'Regija' }]
  ), [regions, normalizedRegionCode, selectedRegion?.name]);

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div>
          <p className={styles.detailEyebrow}>Statistična regija</p>
          <h1 className={styles.title}>{selectedRegion?.name ?? 'Regijski dashboard'}</h1>
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
            <p className={styles.statLabel} style={{ marginBottom: 14 }}>Porazdelitev tipov rabe tal</p>
            <RabaDonutChart slices={donutSlices} />
          </div>
        )}

        {barItems.length > 1 && (
          <div className={styles.statCard} style={{ padding: '20px 22px', flex: 1, minWidth: 0 }}>
            <p className={styles.statLabel} style={{ marginBottom: 14 }}>Primerjava parcel v regiji</p>
            <ParcelaBarChart items={barItems} onClickItem={() => {}} />
          </div>
        )}
      </div>

      <section className={styles.chartPanel} style={{ marginTop: 0 }}>
        <div className={styles.chartHeader}>
          <div>
            <p className={styles.chartTitle}>Zgodovinski pridelek</p>
            <p className={styles.chartSub}>
              SURS donos po letih za kulture v izbrani statistični regiji, z napovedjo naslednjega leta
            </p>
          </div>
        </div>
        <div className={styles.chartBox} style={{ height: 340 }}>
          <SursYieldHistoryChart stats={yieldStats} />
        </div>
      </section>


      <div className={styles.parceleGrid} style={{ marginTop: 0 }}>
        {loading ? (
          <p className={styles.empty}>Nalagam parcele v regiji ...</p>
        ) : parcele.length === 0 ? (
          <p className={styles.empty}>V tej statistični regiji ni parcel.</p>
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
