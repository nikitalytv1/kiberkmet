import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./test.css";

const API_URL = "http://localhost:5001/api/parcele";
const SOIL_URL = "http://localhost:5001/api/soil";

const CROPS = [
  {
    id: "corn",
    label: "Koruza",
    minPh: 5.8,
    maxPh: 7.5,
    minTemp: 10,
    maxRain7d: 60,
    preferSandMax: 55,
    planting: "April–maj",
    plantingMonths: [4, 5],
  },
  {
    id: "potato",
    label: "Krompir",
    minPh: 5.0,
    maxPh: 6.5,
    minTemp: 7,
    maxRain7d: 50,
    preferSandMax: 70,
    planting: "Marec–april",
    plantingMonths: [3, 4],
  },
  {
    id: "wheat",
    label: "Pšenica",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 5,
    maxRain7d: 70,
    preferSandMax: 60,
    planting: "Oktober–november ali marec",
    plantingMonths: [3, 10, 11],
  },
  {
    id: "barley",
    label: "Ječmen",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 5,
    maxRain7d: 65,
    preferSandMax: 65,
    planting: "Marec–april ali september–oktober",
    plantingMonths: [3, 4, 9, 10],
  },
  {
    id: "oats",
    label: "Oves",
    minPh: 5.5,
    maxPh: 7.0,
    minTemp: 5,
    maxRain7d: 75,
    preferSandMax: 70,
    planting: "Marec–april",
    plantingMonths: [3, 4],
  },
  {
    id: "rye",
    label: "Rž",
    minPh: 5.0,
    maxPh: 7.0,
    minTemp: 4,
    maxRain7d: 70,
    preferSandMax: 75,
    planting: "September–oktober",
    plantingMonths: [9, 10],
  },
  {
    id: "soybean",
    label: "Soja",
    minPh: 6.0,
    maxPh: 7.2,
    minTemp: 12,
    maxRain7d: 60,
    preferSandMax: 60,
    planting: "April–maj",
    plantingMonths: [4, 5],
  },
  {
    id: "sunflower",
    label: "Sončnica",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 10,
    maxRain7d: 55,
    preferSandMax: 70,
    planting: "April",
    plantingMonths: [4],
  },
  {
    id: "rapeseed",
    label: "Oljna ogrščica",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 5,
    maxRain7d: 65,
    preferSandMax: 60,
    planting: "Avgust–september",
    plantingMonths: [8, 9],
  },
  {
    id: "pumpkin",
    label: "Buče",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 12,
    maxRain7d: 55,
    preferSandMax: 65,
    planting: "April–maj",
    plantingMonths: [4, 5],
  },
  {
    id: "beans",
    label: "Fižol",
    minPh: 6.0,
    maxPh: 7.2,
    minTemp: 12,
    maxRain7d: 50,
    preferSandMax: 65,
    planting: "Maj",
    plantingMonths: [5],
  },
  {
    id: "peas",
    label: "Grah",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 5,
    maxRain7d: 60,
    preferSandMax: 65,
    planting: "Marec–april",
    plantingMonths: [3, 4],
  },
  {
    id: "cabbage",
    label: "Zelje",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 7,
    maxRain7d: 70,
    preferSandMax: 60,
    planting: "Marec–maj ali julij",
    plantingMonths: [3, 4, 5, 7],
  },
  {
    id: "carrot",
    label: "Korenje",
    minPh: 6.0,
    maxPh: 7.0,
    minTemp: 7,
    maxRain7d: 55,
    preferSandMax: 80,
    planting: "Marec–junij",
    plantingMonths: [3, 4, 5, 6],
  },
  {
    id: "onion",
    label: "Čebula",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 8,
    maxRain7d: 45,
    preferSandMax: 70,
    planting: "Marec–april",
    plantingMonths: [3, 4],
  },
  {
    id: "garlic",
    label: "Česen",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 5,
    maxRain7d: 50,
    preferSandMax: 70,
    planting: "Oktober–november ali februar–marec",
    plantingMonths: [2, 3, 10, 11],
  },
  {
    id: "lettuce",
    label: "Solata",
    minPh: 6.0,
    maxPh: 7.0,
    minTemp: 5,
    maxRain7d: 60,
    preferSandMax: 70,
    planting: "Marec–maj ali avgust–september",
    plantingMonths: [3, 4, 5, 8, 9],
  },
  {
    id: "tomato",
    label: "Paradižnik",
    minPh: 6.0,
    maxPh: 7.0,
    minTemp: 13,
    maxRain7d: 45,
    preferSandMax: 70,
    planting: "Maj",
    plantingMonths: [5],
  },
  {
    id: "pepper",
    label: "Paprika",
    minPh: 6.0,
    maxPh: 7.0,
    minTemp: 15,
    maxRain7d: 45,
    preferSandMax: 70,
    planting: "Maj",
    plantingMonths: [5],
  },
  {
    id: "cucumber",
    label: "Kumare",
    minPh: 6.0,
    maxPh: 7.2,
    minTemp: 14,
    maxRain7d: 55,
    preferSandMax: 70,
    planting: "Maj–junij",
    plantingMonths: [5, 6],
  },
  {
    id: "apple",
    label: "Jablana",
    minPh: 6.0,
    maxPh: 7.0,
    minTemp: 5,
    maxRain7d: 80,
    preferSandMax: 70,
    planting: "Jesen ali zgodnja pomlad",
    plantingMonths: [3, 4, 10, 11],
  },
  {
    id: "pear",
    label: "Hruška",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 5,
    maxRain7d: 75,
    preferSandMax: 70,
    planting: "Jesen ali zgodnja pomlad",
    plantingMonths: [3, 4, 10, 11],
  },
  {
    id: "plum",
    label: "Sliva",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 5,
    maxRain7d: 75,
    preferSandMax: 70,
    planting: "Jesen ali zgodnja pomlad",
    plantingMonths: [3, 4, 10, 11],
  },
  {
    id: "cherry",
    label: "Češnja",
    minPh: 6.2,
    maxPh: 7.5,
    minTemp: 6,
    maxRain7d: 60,
    preferSandMax: 75,
    planting: "Jesen ali zgodnja pomlad",
    plantingMonths: [3, 4, 10, 11],
  },
  {
    id: "grape",
    label: "Vinska trta",
    minPh: 5.5,
    maxPh: 7.5,
    minTemp: 12,
    maxRain7d: 40,
    preferSandMax: 80,
    planting: "Marec–april",
    plantingMonths: [3, 4],
  },
  {
    id: "strawberry",
    label: "Jagode",
    minPh: 5.5,
    maxPh: 6.8,
    minTemp: 8,
    maxRain7d: 55,
    preferSandMax: 75,
    planting: "Marec–april ali avgust–september",
    plantingMonths: [3, 4, 8, 9],
  },
  {
    id: "grass",
    label: "Travnik / trava",
    minPh: 5.5,
    maxPh: 7.2,
    minTemp: 6,
    maxRain7d: 80,
    preferSandMax: 75,
    planting: "Marec–maj ali september",
    plantingMonths: [3, 4, 5, 9],
  },
  {
    id: "alfalfa",
    label: "Lucerna",
    minPh: 6.5,
    maxPh: 7.8,
    minTemp: 8,
    maxRain7d: 70,
    preferSandMax: 65,
    planting: "Marec–april ali avgust",
    plantingMonths: [3, 4, 8],
  },
  {
    id: "clover",
    label: "Detelja",
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 7,
    maxRain7d: 75,
    preferSandMax: 70,
    planting: "Marec–april ali september",
    plantingMonths: [3, 4, 9],
  },
];

const WMO_CODES = {
  0: "Jasno",
  1: "Pretežno jasno",
  2: "Delno oblačno",
  3: "Oblačno",
  45: "Megla",
  48: "Ledena megla",
  51: "Rahla rosica",
  53: "Zmerna rosica",
  55: "Gosta rosica",
  61: "Rahel dež",
  63: "Zmeren dež",
  65: "Močan dež",
  71: "Rahel sneg",
  73: "Zmeren sneg",
  75: "Močan sneg",
  80: "Rahli plohi",
  81: "Zmerni plohi",
  82: "Močni plohi",
  95: "Nevihta",
};

function getWeatherLabel(code) {
  return WMO_CODES[code] ?? `Koda ${code}`;
}

function getMonthName(month) {
  const names = [
    "",
    "januar",
    "februar",
    "marec",
    "april",
    "maj",
    "junij",
    "julij",
    "avgust",
    "september",
    "oktober",
    "november",
    "december",
  ];

  return names[month];
}

function formatMonths(months) {
  return months.map(getMonthName).join(", ");
}

function getCentroid(geojson) {
  const coords = geojson?.coordinates?.[0];
  if (!coords || coords.length === 0) return null;

  const lon = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
  const lat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;

  return { lat, lon };
}

async function fetchSoil(lat, lon) {
  const res = await fetch(`${SOIL_URL}?lat=${lat}&lon=${lon}`);

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Soil backend endpoint failed");
  }

  return res.json();
}

async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=auto` +
    `&forecast_days=7`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Open-Meteo request failed");
  }

  return res.json();
}

function getLayerValue(source, name) {
  const layer = source?.properties?.layers?.find((l) => l.name === name);
  return layer?.depths?.[0]?.values?.mean ?? null;
}

function getSoilValue(soil, name) {
  let source = soil?.physical;

  if (["phh2o", "cec", "nitrogen", "soc"].includes(name)) {
    source = soil?.chemical;
  }

  if (["ocd", "ocs"].includes(name)) {
    source = soil?.derived;
  }

  const value = getLayerValue(source, name);

  if (value == null) return null;

  const scales = {
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

function getSoilTextureClass(sand, silt, clay) {
  if (sand == null || silt == null || clay == null) return "Neznana tekstura";

  if (clay >= 40) return "Glinena tla";
  if (sand >= 70) return "Peščena tla";
  if (silt >= 70) return "Meljasta tla";

  if (
    sand >= 40 &&
    sand <= 60 &&
    clay >= 10 &&
    clay <= 30 &&
    silt >= 20 &&
    silt <= 50
  ) {
    return "Ilovnata tla";
  }

  if (sand > 55 && clay < 25) return "Peščeno-ilovnata tla";
  if (clay >= 30 && clay < 40) return "Glineno-ilovnata tla";
  if (silt >= 50 && clay < 30) return "Meljasto-ilovnata tla";

  return "Mešana tekstura tal";
}

function getSoilTextureAdvice(sand, silt, clay) {
  const advice = [];

  if (sand >= 70) {
    advice.push(
      "Tla so zelo peščena: voda in hranila se lahko hitro izpirajo.",
    );
  }

  if (clay >= 40) {
    advice.push(
      "Tla imajo veliko gline: možna je slabša drenaža in zastajanje vode.",
    );
  }

  if (silt >= 70) {
    advice.push(
      "Tla imajo veliko melja: dobra rodovitnost, vendar lahko pride do zbitosti tal.",
    );
  }

  if (
    sand >= 40 &&
    sand <= 60 &&
    clay >= 10 &&
    clay <= 30 &&
    silt >= 20 &&
    silt <= 50
  ) {
    advice.push(
      "Tekstura je blizu ilovice, kar je zelo dobro za večino pridelkov.",
    );
  }

  return advice;
}

function evaluateCrop({ crop, soil, weather }) {
  if (!crop || !soil || !weather?.current || !weather?.daily) return null;

  const ph = getSoilValue(soil, "phh2o");
  const sand = getSoilValue(soil, "sand");
  const silt = getSoilValue(soil, "silt");
  const clay = getSoilValue(soil, "clay");
  const nitrogen = getSoilValue(soil, "nitrogen");
  const soc = getSoilValue(soil, "soc");
  const temp = Number(weather.current.temperature_2m);
  const currentMonth = new Date().getMonth() + 1;

  const rain7d = weather.daily.precipitation_sum.reduce(
    (sum, value) => sum + Number(value || 0),
    0,
  );

  const textureClass = getSoilTextureClass(sand, silt, clay);

  let score = 100;
  const reasons = [];

  if (!crop.plantingMonths.includes(currentMonth)) {
    score -= 35;
    reasons.push(
      `Trenutno ni primeren mesec za sajenje (${getMonthName(currentMonth)}). Primernejši meseci: ${formatMonths(crop.plantingMonths)}.`,
    );
  } else {
    reasons.push(
      `Trenutni mesec (${getMonthName(currentMonth)}) je primeren za sajenje.`,
    );
  }

  if (ph == null) {
    score -= 10;
    reasons.push("pH podatek ni na voljo.");
  } else if (ph < crop.minPh) {
    score -= 25;
    reasons.push(
      `pH je prenizek (${ph}); pridelek ima raje vsaj ${crop.minPh}.`,
    );
  } else if (ph > crop.maxPh) {
    score -= 25;
    reasons.push(
      `pH je previsok (${ph}); pridelek ima raje največ ${crop.maxPh}.`,
    );
  } else {
    reasons.push(`pH je primeren (${ph}).`);
  }

  if (temp < crop.minTemp) {
    score -= 25;
    reasons.push(`Trenutna temperatura je prenizka (${temp} °C).`);
  } else {
    reasons.push(`Temperatura je primerna (${temp} °C).`);
  }

  if (rain7d > crop.maxRain7d) {
    score -= 20;
    reasons.push(
      `V naslednjih 7 dneh je napovedanih precej padavin (${rain7d.toFixed(1)} mm).`,
    );
  } else {
    reasons.push(
      `Padavine v naslednjih 7 dneh so sprejemljive (${rain7d.toFixed(1)} mm).`,
    );
  }

  if (sand != null && sand > crop.preferSandMax) {
    score -= 15;
    reasons.push(
      `Tla so precej peščena (${sand} %), zato lahko slabše zadržujejo vodo.`,
    );
  }

  if (clay != null && clay > 45) {
    score -= 15;
    reasons.push(
      `Tla imajo veliko gline (${clay} %), možna je slabša odcednost.`,
    );
  }

  if (sand != null && silt != null && clay != null) {
    reasons.push(`Tekstura tal: ${textureClass}.`);

    const textureAdvice = getSoilTextureAdvice(sand, silt, clay);
    textureAdvice.forEach((item) => reasons.push(item));
  }

  if (nitrogen != null) {
    if (nitrogen < 0.1) {
      score -= 10;
      reasons.push(
        `Dušika je malo (${nitrogen} g/kg). Priporočljivo je preveriti potrebo po gnojenju.`,
      );
    } else if (nitrogen < 0.2) {
      score -= 5;
      reasons.push(`Dušika je zmerno (${nitrogen} g/kg).`);
    } else {
      reasons.push(`Dušika je dovolj (${nitrogen} g/kg).`);
    }
  }

  if (soc != null) {
    if (soc < 10) {
      score -= 10;
      reasons.push(
        `Organski ogljik je nizek (${soc} g/kg), kar pomeni slabšo dolgoročno rodovitnost.`,
      );
    } else if (soc < 20) {
      reasons.push(`Organski ogljik je srednji (${soc} g/kg).`);
    } else {
      score += 5;
      reasons.push(
        `Organski ogljik je dober (${soc} g/kg), kar podpira rodovitnost in zadrževanje vode.`,
      );
    }
  }

  score = Math.max(0, Math.min(100, score));

  let recommendation = "Ni priporočeno";
  if (score >= 75) recommendation = "Priporočeno";
  else if (score >= 50) recommendation = "Možno, ampak z zadržki";

  let plantingAdvice;

  if (!crop.plantingMonths.includes(currentMonth)) {
    plantingAdvice = `Ne priporočam sajenja zdaj. Priporočeni meseci: ${formatMonths(crop.plantingMonths)}.`;
  } else if (temp < crop.minTemp) {
    plantingAdvice = "Počakaj, da se temperatura dvigne.";
  } else if (rain7d > crop.maxRain7d) {
    plantingAdvice = "Počakaj, da mine obdobje močnejših padavin.";
  } else {
    plantingAdvice =
      "Glede na mesec, tla in trenutno vreme je sajenje možno v kratkem.";
  }

  return {
    score,
    recommendation,
    reasons,
    plantingAdvice,
    usualPlanting: crop.planting,
    textureClass,
  };
}

function ParcelPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [parcela, setParcela] = useState(null);
  const [soil, setSoil] = useState(null);
  const [weather, setWeather] = useState(null);
  const [selectedCropId, setSelectedCropId] = useState("");

  const [loading, setLoading] = useState(true);
  const [soilLoading, setSoilLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [error, setError] = useState(null);
  const [soilError, setSoilError] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setSoilError(null);
      setWeatherError(null);

      try {
        const res = await fetch(`${API_URL}/${id}`);

        if (!res.ok) {
          throw new Error("Parcela ni bila najdena");
        }

        const data = await res.json();

        if (!isMounted) return;

        setParcela(data);
        setLoading(false);

        const center = getCentroid(data.coordinates);

        if (!center) {
          setSoilError("Parcela nima veljavnih koordinat");
          setWeatherError("Parcela nima veljavnih koordinat");
          return;
        }

        setSoilLoading(true);
        fetchSoil(center.lat, center.lon)
          .then((soilData) => {
            if (isMounted) setSoil(soilData);
          })
          .catch((err) => {
            if (isMounted) setSoilError(err.message);
          })
          .finally(() => {
            if (isMounted) setSoilLoading(false);
          });

        setWeatherLoading(true);
        fetchWeather(center.lat, center.lon)
          .then((weatherData) => {
            if (isMounted) setWeather(weatherData);
          })
          .catch((err) => {
            if (isMounted) setWeatherError(err.message);
          })
          .finally(() => {
            if (isMounted) setWeatherLoading(false);
          });
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const center = parcela ? getCentroid(parcela.coordinates) : null;
  const selectedCrop = CROPS.find((crop) => crop.id === selectedCropId);

  const sand = soil ? getSoilValue(soil, "sand") : null;
  const silt = soil ? getSoilValue(soil, "silt") : null;
  const clay = soil ? getSoilValue(soil, "clay") : null;
  const textureClass = getSoilTextureClass(sand, silt, clay);

  const cropEvaluation = evaluateCrop({
    crop: selectedCrop,
    soil,
    weather,
  });

  return (
    <div className="test-page">
      <div style={{ padding: 20 }}>
        <button onClick={() => navigate(-1)}>← Back</button>

        <h1>Parcel Detail</h1>

        {loading && <p>Loading parcela...</p>}

        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {parcela && (
          <>
            <h2>Parcela</h2>

            <p>
              <strong>ID:</strong> {parcela.id}
            </p>
            <p>
              <strong>GERK PID:</strong> {parcela.gerk_pid}
            </p>
            <p>
              <strong>Type of use:</strong> {parcela.typeOfUse}
            </p>

            {center && (
              <p>
                <strong>Centroid:</strong> {center.lat.toFixed(6)},{" "}
                {center.lon.toFixed(6)}
              </p>
            )}

            <hr />

            <h2>Open-Meteo vreme</h2>

            {weatherLoading && <p>Loading weather data...</p>}

            {weatherError && (
              <p style={{ color: "red" }}>Open-Meteo error: {weatherError}</p>
            )}

            {weather?.current && (
              <div>
                <p>
                  <strong>Temperatura:</strong> {weather.current.temperature_2m}{" "}
                  °C
                </p>
                <p>
                  <strong>Vlažnost:</strong>{" "}
                  {weather.current.relative_humidity_2m} %
                </p>
                <p>
                  <strong>Padavine:</strong> {weather.current.precipitation} mm
                </p>
                <p>
                  <strong>Veter:</strong> {weather.current.wind_speed_10m} km/h
                </p>
                <p>
                  <strong>Stanje:</strong>{" "}
                  {getWeatherLabel(weather.current.weather_code)}
                </p>

                {weather.daily && (
                  <>
                    <h3>7-dnevna napoved</h3>

                    <table
                      border="1"
                      cellPadding="8"
                      style={{ borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Min °C</th>
                          <th>Max °C</th>
                          <th>Padavine mm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weather.daily.time.map((date, index) => (
                          <tr key={date}>
                            <td>{date}</td>
                            <td>{weather.daily.temperature_2m_min[index]}</td>
                            <td>{weather.daily.temperature_2m_max[index]}</td>
                            <td>{weather.daily.precipitation_sum[index]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

            <hr />

            <h2>SoilGrids podatki</h2>

            {soilLoading && <p>Loading soil data...</p>}

            {soilError && (
              <p style={{ color: "red" }}>SoilGrids error: {soilError}</p>
            )}

            {soil && (
              <>
                <h3>Tekstura tal</h3>

                <p>
                  <strong>Razred teksture:</strong> {textureClass}
                </p>

                <table
                  border="1"
                  cellPadding="8"
                  style={{ borderCollapse: "collapse" }}
                >
                  <tbody>
                    <tr>
                      <td>Sand / pesek</td>
                      <td>{sand} %</td>
                    </tr>
                    <tr>
                      <td>Silt / melj</td>
                      <td>{silt} %</td>
                    </tr>
                    <tr>
                      <td>Clay / glina</td>
                      <td>{clay} %</td>
                    </tr>
                  </tbody>
                </table>

                <h3>Physical soil properties</h3>

                <table
                  border="1"
                  cellPadding="8"
                  style={{ borderCollapse: "collapse" }}
                >
                  <tbody>
                    <tr>
                      <td>Bulk density</td>
                      <td>{getSoilValue(soil, "bdod")} kg/dm³</td>
                    </tr>
                    <tr>
                      <td>Clay</td>
                      <td>{getSoilValue(soil, "clay")} %</td>
                    </tr>
                    <tr>
                      <td>Sand</td>
                      <td>{getSoilValue(soil, "sand")} %</td>
                    </tr>
                    <tr>
                      <td>Silt</td>
                      <td>{getSoilValue(soil, "silt")} %</td>
                    </tr>
                    <tr>
                      <td>Coarse fragments</td>
                      <td>{getSoilValue(soil, "cfvo")} %</td>
                    </tr>
                    <tr>
                      <td>Water content 10kPa</td>
                      <td>{getSoilValue(soil, "wv0010")}</td>
                    </tr>
                    <tr>
                      <td>Water content 33kPa</td>
                      <td>{getSoilValue(soil, "wv0033")}</td>
                    </tr>
                    <tr>
                      <td>Water content 1500kPa</td>
                      <td>{getSoilValue(soil, "wv1500")}</td>
                    </tr>
                  </tbody>
                </table>

                <h3>Chemical soil properties</h3>

                <table
                  border="1"
                  cellPadding="8"
                  style={{ borderCollapse: "collapse" }}
                >
                  <tbody>
                    <tr>
                      <td>pH H₂O</td>
                      <td>{getSoilValue(soil, "phh2o")}</td>
                    </tr>
                    <tr>
                      <td>CEC</td>
                      <td>{getSoilValue(soil, "cec")} cmol(c)/kg</td>
                    </tr>
                    <tr>
                      <td>Total nitrogen</td>
                      <td>{getSoilValue(soil, "nitrogen")} g/kg</td>
                    </tr>
                    <tr>
                      <td>Soil organic carbon</td>
                      <td>{getSoilValue(soil, "soc")} g/kg</td>
                    </tr>
                  </tbody>
                </table>

                <h3>Derived soil properties</h3>

                <table
                  border="1"
                  cellPadding="8"
                  style={{ borderCollapse: "collapse" }}
                >
                  <tbody>
                    <tr>
                      <td>Organic carbon density</td>
                      <td>{getSoilValue(soil, "ocd")}</td>
                    </tr>
                    <tr>
                      <td>Organic carbon stock</td>
                      <td>{getSoilValue(soil, "ocs")}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            <hr />

            <h2>Priporočilo za pridelek</h2>

            <label>
              Izberi pridelek:{" "}
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
              >
                <option value="">-- Izberi pridelek --</option>
                {CROPS.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedCropId && (!soil || !weather) && (
              <p>Najprej se morajo naložiti SoilGrids in Open-Meteo podatki.</p>
            )}

            {cropEvaluation && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  background: "#0000",
                  color: "#FFFF",
                }}
              >
                <h3>{selectedCrop.label}</h3>

                <p>
                  <strong>Ocena primernosti:</strong> {cropEvaluation.score}/100
                </p>
                <p>
                  <strong>Priporočilo:</strong> {cropEvaluation.recommendation}
                </p>
                <p>
                  <strong>Običajen čas sajenja:</strong>{" "}
                  {cropEvaluation.usualPlanting}
                </p>
                <p>
                  <strong>Kdaj saditi glede na vreme:</strong>{" "}
                  {cropEvaluation.plantingAdvice}
                </p>
                <p>
                  <strong>Tekstura:</strong> {cropEvaluation.textureClass}
                </p>

                <h4>Razlogi:</h4>
                <ul>
                  {cropEvaluation.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ParcelPage;
