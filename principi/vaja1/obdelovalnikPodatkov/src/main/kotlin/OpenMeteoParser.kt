import com.fasterxml.jackson.databind.ObjectMapper
import java.net.URL

data class WeatherData(
    val date: String,
    val maxTemp: Double,
    val minTemp: Double
)

fun fetchWeatherData(latitude: Double, longitude: Double): List<WeatherData> {
    val url = "https://api.open-meteo.com/v1/forecast" +
            "?latitude=$latitude" +
            "&longitude=$longitude" +
            "&daily=temperature_2m_max,temperature_2m_min" +
            "&timezone=Europe/Ljubljana"

    val json = URL(url).readText()
    val mapper = ObjectMapper()
    val root = mapper.readTree(json)

    val daily = root["daily"]
    val dates = daily["time"]
    val maxTemps = daily["temperature_2m_max"]
    val minTemps = daily["temperature_2m_min"]

    return (0 until dates.size()).map { i ->
        WeatherData(
            date = dates[i].asText(),
            maxTemp = maxTemps[i].asDouble(),
            minTemp = minTemps[i].asDouble()
        )
    }
}