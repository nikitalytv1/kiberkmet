import { prisma } from '../index.js';

const SURS_YIELD_URL = 'https://pxweb.stat.si/SiStatData/api/v1/en/Data/1502410S.px';
const NUTS3_GEOJSON_URL = 'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_3.geojson';
const STATISTICAL_REGION_DIMENSION = 'STATISTIČNA REGIJA';

const SURS_STATISTICAL_REGION_BY_NUTS = {
  SI031: '01',
  SI032: '02',
  SI033: '03',
  SI034: '04',
  SI035: '05',
  SI036: '06',
  SI037: '07',
  SI041: '08',
  SI042: '09',
  SI038: '10',
  SI043: '11',
  SI044: '12'
};

const REGION_FALLBACK_ENVELOPES = {
  '01': [15.7, 46.4, 16.7, 46.95],
  '02': [15.15, 46.15, 16.15, 46.75],
  '03': [14.55, 46.35, 15.35, 46.75],
  '04': [14.65, 45.95, 15.65, 46.5],
  '05': [14.85, 46.0, 15.25, 46.25],
  '06': [15.15, 45.75, 15.85, 46.15],
  '07': [14.55, 45.35, 15.65, 46.05],
  '08': [14.15, 45.75, 14.95, 46.3],
  '09': [13.65, 46.1, 14.75, 46.6],
  '10': [13.75, 45.45, 14.65, 46.0],
  '11': [13.35, 45.75, 14.3, 46.35],
  '12': [13.35, 45.35, 14.1, 45.9]
};

const CROP_NAME_SL = {
  'Wheat and spelt': 'Psenica in pira',
  Barley: 'Jecmen',
  Triticale: 'Tritikala',
  Oats: 'Oves',
  'Rye and maslin': 'Rz in sorzica',
  'Grain maize and corn-cob mix': 'Koruza za zrnje',
  'Green maize': 'Zelena koruza',
  Potatoes: 'Krompir',
  'Pumpkins for oil': 'Oljne buce',
  'Rape and turnip rape': 'Oljna ogrscica',
  Hops: 'Hmelj',
  'Grasses (including mixtures)': 'Trave in travne mesanice',
  'Grass - clover mixtures': 'Travnodeteljne mesanice',
  'Clover - grass mixtures': 'Deteljnotravne mesanice',
  Clover: 'Detelja',
  Lucerne: 'Lucerna',
  'Permanent grassland, including common grassland': 'Trajno travinje',
  'White cabbage': 'Belo zelje',
  Grapes: 'Grozdje',
  'Apples from intensive orchards': 'Jabolka',
  Olives: 'Oljke',
  'Peaches and nectarines from intensive orchards': 'Breskve in nektarine'
};

const CROP_CODE_BY_LAND_USE = {
  Njiva: '06',
  Travnik: '17',
  Vinograd: '19',
  Sadovnjak: '20',
  Vrt: '08'
};

export const STATISTICAL_REGIONS = [
  { code: '01', name: 'Pomurska' },
  { code: '02', name: 'Podravska' },
  { code: '03', name: 'Koroska' },
  { code: '04', name: 'Savinjska' },
  { code: '05', name: 'Zasavska' },
  { code: '06', name: 'Posavska' },
  { code: '07', name: 'Jugovzhodna Slovenija' },
  { code: '08', name: 'Osrednjeslovenska' },
  { code: '09', name: 'Gorenjska' },
  { code: '10', name: 'Primorsko-notranjska' },
  { code: '11', name: 'Goriska' },
  { code: '12', name: 'Obalno-kraska' }
];

let sloveniaNuts3GeojsonPromise = null;
const sursYieldCache = new Map();

function getFallbackGeojson() {
  return {
    type: 'FeatureCollection',
    features: STATISTICAL_REGIONS.map(region => {
      const [west, south, east, north] = REGION_FALLBACK_ENVELOPES[region.code];

      return {
        type: 'Feature',
        properties: {
          nutsId: null,
          regionCode: region.code,
          regionName: region.name
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south]
          ]]
        }
      };
    })
  };
}

async function getSloveniaNuts3Geojson() {
  if (!sloveniaNuts3GeojsonPromise) {
    sloveniaNuts3GeojsonPromise = fetch(NUTS3_GEOJSON_URL)
      .then(async response => {
        if (!response.ok) {
          throw new Error(`GISCO NUTS failed (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        const features = (data.features ?? [])
          .filter(feature => SURS_STATISTICAL_REGION_BY_NUTS[feature?.properties?.NUTS_ID])
          .map(feature => ({
            type: 'Feature',
            properties: {
              nutsId: feature.properties.NUTS_ID,
              regionCode: SURS_STATISTICAL_REGION_BY_NUTS[feature.properties.NUTS_ID],
              regionName: feature.properties.NUTS_NAME
            },
            geometry: feature.geometry
          }));

        if (features.length !== 12) {
          throw new Error(`GISCO NUTS returned ${features.length} Slovenian NUTS3 regions.`);
        }

        return {
          type: 'FeatureCollection',
          features
        };
      })
      .catch(err => {
        sloveniaNuts3GeojsonPromise = null;
        console.warn('GISCO NUTS fetch failed, using fallback region envelopes:', err.message);
        return getFallbackGeojson();
      });
  }

  return sloveniaNuts3GeojsonPromise;
}

function isValidRegionCode(regionCode) {
  return STATISTICAL_REGIONS.some(region => region.code === regionCode);
}

function predictNextYield(history) {
  const values = history
    .filter(item => typeof item.value === 'number')
    .slice(-5);

  if (values.length === 0) return null;
  if (values.length === 1) return Number(values[0].value.toFixed(1));

  const first = values[0];
  const last = values[values.length - 1];
  const annualTrend = (last.value - first.value) / Math.max(1, last.year - first.year);
  return Number(Math.max(0, last.value + annualTrend).toFixed(1));
}

async function fetchSursRegionalYields(regionCode) {
  if (sursYieldCache.has(regionCode)) {
    return sursYieldCache.get(regionCode);
  }

  const response = await fetch(SURS_YIELD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: [
        {
          code: 'KMETIJSKE KULTURE',
          selection: {
            filter: 'all',
            values: ['*']
          }
        },
        {
          code: 'LETO',
          selection: {
            filter: 'all',
            values: ['*']
          }
        },
        {
          code: STATISTICAL_REGION_DIMENSION,
          selection: {
            filter: 'item',
            values: [regionCode]
          }
        }
      ],
      response: {
        format: 'json-stat2'
      }
    })
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail ?? data?.error ?? response.statusText;
    throw new Error(`SURS PxWeb failed (${response.status}): ${detail}`);
  }

  const cropDimension = data.dimension?.['KMETIJSKE KULTURE'];
  const yearDimension = data.dimension?.LETO;
  const cropIndexes = cropDimension?.category?.index ?? {};
  const cropLabels = cropDimension?.category?.label ?? {};
  const yearIndexes = yearDimension?.category?.index ?? {};
  const cropCount = data.size?.[0] ?? Object.keys(cropIndexes).length;
  const yearCount = data.size?.[1] ?? Object.keys(yearIndexes).length;
  const values = data.value ?? [];
  const byCropCode = {};

  for (const [cropCode, cropIndex] of Object.entries(cropIndexes)) {
    const cropHistory = Object.entries(yearIndexes)
      .map(([year, yearIndex]) => {
        const valueIndex = (Number(cropIndex) * yearCount) + Number(yearIndex);
        const value = values[valueIndex];

        return {
          year: Number(year),
          value: typeof value === 'number' ? value : null
        };
      })
      .filter(item => item.value != null)
      .sort((a, b) => a.year - b.year);

    const cropName = CROP_NAME_SL[cropLabels[cropCode]] ?? cropLabels[cropCode] ?? cropCode;

    byCropCode[cropCode] = {
      cropCode,
      cropName,
      unit: 't/ha',
      history: cropHistory,
      latest: cropHistory[cropHistory.length - 1] ?? null,
      prediction: {
        year: cropHistory.length > 0 ? cropHistory[cropHistory.length - 1].year + 1 : null,
        value: predictNextYield(cropHistory)
      }
    };
  }

  if (cropCount === 0 || yearCount === 0) {
    throw new Error('SURS PxWeb returned no crop yield dimensions.');
  }

  sursYieldCache.set(regionCode, byCropCode);
  return byCropCode;
}

function getSursStatsForParcela(parcela, yieldsByCropCode) {
  const cropCode = CROP_CODE_BY_LAND_USE[parcela.typeOfUse];
  if (!cropCode) return null;

  return yieldsByCropCode[cropCode] ?? null;
}

export function getRegions(_req, res) {
  res.json(STATISTICAL_REGIONS);
}

export async function getParceleByRegion(req, res) {
  const regionCode = String(req.params.regionCode).padStart(2, '0');

  if (!isValidRegionCode(regionCode)) {
    return res.status(400).json({
      error: 'Invalid statistical region code'
    });
  }

  try {
    const nutsGeojson = JSON.stringify(await getSloveniaNuts3Geojson());
    let yieldsByCropCode = {};

    try {
      yieldsByCropCode = await fetchSursRegionalYields(regionCode);
    } catch (err) {
      console.warn('SURS yield fetch failed:', err.message);
    }

    const parcele = await prisma.$queryRaw`
      WITH nuts AS (
        SELECT
          feature.data->'properties'->>'regionCode' AS "regionCode",
          ST_SetSRID(ST_MakeValid(ST_GeomFromGeoJSON((feature.data->'geometry')::text)), 4326) AS geom
        FROM jsonb_array_elements(CAST(${nutsGeojson} AS jsonb)->'features') AS feature(data)
        WHERE feature.data->'properties'->>'regionCode' = ${regionCode}
      )
      SELECT
        p.id,
        p.name,
        p.color,
        p.gerk_pid::text,
        p."typeOfUse",
        ST_AsGeoJSON(p.coordinates)::json AS coordinates,
        ST_Area(p.coordinates::geography) / 10000 AS "areaHectares",
        p."createdAt",
        p."updatedAt",
        p."userId",
        (
          SELECT json_build_object(
            'id', a.id,
            'lon', a.lon,
            'lat', a.lat,
            'physicalSoil', a."physicalSoil",
            'chemicalProperties', a."chemicalProperties",
            'soilClassification', a."soilClassification",
            'derivedProperties', a."derivedProperties",
            'fetchedAt', a."fetchedAt"
          )
          FROM "Analiza" a
          WHERE a."parcelaId" = p.id
          ORDER BY a."fetchedAt" DESC
          LIMIT 1
        ) AS analysis
      FROM "Parcela" p
      CROSS JOIN nuts
      WHERE ST_Intersects(nuts.geom, ST_PointOnSurface(p.coordinates))
      ORDER BY p."createdAt" DESC
    `;

    return res.json({
      region: STATISTICAL_REGIONS.find(region => region.code === regionCode),
      parcele: parcele.map(parcela => ({
        ...parcela,
        sursYieldStats: getSursStatsForParcela(parcela, yieldsByCropCode)
      }))
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}
