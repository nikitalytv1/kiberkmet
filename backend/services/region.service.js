import { prisma } from "../index.js";

const SURS_YIELD_URL =
  "https://pxweb.stat.si/SiStatData/api/v1/en/Data/1502410S.px";
const NUTS3_GEOJSON_URL =
  "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_3.geojson";
const STATISTICAL_REGION_DIMENSION = "STATISTIČNA REGIJA";

export const STATISTICAL_REGIONS = [
  { code: "01", name: "Pomurska" },
  { code: "02", name: "Podravska" },
  { code: "03", name: "Koroska" },
  { code: "04", name: "Savinjska" },
  { code: "05", name: "Zasavska" },
  { code: "06", name: "Posavska" },
  { code: "07", name: "Jugovzhodna Slovenija" },
  { code: "08", name: "Osrednjeslovenska" },
  { code: "09", name: "Gorenjska" },
  { code: "10", name: "Primorsko-notranjska" },
  { code: "11", name: "Goriska" },
  { code: "12", name: "Obalno-kraska" },
];

const STATISTICAL_REGION_NAMES = Object.fromEntries(
  STATISTICAL_REGIONS.map((r) => [r.code, r.name]),
);

const SURS_REGION_BY_NUTS = {
  SI031: "01",
  SI032: "02",
  SI033: "03",
  SI034: "04",
  SI035: "05",
  SI036: "06",
  SI037: "07",
  SI041: "08",
  SI042: "09",
  SI038: "10",
  SI043: "11",
  SI044: "12",
};

const REGION_FALLBACK_ENVELOPES = {
  "01": [15.7, 46.4, 16.7, 46.95],
  "02": [15.15, 46.15, 16.15, 46.75],
  "03": [14.55, 46.35, 15.35, 46.75],
  "04": [14.65, 45.95, 15.65, 46.5],
  "05": [14.85, 46.0, 15.25, 46.25],
  "06": [15.15, 45.75, 15.85, 46.15],
  "07": [14.55, 45.35, 15.65, 46.05],
  "08": [14.15, 45.75, 14.95, 46.3],
  "09": [13.65, 46.1, 14.75, 46.6],
  10: [13.75, 45.45, 14.65, 46.0],
  11: [13.35, 45.75, 14.3, 46.35],
  12: [13.35, 45.35, 14.1, 45.9],
};

export const CROP_NAME_SL = {
  "Wheat and spelt": "Pšenica in pira",
  Barley: "Ječmen",
  Triticale: "Tritikala",
  Oats: "Oves",
  "Rye and maslin": "Rž in soržica",
  "Grain maize and corn-cob mix": "Koruza za zrnje",
  "Green maize": "Zelena koruza",
  Potatoes: "Krompir",
  "Pumpkins for oil": "Oljne buče",
  "Rape and turnip rape": "Oljna ogrščica",
  Hops: "Hmelj",
  "Grasses (including mixtures)": "Trave in travne mešanice",
  "Grass - clover mixtures": "Travnodeteljne mešanice",
  "Clover - grass mixtures": "Deteljnotravne mešanice",
  Clover: "Detelja",
  Lucerne: "Lucerna",
  "Permanent grassland, including common grassland": "Trajno travinje",
  "White cabbage": "Belo zelje",
  Grapes: "Grozdje",
  "Apples from intensive orchards": "Jabolka iz intenzivnih sadovnjakov",
  Olives: "Oljke",
  "Peaches and nectarines from intensive orchards": "Breskve in nektarine",
};

export const CROP_CODE_BY_LAND_USE = {
  Njiva: "06",
  Travnik: "17",
  Vinograd: "19",
  Sadovnjak: "20",
  Vrt: "08",
};

let nuts3GeojsonPromise = null;

function buildFallbackGeojson() {
  return {
    type: "FeatureCollection",
    features: STATISTICAL_REGIONS.map((region) => {
      const [west, south, east, north] = REGION_FALLBACK_ENVELOPES[region.code];
      return {
        type: "Feature",
        properties: {
          nutsId: null,
          regionCode: region.code,
          regionName: region.name,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      };
    }),
  };
}

export async function getSloveniaNuts3Geojson() {
  if (!nuts3GeojsonPromise) {
    nuts3GeojsonPromise = fetch(NUTS3_GEOJSON_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `GISCO NUTS failed (${response.status}): ${response.statusText}`,
          );
        }

        const data = await response.json();
        const features = (data.features ?? [])
          .filter((f) => SURS_REGION_BY_NUTS[f?.properties?.NUTS_ID])
          .map((f) => ({
            type: "Feature",
            properties: {
              nutsId: f.properties.NUTS_ID,
              regionCode: SURS_REGION_BY_NUTS[f.properties.NUTS_ID],
              regionName: f.properties.NUTS_NAME,
            },
            geometry: f.geometry,
          }));

        if (features.length !== 12) {
          throw new Error(
            `GISCO NUTS returned ${features.length} Slovenian NUTS3 regions.`,
          );
        }

        return { type: "FeatureCollection", features };
      })
      .catch((err) => {
        nuts3GeojsonPromise = null;
        console.warn(
          "GISCO NUTS fetch failed, using fallback envelopes:",
          err.message,
        );
        return buildFallbackGeojson();
      });
  }

  return nuts3GeojsonPromise;
}

export function getRegionName(code) {
  return STATISTICAL_REGION_NAMES[String(code)] ?? String(code);
}

export function isValidRegionCode(code) {
  return STATISTICAL_REGIONS.some((r) => r.code === code);
}

export async function getRegionForParcela(parcelaId, userId) {
  const nutsGeojson = JSON.stringify(await getSloveniaNuts3Geojson());

  const rows = await prisma.$queryRaw`
    WITH nuts AS (
      SELECT
        feature.data->'properties'->>'regionCode' AS "regionCode",
        feature.data->'properties'->>'regionName' AS "regionName",
        feature.data->'properties'->>'nutsId'      AS "nutsId",
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

  return rows[0] ?? null;
}

const sursYieldCache = new Map();

async function postSurs(body) {
  const res = await fetch(SURS_YIELD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail ?? data?.error ?? res.statusText;
    throw new Error(`SURS PxWeb failed (${res.status}): ${detail}`);
  }

  return data;
}

function predictNextYield(history) {
  const values = history
    .filter((item) => typeof item.value === "number")
    .slice(-5);
  if (values.length === 0) return null;
  if (values.length === 1) return Number(values[0].value.toFixed(1));

  const first = values[0];
  const last = values[values.length - 1];
  const trend =
    (last.value - first.value) / Math.max(1, last.year - first.year);
  return Number(Math.max(0, last.value + trend).toFixed(1));
}

export async function fetchRegionalYields(regionCode) {
  if (sursYieldCache.has(regionCode)) {
    return sursYieldCache.get(regionCode);
  }

  const data = await postSurs({
    query: [
      {
        code: "KMETIJSKE KULTURE",
        selection: { filter: "all", values: ["*"] },
      },
      { code: "LETO", selection: { filter: "all", values: ["*"] } },
      {
        code: STATISTICAL_REGION_DIMENSION,
        selection: { filter: "item", values: [regionCode] },
      },
    ],
    response: { format: "json-stat2" },
  });

  const cropDimension = data.dimension?.["KMETIJSKE KULTURE"];
  const yearDimension = data.dimension?.LETO;
  const cropIndexes = cropDimension?.category?.index ?? {};
  const cropLabels = cropDimension?.category?.label ?? {};
  const yearIndexes = yearDimension?.category?.index ?? {};
  const cropCount = data.size?.[0] ?? Object.keys(cropIndexes).length;
  const yearCount = data.size?.[1] ?? Object.keys(yearIndexes).length;
  const values = data.value ?? [];

  if (cropCount === 0 || yearCount === 0) {
    throw new Error("SURS PxWeb returned no crop yield dimensions.");
  }

  const byCropCode = {};

  for (const [cropCode, cropIndex] of Object.entries(cropIndexes)) {
    const history = Object.entries(yearIndexes)
      .map(([year, yearIndex]) => {
        const value = values[Number(cropIndex) * yearCount + Number(yearIndex)];
        return {
          year: Number(year),
          value: typeof value === "number" ? value : null,
        };
      })
      .filter((item) => item.value != null)
      .sort((a, b) => a.year - b.year);

    const cropName =
      CROP_NAME_SL[cropLabels[cropCode]] ?? cropLabels[cropCode] ?? cropCode;

    byCropCode[cropCode] = {
      cropCode,
      cropName,
      unit: "t/ha",
      history,
      latest: history[history.length - 1] ?? null,
      prediction: {
        year: history.length > 0 ? history[history.length - 1].year + 1 : null,
        value: predictNextYield(history),
      },
    };
  }

  sursYieldCache.set(regionCode, byCropCode);
  return byCropCode;
}

export async function fetchTopCropsForRegion(
  regionCode,
  regionLocation = null,
) {
  const data = await postSurs({
    query: [
      {
        code: "KMETIJSKE KULTURE",
        selection: { filter: "all", values: ["*"] },
      },
      { code: "LETO", selection: { filter: "top", values: ["1"] } },
      {
        code: STATISTICAL_REGION_DIMENSION,
        selection: { filter: "item", values: [String(regionCode)] },
      },
    ],
    response: { format: "json-stat2" },
  });

  const cropDimension = data.dimension?.["KMETIJSKE KULTURE"];
  const yearDimension = data.dimension?.LETO;
  const labels = cropDimension?.category?.label ?? {};
  const indexes = cropDimension?.category?.index ?? {};
  const yearLabels = yearDimension?.category?.label ?? {};
  const year = Object.values(yearLabels)[0] ?? null;

  const crops = Object.entries(indexes)
    .map(([code, index]) => ({
      code,
      name: CROP_NAME_SL[labels[code]] ?? labels[code] ?? code,
      value: data.value?.[index] ?? null,
    }))
    .filter((item) => typeof item.value === "number" && item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    source: "SURS",
    table: "1502410S",
    year,
    region: regionLocation?.regionName ?? getRegionName(String(regionCode)),
    regionCode: String(regionCode),
    location: regionLocation,
    unit: "t/ha",
    crops,
  };
}

export function getYieldStatsForParcela(parcela, yieldsByCropCode) {
  const cropCode = CROP_CODE_BY_LAND_USE[parcela.typeOfUse];
  if (!cropCode) return null;
  return yieldsByCropCode[cropCode] ?? null;
}
