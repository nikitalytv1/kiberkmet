import express from 'express';

const router = express.Router();

const TABLE_URL = 'https://pxweb.stat.si/SiStatData/api/v1/en/Data/1502409S.px';

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

function getCohesionRegionCode(lon) {
  const parsedLon = Number(lon);

  if (!Number.isFinite(parsedLon)) {
    return '1';
  }

  return parsedLon < 14.8 ? '2' : '1';
}

function getCohesionRegionName(code) {
  return code === '2' ? 'Zahodna Slovenija' : 'Vzhodna Slovenija';
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

router.get('/top-crops', async (req, res) => {
  try {
    const regionCode = req.query.region ?? getCohesionRegionCode(req.query.lon);

    const data = await fetchJsonStat({
      query: [
        {
          code: 'MERITVE',
          selection: {
            filter: 'item',
            values: ['02']
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
          code: 'KOHEZIJSKA REGIJA',
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

    const cropDimension = data.dimension?.['VRSTE POSEVKOV NA NJIVAH'];
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

    return res.json({
      source: 'SURS',
      table: '1502409S',
      year,
      region: getCohesionRegionName(String(regionCode)),
      unit: 't',
      crops
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
});

export default router;
