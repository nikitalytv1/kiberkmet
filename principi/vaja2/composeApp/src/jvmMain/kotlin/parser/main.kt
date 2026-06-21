package parser

import com.fasterxml.jackson.core.JsonFactory
import com.fasterxml.jackson.core.JsonParseException
import com.fasterxml.jackson.core.JsonToken
import com.fasterxml.jackson.databind.ObjectMapper
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

private data class GerkFeatureCache(
    val path: String,
    val lastModified: Long,
    val length: Long,
    val features: List<FeatureItem>
)

private var gerkFeatureCache: GerkFeatureCache? = null


fun mapRaba(rabaId: Int): String {
    return when(rabaId) {
        //Šifranti zemljišč https://www.uradni-list.si/files/RS_-2008-122-05471-OB~P001-0000.PDF
        1100 -> "Njiva"
        1160 -> "Hmeljišče"
        1180 -> "Trajne rastline"
        1190 -> "Rastlinjak"
        1211 -> "Vinograd"
        1212 -> "Matičnjak"
        1221 -> "Intenzivni sadovnjak"
        1222 -> "Ekstenzivni sadovnjak"
        1230 -> "Oljčnik"
        1240 -> "Ostali trajni nasadi"
        1300 -> "Trajni travnik"
        1321 -> "Barjanski travnik"
        1410 -> "Zaraščajoče kmetijsko zemljišče"
        1420 -> "Plantaža gozdnega drevja"
        1500 -> "Drevesa in grmičevje"
        1800 -> "KMZGO: kmetijsko z drevjem"
        2000 -> "Gozd"
        3000 -> "Pozidano"
        4100 -> "Barje"
        4210 -> "Trstje"
        4220 -> "Ostalo zamočvirjeno"
        5000 -> "Suho odprto"
        6000 -> "Odprto"
        7000 -> "Voda"
        else -> "Neznano"
    }
}
fun download(fileID: String, outputFile: File) {
    // Nov Google Drive URL format
    val url = "https://drive.usercontent.google.com/download?id=$fileID&export=download&confirm=t"

    //Prenos datoteke prek google drive
    val connection = URL(url).openConnection() as HttpURLConnection
    connection.setRequestProperty("User-Agent", "Mozilla/5.0")
    connection.instanceFollowRedirects = true
    connection.connect()

    if (connection.responseCode != 200) {
        error("Download neuspešen: ${connection.responseCode}")
    }
    outputFile.parentFile?.mkdirs()

    //buffer output za json datoteko
    connection.inputStream.use { input ->
        outputFile.outputStream().use { output ->
            input.copyTo(output, bufferSize = 8 * 1024)
        }
    }
}

fun loadGerkFeatures(localFile: File, fileID: String = "1b8csxaBYCpevGbgONtekxM_xTo4vGety"): List<FeatureItem> {
    if (!localFile.exists() || localFile.length() == 0L) {
        download(fileID, localFile)
    }

    val cachePath = localFile.absoluteFile.normalize().path
    gerkFeatureCache?.let { cache ->
        if (cache.path == cachePath && cache.lastModified == localFile.lastModified() && cache.length == localFile.length()) {
            return cache.features
        }
    }

    val features = try {
        parseGerkFile(localFile)
    } catch (error: JsonParseException) {
        val tmpFile = File(localFile.parentFile ?: File("."), "${localFile.name}.tmp")
        if (tmpFile.exists()) tmpFile.delete()

        download(fileID, tmpFile)

        if (localFile.exists()) localFile.delete()
        if (!tmpFile.renameTo(localFile)) {
            tmpFile.copyTo(localFile, overwrite = true)
            tmpFile.delete()
        }

        parseGerkFile(localFile)
    }

    gerkFeatureCache = GerkFeatureCache(cachePath, localFile.lastModified(), localFile.length(), features)
    return features
}

fun extractCoordinates(geometry: Map<String, Any>): List<List<Double>> {
    val type = geometry["type"] as? String ?: return emptyList()
    val coords = geometry["coordinates"] ?: return emptyList()

    return when (type) {
        "Point" -> {
            val point = coords as? List<*> ?: return emptyList()
            listOf(point.filterIsInstance<Number>().map { it.toDouble() })
        }
        "Polygon" -> {
            val rings = coords as? List<*> ?: return emptyList()
            val outer = rings.firstOrNull() as? List<*> ?: return emptyList()
            outer.filterIsInstance<List<*>>().map { point ->
                point.filterIsInstance<Number>().map { it.toDouble() }
            }
        }
        "MultiPolygon" -> {
            val polygons = coords as? List<*> ?: return emptyList()
            val firstPoly = polygons.firstOrNull() as? List<*> ?: return emptyList()
            val outer = firstPoly.firstOrNull() as? List<*> ?: return emptyList()
            outer.filterIsInstance<List<*>>().map { point ->
                point.filterIsInstance<Number>().map { it.toDouble() }
            }
        }
        else -> emptyList()
    }
}

private fun readPointCoordinates(parser: com.fasterxml.jackson.core.JsonParser): List<Double> {
    val point = mutableListOf<Double>()
    if (parser.currentToken != JsonToken.START_ARRAY) {
        parser.skipChildren()
        return point
    }

    while (parser.nextToken() != JsonToken.END_ARRAY) {
        if (parser.currentToken?.isNumeric == true) {
            point.add(parser.doubleValue)
        } else {
            parser.skipChildren()
        }
    }
    return point
}

private fun readLinearRing(parser: com.fasterxml.jackson.core.JsonParser): List<List<Double>> {
    val ring = mutableListOf<List<Double>>()
    if (parser.currentToken != JsonToken.START_ARRAY) {
        parser.skipChildren()
        return ring
    }

    while (parser.nextToken() != JsonToken.END_ARRAY) {
        if (parser.currentToken == JsonToken.START_ARRAY) {
            val point = readPointCoordinates(parser)
            if (point.size >= 2) ring.add(point)
        } else {
            parser.skipChildren()
        }
    }
    return ring
}

private fun readCoordinates(parser: com.fasterxml.jackson.core.JsonParser, geometryType: String?): List<List<Double>> {
    if (parser.currentToken != JsonToken.START_ARRAY) {
        parser.skipChildren()
        return emptyList()
    }

    return when (geometryType) {
        "Point" -> {
            val point = readPointCoordinates(parser)
            if (point.size >= 2) listOf(point) else emptyList()
        }
        "Polygon" -> {
            if (parser.nextToken() == JsonToken.START_ARRAY) {
                val outer = readLinearRing(parser)
                while (parser.nextToken() != JsonToken.END_ARRAY) {
                    parser.skipChildren()
                }
                outer
            } else {
                parser.skipChildren()
                emptyList()
            }
        }
        "MultiPolygon" -> {
            if (parser.nextToken() == JsonToken.START_ARRAY && parser.nextToken() == JsonToken.START_ARRAY) {
                val outer = readLinearRing(parser)
                while (parser.nextToken() != JsonToken.END_ARRAY) {
                    parser.skipChildren()
                }
                while (parser.nextToken() != JsonToken.END_ARRAY) {
                    parser.skipChildren()
                }
                outer
            } else {
                parser.skipChildren()
                emptyList()
            }
        }
        else -> {
            parser.skipChildren()
            emptyList()
        }
    }
}

private fun readGeometryCoordinates(parser: com.fasterxml.jackson.core.JsonParser): List<List<Double>> {
    var geometryType: String? = null
    var coordinates = emptyList<List<Double>>()

    if (parser.currentToken != JsonToken.START_OBJECT) {
        parser.skipChildren()
        return coordinates
    }

    while (parser.nextToken() != JsonToken.END_OBJECT) {
        val fieldName = parser.currentName
        parser.nextToken()
        when (fieldName) {
            "type" -> geometryType = parser.valueAsString
            "coordinates" -> coordinates = readCoordinates(parser, geometryType)
            else -> parser.skipChildren()
        }
    }

    return coordinates
}

data class FeatureItem(
    val gerkPID: Long,
    val rabaId: Int,
    val coordinates: List<List<Double>>
) {
    val typeOfUse: String get() = mapRaba(rabaId)
}

fun parseGerkFile(localFile: File): List<FeatureItem> {
    val factory = JsonFactory()
    val parser = factory.createParser(localFile)
    val features = mutableListOf<FeatureItem>()
    while (parser.nextToken() != null) {
        if (parser.currentName == "features") { parser.nextToken(); break }
    }
    while (parser.nextToken() != JsonToken.END_ARRAY) {
        var gerkPID: Long? = null
        var rabaID: Int? = null
        var coordinates: List<List<Double>>? = null
        while (parser.nextToken() != JsonToken.END_OBJECT) {
            val fieldName = parser.currentName
            if (fieldName == "properties") {
                parser.nextToken()
                while (parser.nextToken() != JsonToken.END_OBJECT) {
                    val propName = parser.currentName
                    parser.nextToken()
                    when (propName) {
                        "GERK_PID" -> gerkPID = parser.longValue
                        "RABA_ID"  -> rabaID  = parser.intValue
                        else       -> parser.skipChildren()
                    }
                }
            } else if (fieldName == "geometry") {
                parser.nextToken()
                coordinates = readGeometryCoordinates(parser)
            } else {
                parser.nextToken()
                parser.skipChildren()
            }
        }
        if (gerkPID != null && rabaID != null && coordinates != null) {
            features.add(FeatureItem(gerkPID, rabaID, coordinates))
        }
    }
    return features
}

fun main() {
    val localFile = File("field.json")
    if (!localFile.exists()) {
        download("1b8csxaBYCpevGbgONtekxM_xTo4vGety", localFile)
    }
    val mapper = ObjectMapper()
    val factory = JsonFactory()
    val parser = factory.createParser(localFile)
    val features = mutableListOf<FeatureItem>()
    // Pomik do polja "features"
    while (parser.nextToken() != null) {
        if (parser.currentName == "features") {
            parser.nextToken()
            break
        }
    }
    // Branje po posameznih feature-ih
    while (parser.nextToken() != JsonToken.END_ARRAY) {
        var gerkPID: Long? = null
        var rabaID: Int? = null
        var geometry: Map<String, Any>? = null
        while (parser.nextToken() != JsonToken.END_OBJECT) {
            val fieldName = parser.currentName
            if (fieldName == "properties") {
                parser.nextToken() // start object
                while (parser.nextToken() != JsonToken.END_OBJECT) {
                    val propName = parser.currentName
                    parser.nextToken()
                    when (propName) {
                        "GERK_PID" -> gerkPID = parser.longValue
                        "RABA_ID" -> rabaID = parser.intValue
                        else -> parser.skipChildren()
                    }
                }
            } else if (fieldName == "geometry") {
                parser.nextToken()
                geometry = mapper.readValue(parser, Map::class.java) as Map<String, Any>
            } else {
                parser.nextToken()

            }
        }
        if (gerkPID != null && rabaID != null && geometry != null) {
            features.add(
                FeatureItem(
                    gerkPID = gerkPID,
                    rabaId = rabaID,
                    coordinates = extractCoordinates(geometry)
                )
            )
        }
    }
    //Feature item je v obliki gerkPID|typeofUse|geometry int,string,map<String,any>
    //Za izpis uporabimo foreach in izpiši vsakega iteratorja v nadaljavanju moramo še geometry razbiti na manjše dele za pridobitev koordinatov


    // Izpis 10 podatkov parcel
    features.take(10).forEach { feature ->
        println("GERK_PID: ${feature.gerkPID} | Raba: ${feature.typeOfUse}")
        println("  Stevilo tock: ${feature.coordinates.size}")
        feature.coordinates.take(3).forEach { point ->
            if (point.size >= 2) {
                println("  lon=${point[0]}, lat=${point[1]}")
            }
        }
        println()
    }

    println("\nVREMENSKA NAPOVED (Open-Meteo)")
    val weather = fetchWeatherData(latitude = 46.05, longitude = 14.51)
    weather.forEach { w ->
        println("${w.date} | Max: ${w.maxTemp}°C | Min: ${w.minTemp}°C")
    }
}
