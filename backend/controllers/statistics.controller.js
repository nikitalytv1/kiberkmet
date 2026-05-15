import { prisma } from '../index.js';

const TABLE_URL = 'https://pxweb.stat.si/SiStatData/api/v1/en/Data/1502410S.px';
const NUTS3_GEOJSON_URL = 'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_3.geojson';

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

const STATISTICAL_REGION_NAMES = {
  '0': 'SLOVENIA',
  '01': 'Pomurska',
  '02': 'Podravska',
  '03': 'Koroska',
  '04': 'Savinjska',
  '05': 'Zasavska',
  '06': 'Posavska',
  '07': 'Jugovzhodna Slovenija',
  '08': 'Osrednjeslovenska',
  '09': 'Gorenjska',
  '10': 'Primorsko-notranjska',
  '11': 'Goriska',
  '12': 'Obalno-kraska'
};

const CROP_NAME_SL = {
  'Wheat and spelt': 'Pšenica in pira',
  Barley: 'Ječmen',
  Triticale: 'Tritikala',
  Oats: 'Oves',
  'Rye and maslin': 'Rž in soržica',
  'Grain maize and corn-cob mix': 'Koruza za zrnje',
  'Green maize': 'Zelena koruza',
  Potatoes: 'Krompir',
  'Pumpkins for oil': 'Oljne buče',
  'Rape and turnip rape': 'Oljna ogrščica',
  Hops: 'Hmelj',
  'Grasses (including mixtures)': 'Trave in travne mešanice',
  'Grass - clover mixtures': 'Travnodeteljne mešanice',
  'Clover - grass mixtures': 'Deteljnotravne mešanice',
  Clover: 'Detelja',
  Lucerne: 'Lucerna',
  'Permanent grassland, including common grassland': 'Trajno travinje',
  'White cabbage': 'Belo zelje',
  Grapes: 'Grozdje',
  'Apples from intensive orchards': 'Jabolka iz intenzivnih sadovnjakov',
  Olives: 'Oljke',
  'Peaches and nectarines from intensive orchards': 'Breskve in nektarine'
};

let sloveniaNuts3GeojsonPromise = null;

function getStatisticalRegionName(code) {
  return STATISTICAL_REGION_NAMES[String(code)] ?? String(code);
}

function getFallbackGeojson() {
  return {
    type: 'FeatureCollection',
    features: Object.entries(REGION_FALLBACK_ENVELOPES).map(([regionCode, bounds]) => {
      const [west, south, east, north] = bounds;

      return {
        type: 'Feature',
        properties: {
          nutsId: null,
          regionCode,
          regionName: getStatisticalRegionName(regionCode)
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

async function getRegionFromParcela(parcelaId, userId) {
  const nutsGeojson = JSON.stringify(await getSloveniaNuts3Geojson());
  const region = await prisma.$queryRaw`
    WITH nuts AS (
      SELECT
        feature.data->'properties'->>'regionCode' AS "regionCode",
        feature.data->'properties'->>'regionName' AS "regionName",
        feature.data->'properties'->>'nutsId' AS "nutsId",
        ST_SetSRID(ST_MakeValid(ST_GeomFromGeoJSON((feature.data->'geometry')::text)), 4326) AS geom
      FROM jsonb_array_elements(CAST(${nutsGeojson} AS jsonb)->'features') AS feature(data)
    ),
    parcela AS (
      SELECT ST_PointOnSurface(coordinates) AS point
      FROM "Parcela"
      WHERE id = ${parcelaId} AND "userId" = ${userId}
      LIMIT 1
    )
    SELECT
      nuts."regionCode",
      nuts."regionName",
      nuts."nutsId",
      ST_X(parcela.point) AS lon,
      ST_Y(parcela.point) AS lat
    FROM parcela, nuts
    ORDER BY
      CASE WHEN ST_Intersects(nuts.geom, parcela.point) THEN 0 ELSE 1 END,
      ST_Distance(nuts.geom::geography, parcela.point::geography)
    LIMIT 1
  `;

  return region[0] ?? null;
}

async function fetchJsonStat(body) {
  const res = await fetch(TABLE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.detail ?? data?.error ?? res.statusText;
    throw new Error(`SURS PxWeb failed (${res.status}): ${detail}`);
  }

  return data;
}

async function getTopCropsResponse(regionCode, regionLocation = null) {
  const data = await fetchJsonStat({
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
          filter: 'top',
          values: ['1']
        }
      },
      {
        code: 'STATISTIČNA REGIJA',
        selection: {
          filter: 'item',
          values: [String(regionCode)]
        }
      }
    ],
    response: {
      format: 'json-stat2'
    }
  });

  const cropDimension = data.dimension?.['KMETIJSKE KULTURE'];
  const yearDimension = data.dimension?.LETO;
  const labels = cropDimension?.category?.label ?? {};
  const indexes = cropDimension?.category?.index ?? {};
  const yearLabels = yearDimension?.category?.label ?? {};
  const year = Object.values(yearLabels)[0] ?? null;

  const crops = Object.entries(indexes)
    .map(([code, index]) => ({
      code,
      name: CROP_NAME_SL[labels[code]] ?? labels[code] ?? code,
      value: data.value?.[index] ?? null
    }))
    .filter(item => typeof item.value === 'number' && item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    source: 'SURS',
    table: '1502410S',
    year,
    region: regionLocation?.regionName ?? getStatisticalRegionName(String(regionCode)),
    regionCode: String(regionCode),
    location: regionLocation,
    unit: 't/ha',
    crops
  };
}

export async function getTopCrops(req, res) {
  try {
    const regionCode = req.query.region ?? '0';

    return res.json(await getTopCropsResponse(regionCode));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}

export async function getTopCropsByParcela(req, res) {
  try {
    const region = await getRegionFromParcela(req.params.id, req.user.userId);

    if (!region) {
      return res.status(404).json({
        error: 'Parcela not found'
      });
    }

    return res.json(await getTopCropsResponse(region.regionCode, {
      lon: Number(region.lon),
      lat: Number(region.lat),
      nutsId: region.nutsId,
      regionName: region.regionName,
      source: 'parcela-point-on-surface'
    }));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}
