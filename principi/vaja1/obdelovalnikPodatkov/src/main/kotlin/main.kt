import com.fasterxml.jackson.core.JsonFactory
import com.fasterxml.jackson.core.JsonToken
import com.fasterxml.jackson.databind.ObjectMapper
import java.io.File
import java.net.URL


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
    val connection = URL(url).openConnection() as java.net.HttpURLConnection
    connection.setRequestProperty("User-Agent", "Mozilla/5.0")
    connection.instanceFollowRedirects = true
    connection.connect()

    if (connection.responseCode != 200) {
        error("Download neuspešen: ${connection.responseCode}")
    }
    //buffer output za json datoteko
    connection.inputStream.use { input ->
        outputFile.outputStream().use { output ->
            input.copyTo(output, bufferSize = 8 * 1024)
        }
    }
}
data class FeatureItem(
    val gerkPID: Long,
    val typeOfUse: String,
    val geometry: Map<String, Any>
)

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
                geometry = mapper.readValue(parser, Map::class.java) as Map<String, Any>//serializacija
            } else {
                parser.nextToken()

            }
        }
        if (gerkPID != null && rabaID != null && geometry != null) {
            features.add(
                FeatureItem(
                    gerkPID = gerkPID,
                    typeOfUse = mapRaba(rabaID),
                    geometry = geometry
                )
            )
        }
    }
    //Feature item je v obliki gerkPID|typeofUse|geometry int,string,map<String,any>
    //Za izpis uporabimo foreach in izpiši vsakega iteratorja v nadaljavanju moramo še geometry razbiti na manjše dele za pridobitev koordinatov


}