import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, CalendarDays, CloudRain, Droplets, FlaskConical, Leaf, Sprout } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { analyzeParcela, getParcela, ParcelaAnalysis } from '../../api/parcele';
import { Point } from '../map/types';
import styles from './dashboard.module.css';

type ParcelaDetails = {
  id: string;
  name: string;
  color: string | null;
  gerk_pid?: string | null;
  typeOfUse?: string | number | null;
  pts: Point[];
  analysis?: ParcelaAnalysis | null;
};

type SoilValues = {
  ph: number | null;
  cec: number | null;
  nitrogen: number | null;
  organicCarbon: number | null;
  clay: number | null;
  sand: number | null;
  silt: number | null;
};

type SoilLayer = {
  name: string;
  depths?: {
    label: string;
    values?: {
      mean?: number;
    };
  }[];
};

type WeatherDay = {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  weatherCode: number;
};

const DAY_NAMES_SL = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'];

function weatherIcon(code: number) {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '☁️';
}

function weatherDescription(code: number) {
  if (code === 0) return 'Jasno';
  if (code === 1) return 'Pretežno jasno';
  if (code === 2) return 'Delno oblačno';
  if (code === 3) return 'Oblačno';
  if (code >= 51 && code <= 55) return 'Rosenje';
  if (code >= 56 && code <= 57) return 'Ledeno rosenje';
  if (code >= 61 && code <= 65) return 'Dež';
  if (code >= 66 && code <= 67) return 'Leden dež';
  if (code >= 71 && code <= 75) return 'Sneženje';
  if (code >= 80 && code <= 82) return 'Plohe';
  if (code >= 95) return 'Nevihta';
  return 'Oblačno';
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherDay[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
    `&timezone=Europe/Ljubljana`;

  const res = await fetch(url);
  const json = await res.json();
  const daily = json.daily;

  return (daily.time as string[]).map((date: string, i: number) => {
    const d = new Date(date + 'T00:00:00');
    return {
      date,
      dayName: DAY_NAMES_SL[d.getDay()],
      maxTemp: daily.temperature_2m_max[i],
      minTemp: daily.temperature_2m_min[i],
      precipitation: daily.precipitation_probability_max?.[i] ?? 0,
      weatherCode: daily.weather_code[i],
    };
  });
}

const SOIL_EMPTY: SoilValues = {
  ph: null,
  cec: null,
  nitrogen: null,
  organicCarbon: null,
  clay: null,
  sand: null,
  silt: null,
};

const CROPS = [
  {
    name: 'Pšenica',
    icon: '🌾',
    season: 'Okt - Nov',
    yield: '5.2 t/ha',
    ph: [6, 7.5],
    clay: [10, 35],
    nitrogen: [1.2, 3],
  },
  {
    name: 'Ječmen',
    icon: '🌿',
    season: 'Mar - Apr',
    yield: '4.1 t/ha',
    ph: [6.2, 7.6],
    clay: [8, 32],
    nitrogen: [1, 2.8],
  },
  {
    name: 'Koruza',
    icon: '🌽',
    season: 'Apr - Maj',
    yield: '8.7 t/ha',
    ph: [5.8, 7.2],
    clay: [12, 40],
    nitrogen: [1.4, 3.5],
  },
  {
    name: 'Sončnica',
    icon: '🌻',
    season: 'Apr - Maj',
    yield: '3.0 t/ha',
    ph: [6, 7.8],
    clay: [8, 30],
    nitrogen: [0.8, 2.4],
  },
];

function getCenter(points: Point[]): Point | null {
  if (points.length === 0) return null;
  const sum = points.reduce(
    (acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng] as Point,
    [0, 0] as Point
  );

  return [sum[0] / points.length, sum[1] / points.length];
}

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

function getSoilValue(analysis: ParcelaAnalysis | null, name: string) {
  if (!analysis) return null;

  let source: unknown = analysis.physicalSoil;

  if (['phh2o', 'cec', 'nitrogen', 'soc'].includes(name)) {
    source = analysis.chemicalProperties;
  }

  if (['ocd', 'ocs'].includes(name)) {
    source = analysis.derivedProperties;
  }

  const value = getLayerValue(source, name);
  if (value == null) return null;

  const scales: Record<string, number> = {
    bdod: 100,
    clay: 10,
    sand: 10,
    silt: 10,
    cfvo: 10,
    wv0010: 10,
    wv0033: 10,
    wv1500: 10,
    phh2o: 10,
    cec: 10,
    nitrogen: 100,
    soc: 10,
    ocd: 10,
    ocs: 10,
  };

  return Number((value / (scales[name] ?? 1)).toFixed(2));
}

function getSoilValuesFromAnalysis(analysis: ParcelaAnalysis | null): SoilValues {
  return {
    ph: getSoilValue(analysis, 'phh2o'),
    cec: getSoilValue(analysis, 'cec'),
    nitrogen: getSoilValue(analysis, 'nitrogen'),
    organicCarbon: getSoilValue(analysis, 'soc'),
    clay: getSoilValue(analysis, 'clay'),
    sand: getSoilValue(analysis, 'sand'),
    silt: getSoilValue(analysis, 'silt'),
  };
}

function hasSoilData(soil: SoilValues) {
  return Object.values(soil).some(value => value != null);
}

function formatNumber(value: number | null, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('sl-SI', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function scoreRange(value: number | null, min: number, max: number) {
  if (value == null) return 72;
  if (value >= min && value <= max) return 100;

  const tolerance = (max - min) * 0.75;
  const distance = value < min ? min - value : value - max;
  return Math.max(45, Math.round(100 - (distance / tolerance) * 55));
}

function getCropScores(soil: SoilValues) {
  return CROPS.map(crop => {
    const values = [
      scoreRange(soil.ph, crop.ph[0], crop.ph[1]),
      scoreRange(soil.clay, crop.clay[0], crop.clay[1]),
      scoreRange(soil.nitrogen, crop.nitrogen[0], crop.nitrogen[1]),
    ];
    const score = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

    return { ...crop, score };
  }).sort((a, b) => b.score - a.score);
}

function qualityClass(score: number) {
  if (score >= 80) return styles.compatibilityGood;
  if (score >= 65) return styles.compatibilityWarn;
  return styles.compatibilityBad;
}

function ParcelaView() {
  const { id } = useParams();
  const [parcela, setParcela] = useState<ParcelaDetails | null>(null);
  const [analysis, setAnalysis] = useState<ParcelaAnalysis | null>(null);
  const [soilLoading, setSoilLoading] = useState(false);
  const [soilError, setSoilError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const center = useMemo(() => (parcela ? getCenter(parcela.pts) : null), [parcela]);
  const soil = useMemo(() => getSoilValuesFromAnalysis(analysis), [analysis]);
  const cropScores = useMemo(() => getCropScores(soil), [soil]);
  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);
    setError(null);

    getParcela(id)
      .then(data => {
        if (!active) return;
        setParcela(data);
        setAnalysis(data.analysis ?? null);
      })
      .catch(err => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !center || !parcela) return;

    let active = true;
    setSoilLoading(true);
    setSoilError(null);

    analyzeParcela(id)
      .then(result => {
        if (!active) return;
        setAnalysis(result);

        if (!hasSoilData(getSoilValuesFromAnalysis(result))) {
          setSoilError('SoilGrids za to parcelo ni vrnil meritev. Poskusi parcelo nekoliko premakniti ali povečati.');
        }
      })
      .catch(err => {
        if (!active) return;
        setSoilError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setSoilLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, center, parcela]);

  useEffect(() => {
    if (!center) return;

    let active = true;
    setWeatherLoading(true);

    fetchWeather(center[0], center[1])
      .then(data => {
        if (!active) return;
        setWeather(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
        setWeatherLoading(false);
      });

    return () => {
      active = false;
    };
  }, [center]);

  const soilCards = [
    { label: 'pH tal', value: formatNumber(soil.ph, 1), sub: 'optimalno 6.0-7.5', icon: FlaskConical, ok: soil.ph == null || (soil.ph >= 6 && soil.ph <= 7.5) },
    { label: 'CEC', value: formatNumber(soil.cec, 1), sub: 'cmol(c)/kg', icon: FlaskConical, ok: true },
    { label: 'Dušik (N)', value: `${formatNumber(soil.nitrogen, 2)} g/kg`, sub: 'chemical property', icon: Leaf, ok: soil.nitrogen == null || soil.nitrogen >= 1 },
    { label: 'Org. ogljik', value: `${formatNumber(soil.organicCarbon, 1)} g/kg`, sub: 'chemical property', icon: Sprout, ok: soil.organicCarbon == null || soil.organicCarbon >= 10 },
    { label: 'Glina', value: `${formatNumber(soil.clay, 0)}%`, sub: 'tekstura tal', icon: Droplets, ok: soil.clay == null || soil.clay <= 35 },
    { label: 'Pesek', value: `${formatNumber(soil.sand, 0)}%`, sub: 'tekstura tal', icon: Droplets, ok: true },
  ];

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Nalagam parcelo ...</p>
      </div>
    );
  }

  if (!parcela) {
    return (
      <div className={styles.page}>
        <Link to="/dashboard" className={styles.backLink}><ArrowLeft size={16} /> Nazaj</Link>
        <p className={styles.empty}>{error ?? 'Parcela ni najdena.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <Link to="/dashboard" className={styles.backLink}><ArrowLeft size={16} /> Nazaj</Link>
        <div>
          <p className={styles.detailEyebrow}>Analiza tal</p>
          <h1 className={styles.title}>{parcela.name}</h1>
          <p className={styles.detailSub}>
            SoilGrids · {analysis?.fetchedAt ? new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(analysis.fetchedAt)) : 'analiza se izvaja'}
            {analysis && ` · ${analysis.lat.toFixed(5)}, ${analysis.lon.toFixed(5)}`}
          </p>
        </div>
      </div>

      <div className={styles.detailLayout}>
        <div>
          <section className={styles.analysisPanel}>
            {soilLoading && <p className={styles.panelNotice}>Nalagam SoilGrids vrednosti ...</p>}
            {soilError && <p className={styles.panelNotice}>{soilError}</p>}
            <div className={styles.soilGrid}>
              {soilCards.map(({ label, value, sub, icon: Icon, ok }) => (
                <div key={label} className={styles.soilCard}>
                  <div className={styles.soilCardHeader}>
                    <span className={styles.soilLabel}>{label}</span>
                    <span className={ok ? styles.statusDotOk : styles.statusDotWarn} />
                  </div>
                  <div className={styles.soilValueRow}>
                    <Icon size={18} />
                    <p className={styles.soilValue}>{value}</p>
                  </div>
                  <p className={styles.soilSub}>{sub}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.recommendPanel} style={{ marginTop: 24 }}>
            <div className={styles.recommendHeader}>
              <div>
                <p className={styles.recommendTitle}><Bot size={17} /> AI priporočila — Kaj saditi?</p>
                <p className={styles.recommendSub}>Glede na pH, teksturo, dušik in organski ogljik</p>
              </div>
              <span className={styles.modelBadge}>SoilGrids</span>
            </div>

            <div className={styles.compatibilityList}>
              {cropScores.map(crop => (
                <div key={crop.name} className={styles.compatibilityRow}>
                  <div className={styles.cropIcon}>{crop.icon}</div>
                  <div className={styles.compatibilityBody}>
                    <div className={styles.compatibilityTop}>
                      <p className={styles.cropName}>{crop.name}</p>
                      <span className={`${styles.compatibilityBadge} ${qualityClass(crop.score)}`}>{crop.score}%</span>
                    </div>
                    <div className={styles.compatibilityTrack}>
                      <div
                        className={`${styles.compatibilityFill} ${qualityClass(crop.score)}`}
                        style={{ width: `${crop.score}%` }}
                      />
                    </div>
                    <p className={styles.cropMeta}><CalendarDays size={13} /> {crop.season} · {crop.yield}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.weatherPanel}>
          <div className={styles.weatherHeader}>
            <p className={styles.weatherTitle}>Vreme</p>
          </div>
          <p className={styles.weatherSource}>OpenMeteo · Včeraj–7 dni</p>
          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 16px' }} />

          {weatherLoading && <p className={styles.weatherLoading}>Nalagam vremensko napoved ...</p>}

          {weather.length > 0 && (
            <>
              <div className={styles.weatherCurrent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <span style={{ fontSize: 28 }}>{weatherIcon(weather[0].weatherCode)}</span>
                  <div>
                    <p className={styles.weatherCurrentTemp}>{Math.round(weather[0].maxTemp)}°C</p>
                    <p className={styles.weatherCurrentDesc}>{weatherDescription(weather[0].weatherCode)} · Danes</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className={styles.weatherCurrentRain}>
                    <Droplets size={14} style={{ marginRight: 2, verticalAlign: -2 }} />
                    {weather[0].precipitation}%
                  </p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>dežja</p>
                </div>
              </div>

              {weather.map((day, i) => {
                const pct = day.precipitation;
                const alpha = pct <= 0 ? 0 : Math.min(0.15 + (pct / 100) * 0.85, 1);
                const barColor = pct <= 0
                  ? '#e2e8f0'
                  : `rgba(59, 130, 246, ${alpha})`;

                const dayLabel = i === 0 ? 'Danes' : i === 1 ? 'Jutri' : day.dayName;

                return (
                  <div key={day.date} className={styles.weatherDayRow}>
                    <p className={styles.weatherDayName}>{dayLabel}</p>
                    <span className={styles.weatherDayIcon}>{weatherIcon(day.weatherCode)}</span>
                    <div className={styles.weatherBar}>
                      <div
                        className={styles.weatherBarFill}
                        style={{
                          left: 0,
                          width: `${Math.max(pct, 2)}%`,
                          background: barColor,
                        }}
                      />
                    </div>
                    <p className={styles.weatherDayRain}>{pct}%</p>
                    <p className={styles.weatherDayMax}>{Math.round(day.maxTemp)}°</p>
                    <p className={styles.weatherDayMin}>{Math.round(day.minTemp)}°</p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {error && <p className={styles.empty}>{error}</p>}
    </div>
  );
}

export default ParcelaView;
