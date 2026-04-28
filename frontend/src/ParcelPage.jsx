import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/parcele';

function getCentroid(geojson) {
  const coords = geojson?.coordinates?.[0];
  if (!coords || coords.length === 0) return null;

  const lon = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
  const lat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;

  return { lat, lon };
}

async function fetchSoil(lat, lon) {
  const url =
    `https://rest.isric.org/soilgrids/v2.0/properties/query` +
    `?lon=${lon}&lat=${lat}` +
    `&property=bdod&property=clay&property=sand&property=silt&property=phh2o&property=soc` +
    `&depth=0-5cm&value=mean`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('SoilGrids request failed');

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
  if (!res.ok) throw new Error('Open-Meteo request failed');

  return res.json();
}

function getSoilValue(soil, name) {
  const layer = soil?.properties?.layers?.find((l) => l.name === name);
  const value = layer?.depths?.[0]?.values?.mean;

  if (value == null) return null;

  const scales = {
    bdod: 100,
    clay: 10,
    sand: 10,
    silt: 10,
    phh2o: 10,
    soc: 10
  };

  return (value / scales[name]).toFixed(1);
}

const WMO_CODES = {
  0: 'Jasno',
  1: 'Pretežno jasno',
  2: 'Delno oblačno',
  3: 'Oblačno',
  45: 'Megla',
  48: 'Ledena megla',
  51: 'Rahla rosica',
  53: 'Zmerna rosica',
  55: 'Gosta rosica',
  61: 'Rahel dež',
  63: 'Zmeren dež',
  65: 'Močan dež',
  71: 'Rahel sneg',
  73: 'Zmeren sneg',
  75: 'Močan sneg',
  80: 'Rahli plohi',
  81: 'Zmerni plohi',
  82: 'Močni plohi',
  95: 'Nevihta'
};

function getWeatherLabel(code) {
  return WMO_CODES[code] ?? `Koda ${code}`;
}

function ParcelPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [parcela, setParcela] = useState(null);
  const [soil, setSoil] = useState(null);
  const [weather, setWeather] = useState(null);

  const [loading, setLoading] = useState(true);
  const [soilLoading, setSoilLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [error, setError] = useState(null);
  const [soilError, setSoilError] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setSoilError(null);
      setWeatherError(null);

      try {
        const res = await fetch(`${API_URL}/${id}`);

        if (!res.ok) {
          throw new Error('Parcela ni bila najdena');
        }

        const data = await res.json();
        setParcela(data);
        setLoading(false);

        const center = getCentroid(data.coordinates);

        if (!center) {
          setSoilError('Parcela nima veljavnih koordinat');
          setWeatherError('Parcela nima veljavnih koordinat');
          return;
        }

        setSoilLoading(true);
        fetchSoil(center.lat, center.lon)
          .then(setSoil)
          .catch((err) => setSoilError(err.message))
          .finally(() => setSoilLoading(false));

        setWeatherLoading(true);
        fetchWeather(center.lat, center.lon)
          .then(setWeather)
          .catch((err) => setWeatherError(err.message))
          .finally(() => setWeatherLoading(false));
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const center = parcela ? getCentroid(parcela.coordinates) : null;

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)}>← Back</button>

      <h1>Parcel Detail</h1>

      {loading && <p>Loading parcela...</p>}

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {parcela && (
        <>
          <h2>Parcela</h2>

          <p><strong>ID:</strong> {parcela.id}</p>
          <p><strong>GERK PID:</strong> {parcela.gerk_pid}</p>
          <p><strong>Type of use:</strong> {parcela.typeOfUse}</p>

          {center && (
            <p>
              <strong>Centroid:</strong>{' '}
              {center.lat.toFixed(6)}, {center.lon.toFixed(6)}
            </p>
          )}

          <hr />

          <h2>Open-Meteo vreme</h2>

          {weatherLoading && <p>Loading weather data...</p>}

          {weatherError && (
            <p style={{ color: 'red' }}>
              Open-Meteo error: {weatherError}
            </p>
          )}

          {weather?.current && (
            <div>
              <p>
                <strong>Trenutna temperatura:</strong>{' '}
                {weather.current.temperature_2m} °C
              </p>

              <p>
                <strong>Vlažnost:</strong>{' '}
                {weather.current.relative_humidity_2m} %
              </p>

              <p>
                <strong>Padavine:</strong>{' '}
                {weather.current.precipitation} mm
              </p>

              <p>
                <strong>Veter:</strong>{' '}
                {weather.current.wind_speed_10m} km/h
              </p>

              <p>
                <strong>Stanje:</strong>{' '}
                {getWeatherLabel(weather.current.weather_code)}
              </p>

              {weather.daily && (
                <>
                  <h3>7-dnevna napoved</h3>

                  <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
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
            <p style={{ color: 'red' }}>
              SoilGrids error: {soilError}
            </p>
          )}

          {soil && (
            <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td>Bulk density</td>
                  <td>{getSoilValue(soil, 'bdod')} kg/dm³</td>
                </tr>
                <tr>
                  <td>Clay</td>
                  <td>{getSoilValue(soil, 'clay')} %</td>
                </tr>
                <tr>
                  <td>Sand</td>
                  <td>{getSoilValue(soil, 'sand')} %</td>
                </tr>
                <tr>
                  <td>Silt</td>
                  <td>{getSoilValue(soil, 'silt')} %</td>
                </tr>
                <tr>
                  <td>pH H₂O</td>
                  <td>{getSoilValue(soil, 'phh2o')}</td>
                </tr>
                <tr>
                  <td>Soil organic carbon</td>
                  <td>{getSoilValue(soil, 'soc')} g/kg</td>
                </tr>
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default ParcelPage;