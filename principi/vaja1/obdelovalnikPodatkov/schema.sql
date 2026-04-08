-- Vir 1: GERK parcele (MKO)
CREATE TABLE parcela (
    gerk_pid BIGINT PRIMARY KEY,
    type_of_use VARCHAR(100),
    coordinates GEOMETRY(Polygon, 4326) -- Uporaba PostGIS (tekoca realziacija je JSONB)
);

-- Vir 2: Vremenska napoved (Open-Meteo)
CREATE TABLE weather_forecast (
    id SERIAL PRIMARY KEY,
    gerk_pid BIGINT REFERENCES parcela(gerk_pid),
    date DATE,
    max_temp NUMERIC(5,2),
    min_temp NUMERIC(5,2),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6)
);
