const SOILGRIDS_BASE = "https://dev-rest.isric.org/soilgrids/v2.0";

const PHYSICAL_PROPERTIES = [
  "bdod",
  "clay",
  "cfvo",
  "sand",
  "silt",
  "wv0010",
  "wv0033",
  "wv1500",
];
const CHEMICAL_PROPERTIES = ["phh2o", "cec", "nitrogen", "soc"];
const DERIVED_PROPERTIES = ["ocd", "ocs"];

async function fetchJsonOrThrow(url, label) {
  const res = await fetch(url);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.detail ?? data?.error ?? res.statusText;
    throw new Error(`${label} failed (${res.status}): ${detail}`);
  }

  return data;
}

function buildPropertiesUrl(lon, lat, properties) {
  const params = new URLSearchParams({
    lon: String(lon),
    lat: String(lat),
    depth: "0-5cm",
  });
  properties.forEach((p) => params.append("property", p));
  ["mean", "Q0.05", "Q0.95"].forEach((v) => params.append("value", v));
  return `${SOILGRIDS_BASE}/properties/query?${params.toString()}`;
}

function pickLayers(source, names) {
  const layers = source?.properties?.layers ?? [];
  return {
    ...source,
    properties: {
      ...(source?.properties ?? {}),
      layers: layers.filter((layer) => names.includes(layer.name)),
    },
  };
}

export async function fetchSoilAnalysis(lon, lat) {
  const allProperties = [
    ...PHYSICAL_PROPERTIES,
    ...CHEMICAL_PROPERTIES,
    ...DERIVED_PROPERTIES,
  ];
  const data = await fetchJsonOrThrow(
    buildPropertiesUrl(lon, lat, allProperties),
    "SoilGrids properties",
  );

  return {
    physical: pickLayers(data, PHYSICAL_PROPERTIES),
    chemical: pickLayers(data, CHEMICAL_PROPERTIES),
    derived: pickLayers(data, DERIVED_PROPERTIES),
    classification: null,
  };
}

export async function fetchSoilData(lat, lon) {
  const physicalUrl =
    `${SOILGRIDS_BASE}/properties/query?lon=${lon}&lat=${lat}` +
    `&property=bdod&property=clay&property=cfvo&property=sand&property=silt` +
    `&property=wv0010&property=wv0033&property=wv1500` +
    `&value=mean&value=Q0.05&value=Q0.95`;

  const chemicalUrl =
    `${SOILGRIDS_BASE}/properties/query?lon=${lon}&lat=${lat}` +
    `&property=phh2o&property=cec&property=nitrogen&property=soc` +
    `&value=mean&value=Q0.05&value=Q0.95`;

  const classificationUrl = `${SOILGRIDS_BASE}/classification/query?lon=${lon}&lat=${lat}`;

  const derivedUrl =
    `${SOILGRIDS_BASE}/properties/query?lon=${lon}&lat=${lat}` +
    `&property=ocd&property=ocs` +
    `&value=mean&value=Q0.05&value=Q0.95`;

  const [physicalRes, chemicalRes, classificationRes, derivedRes] =
    await Promise.all([
      fetch(physicalUrl),
      fetch(chemicalUrl),
      fetch(classificationUrl),
      fetch(derivedUrl),
    ]);

  if (!physicalRes.ok) throw new Error("Physical soil failed");
  if (!chemicalRes.ok) throw new Error("Chemical soil failed");
  if (!classificationRes.ok) throw new Error("Classification failed");
  if (!derivedRes.ok) throw new Error("Derived soil failed");

  const [physical, chemical, classification, derived] = await Promise.all([
    physicalRes.json(),
    chemicalRes.json(),
    classificationRes.json(),
    derivedRes.json(),
  ]);

  return { physical, chemical, classification, derived };
}
