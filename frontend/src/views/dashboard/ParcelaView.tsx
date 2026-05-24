import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, CalendarDays, Droplets, FlaskConical, Leaf, Pencil, Plus, Sprout, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { analyzeParcela, createCropPlan, deleteCropPlan, getParcela, updateCropPlan, updateParcela, ParcelaAnalysis, CropPlan } from '../../api/parcele';
import { getParcelaYieldStats, getRegionalTopCrops, SursYieldStat, TopCropsResponse } from '../../api/statistics';
import { Point } from '../map/types';
import { CROPS, getCompanionCropNames, getTechnologicalYield } from '../../data/crops';
import styles from './dashboard.module.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type ParcelaDetails = {
  id: string;
  name: string;
  color: string | null;
  gerk_pid?: string | null;
  typeOfUse?: string | number | null;
  areaHectares?: number | null;
  pts: Point[];
  analysis?: ParcelaAnalysis | null;
  cropPlans?: CropPlan[];
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
  dayName: typeof DAY_KEYS[number];
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  weatherCode: number;
};

const DAY_KEYS = ['day.sun', 'day.mon', 'day.tue', 'day.wed', 'day.thu', 'day.fri', 'day.sat'] as const;

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

type WeatherDescKey = 'weather.clear' | 'weather.mainlyClear' | 'weather.partlyCloudy' | 'weather.cloudy' | 'weather.drizzle' | 'weather.freezingDrizzle' | 'weather.rain' | 'weather.freezingRain' | 'weather.snow' | 'weather.showers' | 'weather.thunderstorm';

function weatherDescriptionKey(code: number): WeatherDescKey {
  if (code === 0) return 'weather.clear';
  if (code === 1) return 'weather.mainlyClear';
  if (code === 2) return 'weather.partlyCloudy';
  if (code === 3) return 'weather.cloudy';
  if (code >= 51 && code <= 55) return 'weather.drizzle';
  if (code >= 56 && code <= 57) return 'weather.freezingDrizzle';
  if (code >= 61 && code <= 65) return 'weather.rain';
  if (code >= 66 && code <= 67) return 'weather.freezingRain';
  if (code >= 71 && code <= 75) return 'weather.snow';
  if (code >= 80 && code <= 82) return 'weather.showers';
  if (code >= 95) return 'weather.thunderstorm';
  return 'weather.cloudy';
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
      dayName: DAY_KEYS[d.getDay()],
      maxTemp: daily.temperature_2m_max[i],
      minTemp: daily.temperature_2m_min[i],
      precipitation: daily.precipitation_probability_max?.[i] ?? 0,
      weatherCode: daily.weather_code[i],
    };
  });
}



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

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('sl-SI', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatMassKg(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '-';
  if (value >= 1000) return `${formatNumber(value / 1000, 2)} t`;
  return `${formatNumber(value, 1)} kg`;
}

function normalizeCropName(value: string) {
  return value.trim().toLowerCase();
}

function getSursYieldForCrop(cropName: string, stats: SursYieldStat[]) {
  const crop = CROPS.find(item => normalizeCropName(item.name) === normalizeCropName(cropName));
  const allowedNames = crop?.sursCropNames ?? [cropName.trim()];
  const normalizedAllowedNames = allowedNames.map(normalizeCropName);

  return stats.find(stat => normalizedAllowedNames.includes(normalizeCropName(stat.cropName))) ?? null;
}

function getYieldSourceForCrop(cropName: string, stats: SursYieldStat[]) {
  const yieldStat = getSursYieldForCrop(cropName, stats);
  if (yieldStat?.latest?.value != null && Number.isFinite(yieldStat.latest.value)) {
    return {
      tonsPerHa: yieldStat.latest.value,
      label: `SURS ${yieldStat.latest.year}`,
      detail: `${formatNumber(yieldStat.latest.value, 1)} ${yieldStat.unit}`,
    };
  }

  const technologicalYield = getTechnologicalYield(cropName);
  if (technologicalYield) {
    return {
      tonsPerHa: technologicalYield.tonsPerHa,
      label: 'Tehnološki donos',
      detail: `${formatNumber(technologicalYield.tonsPerHa, 1)} t/ha`,
    };
  }

  return null;
}

function getPlantedAmountFactor(plan: CropPlan, plantedAreaHa: number) {
  if (!plan.plantedAmountKg || plan.plantedAmountKg <= 0 || plantedAreaHa <= 0) return 1;

  const crop = CROPS.find(item => normalizeCropName(item.name) === normalizeCropName(plan.cropName));
  if (!crop?.seedRateKgPerHa) return 1;

  const [minRate, maxRate] = crop.seedRateKgPerHa;
  const optimalMinKg = plantedAreaHa * minRate;
  const optimalMaxKg = plantedAreaHa * maxRate;

  if (plan.plantedAmountKg < optimalMinKg) {
    return Math.max(0.35, plan.plantedAmountKg / optimalMinKg);
  }

  if (plan.plantedAmountKg > optimalMaxKg) {
    const overRatio = (plan.plantedAmountKg - optimalMaxKg) / optimalMaxKg;
    return Math.max(0.75, 1 - overRatio * 0.35);
  }

  return 1;
}

function getExpectedHarvestKg(plan: CropPlan, areaHectares: number | null | undefined, yieldStats: SursYieldStat[]) {
  if (!areaHectares) return null;
  const yieldSource = getYieldSourceForCrop(plan.cropName, yieldStats);
  if (!yieldSource) return null;

  const plantedAreaHa = areaHectares * (plan.areaPercent / 100);
  const plantedAmountFactor = getPlantedAmountFactor(plan, plantedAreaHa);
  return plantedAreaHa * yieldSource.tonsPerHa * 1000 * plantedAmountFactor;
}

function getPlantedAmountNote(plan: CropPlan, areaHectares: number | null | undefined) {
  if (!areaHectares) return null;
  const plantedAreaHa = areaHectares * (plan.areaPercent / 100);
  const factor = getPlantedAmountFactor(plan, plantedAreaHa);
  if (factor >= 0.995) return null;

  return `${Math.round(factor * 100)}% zaradi količine`;
}

function formatSursYieldLabel(cropName: string, yieldStats: SursYieldStat[]) {
  const yieldSource = getYieldSourceForCrop(cropName, yieldStats);
  if (!yieldSource) return 'Donos: ni podatka';

  return `${yieldSource.label}: ${yieldSource.detail}`;
}

function scoreRange(value: number | null, min: number, max: number) {
  if (value == null) return 72;
  if (value >= min && value <= max) return 100;

  const tolerance = (max - min) * 0.75;
  const distance = value < min ? min - value : value - max;
  return Math.min(79, Math.max(45, Math.round(100 - (distance / tolerance) * 55)));
}

function scoreMinimum(value: number | null, min: number) {
  if (value == null) return 72;
  if (value >= min) return 100;

  return Math.min(79, Math.max(45, Math.round(100 - ((min - value) / min) * 55)));
}

function getWeatherScore(weather: WeatherDay[], crop: typeof CROPS[number]) {
  if (weather.length === 0) return 72;

  const nextDays = weather.slice(0, 3);
  const avgTemp = nextDays.reduce((sum, day) => (
    sum + ((day.minTemp + day.maxTemp) / 2)
  ), 0) / nextDays.length;
  const maxPrecipitation = Math.max(...nextDays.map(day => day.precipitation));

  const temperatureScore = scoreRange(avgTemp, crop.temp[0], crop.temp[1]);
  const rainScore = maxPrecipitation <= crop.precipitationMax
    ? 100
    : Math.max(40, 100 - (maxPrecipitation - crop.precipitationMax));

  return Math.round((temperatureScore * 0.65) + (rainScore * 0.35));
}

function getCropsForLandUse(typeOfUse?: string | number | null) {
  const normalizedType = String(typeOfUse || '').trim();
  const matchingCrops = CROPS.filter(crop => crop.uses.includes(normalizedType));

  return matchingCrops.length > 0 ? matchingCrops : CROPS;
}

function getCropScores(soil: SoilValues, weather: WeatherDay[], typeOfUse?: string | number | null) {
  return getCropsForLandUse(typeOfUse).map(crop => {
    const weatherScore = getWeatherScore(weather, crop);
    const values = [
      scoreRange(soil.ph, crop.ph[0], crop.ph[1]),
      scoreRange(soil.clay, crop.clay[0], crop.clay[1]),
      scoreRange(soil.nitrogen, crop.nitrogen[0], crop.nitrogen[1]),
      weatherScore,
    ];
    const score = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

    return { ...crop, score, weatherScore };
  }).sort((a, b) => b.score - a.score);
}

function qualityClass(score: number) {
  if (score >= 80) return styles.compatibilityGood;
  if (score >= 65) return styles.compatibilityWarn;
  return styles.compatibilityBad;
}

function getCropCombinationMessage(cropName: string, plans: CropPlan[]) {
  const selectedCrop = CROPS.find(crop => crop.name.toLowerCase() === cropName.trim().toLowerCase());
  if (!selectedCrop) return null;

  const companionNames = getCompanionCropNames(selectedCrop.name);
  const matchingPlan = plans.find(plan => companionNames.includes(plan.cropName));
  if (!matchingPlan) return null;

  return `Dobra kombinacija: ${selectedCrop.name} in ${matchingPlan.cropName} se spodbujata med seboj.`;
}

function ParcelaView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [parcela, setParcela] = useState<ParcelaDetails | null>(null);
  const [analysis, setAnalysis] = useState<ParcelaAnalysis | null>(null);
  const [soilLoading, setSoilLoading] = useState(false);
  const [soilError, setSoilError] = useState<string | null>(null);
  const [topCrops, setTopCrops] = useState<TopCropsResponse | null>(null);
  const [topCropsError, setTopCropsError] = useState<string | null>(null);
  const [yieldStats, setYieldStats] = useState<SursYieldStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [cropPlans, setCropPlans] = useState<CropPlan[]>([]);
  const [cropPlanError, setCropPlanError] = useState<string | null>(null);
  const [cropNameValue, setCropNameValue] = useState('');
  const [cropPercentValue, setCropPercentValue] = useState('100');
  const [plantedAmountValue, setPlantedAmountValue] = useState('');
  const [plantedAmountUnit, setPlantedAmountUnit] = useState<'kg' | 't'>('kg');
  const [plantingDateValue, setPlantingDateValue] = useState(todayInputDate);
  const [savingCropPlan, setSavingCropPlan] = useState(false);

  const center = useMemo(() => (parcela ? getCenter(parcela.pts) : null), [parcela]);
  const soil = useMemo(() => getSoilValuesFromAnalysis(analysis), [analysis]);
  const cropScores = useMemo(() => (
    getCropScores(soil, weather, parcela?.typeOfUse)
  ), [soil, weather, parcela?.typeOfUse]);
  const analysisPending = soilLoading && !analysis;

  const soilComposition = useMemo(() => [
    { label: t('parcela.soilComposition.sand'), value: soil.sand, color: '#d6a85b' },
    { label: t('parcela.soilComposition.silt'), value: soil.silt, color: '#8fb8a8' },
    { label: t('parcela.soilComposition.clay'), value: soil.clay, color: '#7c6f64' },
  ].filter(item => item.value != null && item.value > 0), [soil, t]);

  const soilChartData = useMemo(() => ({
    labels: soilComposition.map(item => item.label),
    datasets: [
      {
        data: soilComposition.map(item => item.value),
        backgroundColor: soilComposition.map(item => item.color),
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  }), [soilComposition]);

  const cropChartData = useMemo(() => ({
    labels: topCrops?.crops.map(crop => crop.name) ?? [],
    datasets: [
      {
        label: `Donos (${topCrops?.unit ?? 't/ha'})`,
        data: topCrops?.crops.map(crop => crop.value) ?? [],
        backgroundColor: '#0f6b4f',
        borderRadius: 6,
        maxBarThickness: 34,
      },
    ],
  }), [topCrops]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          color: '#64748b',
          font: {
            size: 11,
            weight: 700,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label?: string; parsed: number }) => `${ctx.label}: ${formatNumber(ctx.parsed, 1)}`,
        },
      },
    },
  }), []);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        grid: {
          color: '#edf2f0',
        },
        ticks: {
          color: '#64748b',
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#334155',
          font: {
            size: 11,
            weight: 700,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { x: number | null } }) => `${formatNumber(ctx.parsed.x ?? null, 1)} ${topCrops?.unit ?? 't/ha'}`,
        },
      },
    },
  }), [topCrops?.unit]);

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
        setCropPlans(data.cropPlans ?? []);
        setCropPercentValue(String(Math.max(0, Math.round(100 - (data.cropPlans ?? []).reduce((sum, plan) => sum + Number(plan.areaPercent || 0), 0)))));
        if (!data.analysis) {
          setSoilLoading(true);
        } else {
          setSoilLoading(false);
        }
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

  useEffect(() => {
    if (!id || !parcela) return;

    let active = true;
    setTopCropsError(null);

    getRegionalTopCrops({ parcelaId: id })
      .then(data => {
        if (!active) return;
        setTopCrops(data);
      })
      .catch(err => {
        if (!active) return;
        setTopCropsError(err.message);
      });

    return () => {
      active = false;
    };
  }, [id, parcela]);

  useEffect(() => {
    if (!id || !parcela) return;

    let active = true;

    getParcelaYieldStats(id)
      .then(data => {
        if (!active) return;
        setYieldStats(data.stats ?? []);
      })
      .catch(() => {
        if (!active) return;
        setYieldStats([]);
      });

    return () => {
      active = false;
    };
  }, [id, parcela]);

  const soilCards = [
    { label: t('parcela.soil.ph'), value: formatNumber(soil.ph, 1), sub: t('parcela.soil.ph.optimal'), icon: FlaskConical, score: scoreRange(soil.ph, 6, 7.5) },
    { label: t('parcela.soil.cec'), value: formatNumber(soil.cec, 1), sub: t('parcela.soil.cec.optimal'), icon: FlaskConical, score: scoreRange(soil.cec, 10, 25) },
    { label: t('parcela.soil.nitrogen'), value: `${formatNumber(soil.nitrogen, 2)} g/kg`, sub: t('parcela.soil.nitrogen.optimal'), icon: Leaf, score: scoreRange(soil.nitrogen, 1, 3) },
    { label: t('parcela.soil.carbon'), value: `${formatNumber(soil.organicCarbon, 1)} g/kg`, sub: t('parcela.soil.carbon.optimal'), icon: Sprout, score: scoreMinimum(soil.organicCarbon, 10) },
    { label: t('parcela.soil.clay'), value: `${formatNumber(soil.clay, 0)}%`, sub: t('parcela.soil.clay.optimal'), icon: Droplets, score: scoreRange(soil.clay, 10, 35) },
    { label: t('parcela.soil.sand'), value: `${formatNumber(soil.sand, 0)}%`, sub: t('parcela.soil.sand.optimal'), icon: Droplets, score: scoreRange(soil.sand, 20, 60) },
  ];

  const totalPlannedPercent = cropPlans.reduce((sum, plan) => sum + Number(plan.areaPercent || 0), 0);
  const remainingPercent = Math.max(0, 100 - totalPlannedPercent);
  const isFullyPlanted = remainingPercent <= 0;
  const cropCombinationMessage = getCropCombinationMessage(cropNameValue, cropPlans);

  async function handleAddCropPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!parcela) return;

    const trimmedName = cropNameValue.trim();
    const percent = Number(cropPercentValue);
    if (!trimmedName || !Number.isFinite(percent)) {
      setCropPlanError(t('parcela.cropplan.error.required'));
      return;
    }

    if (percent <= 0) {
      setCropPlanError(t('parcela.cropplan.error.zeroPercent'));
      return;
    }

    if (percent > remainingPercent) {
      setCropPlanError(`${remainingPercent.toFixed(0)}% ${t('parcela.cropplan.free')}.`);
      return;
    }

    setSavingCropPlan(true);
    setCropPlanError(null);
    const plantedAmount = plantedAmountValue === '' ? null : Number(plantedAmountValue);
    const plantedAmountKg = plantedAmount == null || !Number.isFinite(plantedAmount)
      ? null
      : plantedAmountUnit === 't'
        ? plantedAmount * 1000
        : plantedAmount;

    try {
      const saved = await createCropPlan(parcela.id, {
        cropName: trimmedName,
        areaPercent: percent,
        plantedAmountKg,
        plantingDate: plantingDateValue || null,
      });
      let nextPlans: CropPlan[] = [];
      setCropPlans(prev => {
        nextPlans = prev.some(plan => plan.id === saved.id)
          ? prev.map(plan => plan.id === saved.id ? saved : plan)
          : [saved, ...prev];
        return nextPlans;
      });
      setCropNameValue('');
      setCropPercentValue(String(Math.max(0, Math.round(100 - nextPlans.reduce((sum, plan) => sum + Number(plan.areaPercent || 0), 0)))));
      setPlantedAmountValue('');
      setPlantedAmountUnit('kg');
      setPlantingDateValue(todayInputDate());
    } catch (err) {
      setCropPlanError(err instanceof Error ? err.message : t('parcela.cropplan.error.generic'));
    } finally {
      setSavingCropPlan(false);
    }
  }

  async function handleDeleteCropPlan(planId: string) {
    if (!parcela) return;
    const previous = cropPlans;
    setCropPlans(prev => prev.filter(plan => plan.id !== planId));

    try {
      await deleteCropPlan(parcela.id, planId);
    } catch (err) {
      setCropPlans(previous);
      setCropPlanError(err instanceof Error ? err.message : t('parcela.cropplan.error.delete'));
    }
  }

  async function handleAdjustCropPlan(plan: CropPlan, delta: number) {
    if (!parcela) return;

    const nextPercent = Math.max(1, Math.min(plan.areaPercent + delta, plan.areaPercent + remainingPercent));
    if (nextPercent === plan.areaPercent) return;

    const previous = cropPlans;
    setCropPlans(prev => prev.map(item => (
      item.id === plan.id ? { ...item, areaPercent: nextPercent } : item
    )));
    setCropPlanError(null);

    try {
      const updated = await updateCropPlan(parcela.id, plan.id, { areaPercent: nextPercent });
      setCropPlans(prev => prev.map(item => item.id === plan.id ? updated : item));
    } catch (err) {
      setCropPlans(previous);
      setCropPlanError(err instanceof Error ? err.message : t('parcela.cropplan.error.update'));
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>{t('parcela.loading')}</p>
      </div>
    );
  }

  if (!parcela) {
    return (
      <div className={styles.page}>
        <Link to="/dashboard" className={styles.backLink}><ArrowLeft size={16} /> {t('parcela.back')}</Link>
        <p className={styles.empty}>{error ?? t('parcela.notFound')}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <Link to="/dashboard" className={styles.backLink}><ArrowLeft size={16} /> {t('parcela.back')}</Link>
        <div className={styles.detailHeaderDivider} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className={styles.detailEyebrow}>{t('parcela.eyebrow')}</p>
          <div className={styles.detailTitleRow}>
            {editingName ? (
              <input
                autoFocus
                className={styles.detailTitleInput}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={() => {
                  const trimmed = nameValue.trim();
                  if (trimmed && trimmed !== parcela.name) {
                    setParcela(prev => prev ? { ...prev, name: trimmed } : prev);
                    updateParcela(parcela.id, { name: trimmed }).catch(() =>
                      setParcela(prev => prev ? { ...prev, name: parcela.name } : prev)
                    );
                  }
                  setEditingName(false);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') { setEditingName(false); }
                }}
              />
            ) : (
              <>
                <h1 className={styles.title}>{parcela.name}</h1>
                <button className={styles.detailRenameBtn} onClick={() => { setNameValue(parcela.name); setEditingName(true); }}>
                  <Pencil size={13} />
                </button>
              </>
            )}
            <label className={styles.detailColorPicker} title="Spremeni barvo">
              <span className={styles.detailColorSwatch} style={{ backgroundColor: parcela.color ?? '#10b981' }} />
              <input
                type="color"
                value={parcela.color ?? '#10b981'}
                className={styles.detailColorInput}
                onChange={e => {
                  const color = e.target.value;
                  setParcela(prev => prev ? { ...prev, color } : prev);
                }}
                onBlur={e => {
                  const color = e.target.value;
                  updateParcela(parcela.id, { color }).catch(() =>
                    setParcela(prev => prev ? { ...prev, color: parcela.color } : prev)
                  );
                }}
              />
            </label>
          </div>
          <p className={styles.detailSub}>
            SoilGrids · {analysis?.fetchedAt ? new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(analysis.fetchedAt)) : 'analiza se izvaja'}
            {analysis && ` · ${analysis.lat.toFixed(5)}, ${analysis.lon.toFixed(5)}`}
          </p>
        </div>
      </div>

      <div className={styles.detailLayout}>
        <div>
          <section className={styles.analysisPanel}>
            {analysisPending ? (
              <div className={styles.analysisLoading}>
                <div className={styles.analysisSpinner} />
                <div>
                  <p className={styles.analysisLoadingTitle}>{t('parcela.analysis.pending.title')}</p>
                  <p className={styles.analysisLoadingSub}>{t('parcela.analysis.pending.sub')}</p>
                </div>
              </div>
            ) : (
              <>
                {soilLoading && <p className={styles.panelNotice}>{t('parcela.soil.refreshing')}</p>}
                {soilError && <p className={styles.panelNotice}>{soilError}</p>}
                <div className={styles.soilGrid}>
                  {soilCards.map(({ label, value, sub, icon: Icon, score }, idx) => {
                    const isOk = score >= 80;
                    const isWarn = score >= 65 && score < 80;
                    const barClass = isOk ? styles.soilCardBarOk : isWarn ? styles.soilCardBarWarn : styles.soilCardBarBad;
                    const dotClass = isOk ? styles.statusDotOk : isWarn ? styles.statusDotWarn : styles.statusDotBad;
                    return (
                      <div key={label} className={styles.soilCard} style={{ animationDelay: `${idx * 80}ms` }}>
                        <div className={styles.soilCardHeader}>
                          <span className={styles.soilLabel}>{label}</span>
                          <span className={dotClass} />
                        </div>
                        <div className={styles.soilValueRow}>
                          <Icon size={18} />
                          <p className={styles.soilValue}>{value}</p>
                        </div>
                        <p className={styles.soilSub}>{sub}</p>
                        <div
                          className={`${styles.soilCardBar} ${barClass}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>


          <section className={styles.chartGrid} style={{ marginTop: 24 }}>
            <div className={styles.chartPanel}>
              <div className={styles.chartHeader}>
                <div>
                  <p className={styles.chartTitle}>{t('parcela.chart.soilComposition')}</p>
                  <p className={styles.chartSub}>{t('parcela.chart.soilComposition.sub')}</p>
                </div>
              </div>
              <div className={styles.chartBox}>
                {soilComposition.length > 0 ? (
                  <Pie data={soilChartData} options={chartOptions} />
                ) : (
                  <p className={styles.panelNotice}>{t('parcela.chart.soilComposition.noData')}</p>
                )}
              </div>
            </div>

            <div className={styles.chartPanel}>
              <div className={styles.chartHeader}>
                <div>
                  <p className={styles.chartTitle}>{t('parcela.chart.topYield')}</p>
                  <p className={styles.chartSub}>
                    {topCrops ? `${topCrops.region}, ${topCrops.year} · vir: ${topCrops.source}` : t('parcela.chart.topYield.loading')}
                  </p>
                </div>
              </div>
              <div className={styles.chartBox}>
                {topCrops?.crops.length ? (
                  <Bar data={cropChartData} options={barOptions} />
                ) : (
                  <p className={styles.panelNotice}>{topCropsError ?? t('parcela.chart.topYield.noData')}</p>
                )}
              </div>
            </div>
          </section>

          <section className={styles.cropPlanPanel} style={{ display: 'none' }}>
            <div className={styles.cropPlanHeader}>
              <div>
                <p className={styles.cropPlanTitle}><Sprout size={17} /> Načrt pridelkov</p>
                <p className={styles.cropPlanSub}>Določi, kaj boš sadil, kolikšen procent površine zasede in kdaj pričakovati pobiranje.</p>
              </div>
              <span className={`${styles.cropPlanTotal} ${isFullyPlanted ? styles.cropPlanTotalFull : ''}`}>
                {Math.min(totalPlannedPercent, 100).toFixed(0)}% zasedeno · {remainingPercent.toFixed(0)}% prosto
              </span>
            </div>

            {isFullyPlanted && (
              <p className={styles.cropPlanFullNotice}>Parcela je 100% zasedena. Za nov pridelek najprej odstrani ali zmanjša obstoječo rabo.</p>
            )}

            <form className={styles.cropPlanForm} onSubmit={handleAddCropPlan}>
              <div className={styles.cropPlanField}>
                <label>Pridelek</label>
                <input
                  className={cropPlanError && !cropNameValue.trim() ? styles.cropPlanInputError : undefined}
                  list="crop-options-visible"
                  value={cropNameValue}
                  disabled={isFullyPlanted}
                  onChange={e => {
                    setCropNameValue(e.target.value);
                    if (cropPlanError) setCropPlanError(null);
                  }}
                  placeholder="npr. Koruza"
                />
                <datalist id="crop-options-visible">
                  {CROPS.map(crop => <option key={crop.name} value={crop.name} />)}
                </datalist>
              </div>
              <div className={styles.cropPlanField}>
                <label>Površina</label>
                <input
                  type="number"
                  min="1"
                  max={remainingPercent}
                  step="1"
                  value={cropPercentValue}
                  disabled={isFullyPlanted}
                  onChange={e => {
                    setCropPercentValue(e.target.value);
                    if (cropPlanError) setCropPlanError(null);
                  }}
                />
              </div>
              <div className={styles.cropPlanField}>
                <label>{t('parcela.cropplan.field.date')}</label>
                <input
                  type="date"
                  value={plantingDateValue}
                  disabled={isFullyPlanted}
                  onChange={e => setPlantingDateValue(e.target.value)}
                />
              </div>
              <button className={styles.cropPlanAddBtn} type="submit" disabled={savingCropPlan || isFullyPlanted}>
                <Plus size={15} /> {t('parcela.cropplan.add')}
              </button>
            </form>

            {cropPlanError && <p className={styles.cropPlanWarning}>{cropPlanError}</p>}
            {!cropPlanError && cropCombinationMessage && (
              <p className={styles.cropPlanPositive}>{cropCombinationMessage}</p>
            )}

            <div className={styles.cropPlanList}>
              {cropPlans.length === 0 ? (
                <p className={styles.panelNotice}>Za to parcelo še ni načrtovanih pridelkov.</p>
              ) : cropPlans.map(plan => (
                <div key={plan.id} className={styles.cropPlanRow}>
                  <div className={styles.cropPlanMain}>
                    <p className={styles.cropPlanName}>{plan.cropName}</p>
                    <div className={styles.cropPlanTrack}>
                      <div className={styles.cropPlanFill} style={{ width: `${Math.max(0, Math.min(100, plan.areaPercent))}%` }} />
                    </div>
                  </div>
                  <div className={styles.cropPlanPercentControl}>
                    <button
                      type="button"
                      title={t('parcela.cropplan.decrease')}
                      disabled={plan.areaPercent <= 1}
                      onClick={() => handleAdjustCropPlan(plan, -1)}
                    >
                      -
                    </button>
                    <span>{Math.round(plan.areaPercent)}%</span>
                    <button
                      type="button"
                      title={t('parcela.cropplan.increase')}
                      disabled={remainingPercent <= 0}
                      onClick={() => handleAdjustCropPlan(plan, Math.min(1, remainingPercent))}
                    >
                      +
                    </button>
                  </div>
                  <p className={styles.cropPlanDate}>Sajenje<br /><strong>{formatDate(plan.plantingDate)}</strong></p>
                  <p className={styles.cropPlanDate}>Pobiranje<br /><strong>{formatDate(plan.harvestDate)}</strong></p>
                  <button className={styles.cropPlanDeleteBtn} title="Izbriši pridelek" onClick={() => handleDeleteCropPlan(plan.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.recommendPanel} style={{ marginTop: 24 }}>
            <div className={styles.recommendHeader}>
              <div>
                <p className={styles.recommendTitle}><Bot size={17} /> {t('parcela.ai.title')}</p>
                <p className={styles.recommendSub}>
                  {parcela.typeOfUse ? `${t('parcela.ai.landuse')} ${parcela.typeOfUse}` : t('parcela.ai.landuse.generic')} · tla in vreme
                </p>
              </div>
              <span className={styles.modelBadge}>{t('parcela.ai.badge')}</span>
            </div>

            <div className={styles.compatibilityList}>
              {analysisPending ? (
                <p className={styles.panelNotice}>{t('parcela.ai.pending')}</p>
              ) : cropScores.map((crop, idx) => (
                <div key={crop.name} className={styles.compatibilityRow} style={{ animationDelay: `${idx * 70}ms` }}>
                  <div className={styles.cropIcon}>{crop.icon}</div>
                  <div className={styles.compatibilityBody}>
                    <div className={styles.compatibilityTop}>
                      <p className={styles.cropName}>{crop.name}</p>
                      <span className={`${styles.compatibilityBadge} ${qualityClass(crop.score)}`}>{crop.score}%</span>
                    </div>
                    <div className={styles.compatibilityTrack}>
                      <div
                        className={`${styles.compatibilityFill} ${qualityClass(crop.score)}`}
                        style={{
                          width: `${crop.score}%`,
                          ['--fill-width' as string]: `${crop.score}%`,
                          animationDelay: `${idx * 70 + 100}ms`,
                        }}
                      />
                    </div>
                    <p className={styles.cropMeta}><CalendarDays size={13} /> {crop.season} · {formatSursYieldLabel(crop.name, yieldStats)}</p>
                    <p className={styles.cropMeta}>{t('parcela.ai.weatherCriteria')} {crop.weatherScore}%</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.cropPlanPanel} style={{ marginTop: 24 }}>
            <div className={styles.cropPlanHeader}>
              <div>
                <p className={styles.cropPlanTitle}><Sprout size={17} /> {t('parcela.cropplan.title')}</p>
                <p className={styles.cropPlanSub}>{t('parcela.cropplan.sub')}</p>
              </div>
              <span className={`${styles.cropPlanTotal} ${isFullyPlanted ? styles.cropPlanTotalFull : ''}`}>
                {Math.min(totalPlannedPercent, 100).toFixed(0)}% {t('parcela.cropplan.occupied')} - {remainingPercent.toFixed(0)}% {t('parcela.cropplan.free')}
              </span>
            </div>

            {isFullyPlanted && (
              <p className={styles.cropPlanFullNotice}>{t('parcela.cropplan.full')}</p>
            )}

            <form className={styles.cropPlanForm} onSubmit={handleAddCropPlan}>
              <div className={styles.cropPlanField}>
                <label>{t('parcela.cropplan.field.crop')}</label>
                <input
                  className={cropPlanError && !cropNameValue.trim() ? styles.cropPlanInputError : undefined}
                  list="crop-options-plan"
                  value={cropNameValue}
                  disabled={isFullyPlanted}
                  onChange={e => {
                    setCropNameValue(e.target.value);
                    if (cropPlanError) setCropPlanError(null);
                  }}
                  placeholder={t('parcela.cropplan.field.crop.placeholder')}
                />
                <datalist id="crop-options-plan">
                  {CROPS.map(crop => <option key={crop.name} value={crop.name} />)}
                </datalist>
              </div>
              <div className={styles.cropPlanField}>
                <label>{t('parcela.cropplan.field.area')}</label>
                <input
                  type="number"
                  min="1"
                  max={remainingPercent}
                  step="1"
                  value={cropPercentValue}
                  disabled={isFullyPlanted}
                  onChange={e => {
                    setCropPercentValue(e.target.value);
                    if (cropPlanError) setCropPlanError(null);
                  }}
                />
              </div>
              <div className={styles.cropPlanField}>
                <label>{t('parcela.cropplan.field.planted')}</label>
                <div className={styles.cropPlanAmountGroup}>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={plantedAmountValue}
                    disabled={isFullyPlanted}
                    onChange={e => setPlantedAmountValue(e.target.value)}
                    placeholder="0"
                  />
                  <select
                    value={plantedAmountUnit}
                    disabled={isFullyPlanted}
                    onChange={e => setPlantedAmountUnit(e.target.value as 'kg' | 't')}
                  >
                    <option value="kg">kg</option>
                    <option value="t">t</option>
                  </select>
                </div>
              </div>
              <div className={styles.cropPlanField}>
                <label>{t('parcela.cropplan.field.date')}</label>
                <input
                  type="date"
                  value={plantingDateValue}
                  disabled={isFullyPlanted}
                  onChange={e => setPlantingDateValue(e.target.value)}
                />
              </div>
              <button className={styles.cropPlanAddBtn} type="submit" disabled={savingCropPlan || isFullyPlanted}>
                <Plus size={15} /> {t('parcela.cropplan.add')}
              </button>
            </form>

            {cropPlanError && <p className={styles.cropPlanWarning}>{cropPlanError}</p>}
            {!cropPlanError && cropCombinationMessage && (
              <p className={styles.cropPlanPositive}>{cropCombinationMessage}</p>
            )}

            <div className={styles.cropPlanList}>
              {cropPlans.length === 0 ? (
                <div className={styles.cropPlanEmpty}>
                  <div className={styles.cropPlanEmptyIcon}>
                    <Sprout size={22} />
                  </div>
                  <div>
                    <p className={styles.cropPlanEmptyTitle}>{t('parcela.cropplan.empty.title')}</p>
                    <p className={styles.cropPlanEmptyText}>{t('parcela.cropplan.empty.text')}</p>
                  </div>
                </div>
              ) : cropPlans.map(plan => {
                const yieldSource = getYieldSourceForCrop(plan.cropName, yieldStats);
                const expectedHarvestKg = getExpectedHarvestKg(plan, parcela.areaHectares, yieldStats);
                const plantedAmountNote = getPlantedAmountNote(plan, parcela.areaHectares);
                const estimateLabel = yieldSource
                  ? `${t('parcela.cropplan.estimate')} ${yieldSource.label}`
                  : t('parcela.cropplan.estimate');
                return (
                  <div key={plan.id} className={styles.cropPlanRow}>
                    <div className={styles.cropPlanMain}>
                      <p className={styles.cropPlanName}>{plan.cropName}</p>
                      <div className={styles.cropPlanTrack}>
                        <div className={styles.cropPlanFill} style={{ width: `${Math.max(0, Math.min(100, plan.areaPercent))}%` }} />
                      </div>
                    </div>
                    <div className={styles.cropPlanPercentControl}>
                      <button
                        type="button"
                        title={t('parcela.cropplan.decrease')}
                        disabled={plan.areaPercent <= 1}
                        onClick={() => handleAdjustCropPlan(plan, -1)}
                      >
                        -
                      </button>
                      <span>{Math.round(plan.areaPercent)}%</span>
                      <button
                        type="button"
                        title={t('parcela.cropplan.increase')}
                        disabled={remainingPercent <= 0}
                        onClick={() => handleAdjustCropPlan(plan, Math.min(1, remainingPercent))}
                      >
                        +
                      </button>
                    </div>
                    <p className={styles.cropPlanDate}>{t('parcela.cropplan.seeded')}<br /><strong>{formatMassKg(plan.plantedAmountKg)}</strong></p>
                    <p className={styles.cropPlanDate}>{t('parcela.cropplan.harvest')}<br /><strong>{formatDate(plan.harvestDate)}</strong></p>
                    <p className={styles.cropPlanDate}>
                      {estimateLabel}<br />
                      <strong>{formatMassKg(expectedHarvestKg)}</strong>
                      {plantedAmountNote && <><br /><span>{plantedAmountNote}</span></>}
                    </p>
                    <button className={styles.cropPlanDeleteBtn} title={t('parcela.cropplan.delete')} onClick={() => handleDeleteCropPlan(plan.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div>
          <div className={styles.weatherPanel}>
            <div className={styles.weatherHeader}>
              <p className={styles.weatherTitle}>{t('parcela.weather.title')}</p>
            </div>
            <p className={styles.weatherSource}>{t('parcela.weather.source')}</p>
            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 16px' }} />

            {weatherLoading && <p className={styles.weatherLoading}>{t('parcela.weather.loading')}</p>}

            {weather.length > 0 && (
              <>
                <div className={styles.weatherCurrent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <span style={{ fontSize: 28 }}>{weatherIcon(weather[0].weatherCode)}</span>
                    <div>
                      <p className={styles.weatherCurrentTemp}>{Math.round(weather[0].maxTemp)}°C</p>
                      <p className={styles.weatherCurrentDesc}>{t(weatherDescriptionKey(weather[0].weatherCode))} · {t('parcela.weather.today')}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className={styles.weatherCurrentRain}>
                      <Droplets size={14} style={{ marginRight: 2, verticalAlign: -2 }} />
                      {weather[0].precipitation}%
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{t('parcela.weather.rain')}</p>
                  </div>
                </div>

                {weather.map((day, i) => {
                  const pct = day.precipitation;
                  const alpha = pct <= 0 ? 0 : Math.min(0.15 + (pct / 100) * 0.85, 1);
                  const barColor = pct <= 0
                    ? '#e2e8f0'
                    : `rgba(59, 130, 246, ${alpha})`;

                  const dayLabel = i === 0 ? t('parcela.weather.today') : i === 1 ? t('parcela.weather.tomorrow') : t(day.dayName);

                  return (
                    <div key={day.date} className={styles.weatherDayRow} style={{ animationDelay: `${i * 60}ms` }}>
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

          {center && (
            <div className={styles.locationPanel} onClick={() => navigate('/map', { state: { selectedId: id } })} style={{ cursor: 'pointer' }}>
              <p className={styles.locationTitle}>{t('parcela.location')}</p>
              <div className={styles.locationMap}>
                <MapContainer
                  bounds={parcela.pts}
                  boundsOptions={{ padding: [24, 24] }}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  touchZoom={false}
                  dragging={false}
                  zoomControl={false}
                  attributionControl={false}
                  style={{ width: '100%', height: '100%', borderRadius: 10, pointerEvents: 'none' }}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Polygon
                    positions={parcela.pts}
                    pathOptions={{
                      color: parcela.color ?? '#10b981',
                      fillColor: parcela.color ?? '#10b981',
                      fillOpacity: 0.25,
                      weight: 2,
                    }}
                  />
                </MapContainer>
              </div>
              <p className={styles.locationCoords}>
                {center[0].toFixed(4)}° N, {center[1].toFixed(4)}° E
              </p>
            </div>
          )}
        </div>
      </div>

      {error && <p className={styles.empty}>{error}</p>}
    </div>
  );
}

export default ParcelaView;
