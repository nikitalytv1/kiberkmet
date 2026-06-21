package org.example

import java.io.File
import kotlin.math.*

class GeoJsonConverter(
    private val outputFile: File = File("output.geojson")
) {

    companion object {
        private const val LAT_M  = 111_000.0  // metrov na stopinjo zemljepisne širine
        private const val LON_M  =  76_300.0  // metrov na stopinjo zemljepisne dolžine (~46.5°N)
        private const val ROAD_HALF_W  = 3.0  // polovična širina ceste v metrih
        private const val RIVER_HALF_W = 3.0  // polovična širina reke v metrih
    }

    fun convert(program: ProgramNode): String {
        val features = mutableListOf<String>()
        for (city in program.cities) {
            for (element in city.elements) {
                features.addAll(elementToFeatures(element, city.name))
            }
        }
        val result = buildString {
            appendLine("{")
            appendLine("  \"type\": \"FeatureCollection\",")
            appendLine("  \"features\": [")
            append(features.joinToString(",\n"))
            appendLine()
            appendLine("  ]")
            append("}")
        }
        outputFile.writeText(result)
        return result
    }

    // ── Usmerjanje ────────────────────────────────────────────────────────────

    private fun elementToFeatures(element: CityElementNode, cityName: String): List<String> = when (element) {
        is RoadNode     -> bufferedLinear(element.name, "road",     cityName, element.commands, ROAD_HALF_W)
        is RiverNode    -> bufferedLinear(element.name, "river",    cityName, element.commands, RIVER_HALF_W)
        is BuildingNode -> areaFeatures(element.name, "building", cityName, element.commands)
        is FieldNode    -> areaFeatures(element.name, "field",    cityName, element.commands)
        is ZoneNode     -> areaFeatures(element.name, "zone",     cityName, element.commands)
        is SensorNode   -> listOf(sensorFeature(element, cityName))
        is CropNode     -> listOf(cropFeature(element, cityName))
    }

    // ── Ceste / reke → vmesni Polygon, ki se prilagaja povečavi ───────────────

    private fun bufferedLinear(
        name: String, type: String, cityName: String,
        commands: List<CommandNode>, halfWidthMeters: Double
    ): List<String> {
        val metadata = commands.filterIsInstance<MetadataNode>().associate { it.key to it.value }
        val props    = properties(name, type, cityName, metadata)
        val pts      = collectCenterline(commands)
        if (pts.size < 2) return emptyList()
        return listOf(feature("Polygon", bufferPolygon(pts, halfWidthMeters), props))
    }

    /** Vse točke središčne črte iz ukazov line/bend v pravilnem vrstnem redu (lon, lat). */
    private fun collectCenterline(commands: List<CommandNode>): List<Pair<Double, Double>> {
        val pts = mutableListOf<Pair<Double, Double>>()
        fun add(lon: Double, lat: Double) {
            val p = lon to lat
            if (pts.isEmpty() || pts.last() != p) pts.add(p)
        }
        for (cmd in commands) {
            when (cmd) {
                is LineNode -> { add(cmd.p1.y, cmd.p1.x); add(cmd.p2.y, cmd.p2.x) }
                is BendNode -> Bezier.bend(
                    Coordinates(cmd.p1.x, cmd.p1.y),
                    Coordinates(cmd.p2.x, cmd.p2.y),
                    cmd.angle
                ).toPoints(32).forEach { add(it.lon, it.lat) }
                else -> Unit
            }
        }
        return pts
    }

    /**
     * Zgradi zaprt Polygon iz središčne črte:
     * levi rob → desni rob v obratnem vrstnem redu → zapiranje.
     * Širina je podana v metrih in ni odvisna od povečave zemljevida.
     */
    private fun bufferPolygon(pts: List<Pair<Double, Double>>, halfW: Double): String {
        val left  = ArrayList<Pair<Double, Double>>(pts.size)
        val right = ArrayList<Pair<Double, Double>>(pts.size)

        for (i in pts.indices) {
            val dir = when {
                i == 0             -> geoAngle(pts[0], pts[1])
                i == pts.lastIndex -> geoAngle(pts[i - 1], pts[i])
                else               -> {
                    val a1 = geoAngle(pts[i - 1], pts[i])
                    val a2 = geoAngle(pts[i], pts[i + 1])
                    atan2(sin(a1) + sin(a2), cos(a1) + cos(a2))
                }
            }
            val perp = dir + PI / 2
            val (lon, lat) = pts[i]
            val dLon = halfW * cos(perp) / LON_M
            val dLat = halfW * sin(perp) / LAT_M
            left.add((lon + dLon) to (lat + dLat))
            right.add((lon - dLon) to (lat - dLat))
        }

        val ring = (left + right.reversed() + listOf(left.first()))
            .joinToString(",") { (lon, lat) -> "[$lon,$lat]" }
        return "[[$ring]]"
    }

    /** Smer v metričnem prostoru (lon=X, lat=Y). */
    private fun geoAngle(a: Pair<Double, Double>, b: Pair<Double, Double>): Double =
        atan2((b.second - a.second) * LAT_M, (b.first - a.first) * LON_M)

    // ── Stavbe / polja / cone ─────────────────────────────────────────────────

    private fun areaFeatures(
        name: String, type: String, cityName: String, commands: List<CommandNode>
    ): List<String> {
        val metadata = commands.filterIsInstance<MetadataNode>().associate { it.key to it.value }
        val props    = properties(name, type, cityName, metadata)
        val features = mutableListOf<String>()
        for (cmd in commands) {
            when (cmd) {
                is BoxNode -> {
                    val (y1, x1) = cmd.p1.y to cmd.p1.x
                    val (y2, x2) = cmd.p2.y to cmd.p2.x
                    val ring = "[$y1,$x1],[$y2,$x1],[$y2,$x2],[$y1,$x2],[$y1,$x1]"
                    features.add(feature("Polygon", "[[$ring]]", props))
                }
                is LineNode ->
                    features.add(feature("LineString",
                        "[[${coord(cmd.p1)}],[${coord(cmd.p2)}]]", props))
                is MetadataNode -> Unit
                else -> Unit
            }
        }
        return features
    }

    // ── Točkovni elementi ─────────────────────────────────────────────────────

    private fun sensorFeature(node: SensorNode, cityName: String): String {
        val meta  = node.metadata.associate { it.key to it.value }
        val props = properties(node.name, "sensor", cityName, meta)
        return feature("Point", "[${coord(node.location)}]", props)
    }

    private fun cropFeature(node: CropNode, cityName: String): String {
        val props = properties(node.name, "crop", cityName)
        return feature("Point", "[${coord(node.location)}]", props)
    }

    // ── Gradniki GeoJSON ──────────────────────────────────────────────────────

    private fun feature(geometryType: String, coordinates: String, props: String) = buildString {
        appendLine("    {")
        appendLine("      \"type\": \"Feature\",")
        appendLine("      \"geometry\": {")
        appendLine("        \"type\": ${js(geometryType)},")
        appendLine("        \"coordinates\": $coordinates")
        appendLine("      },")
        appendLine("      \"properties\": $props")
        append("    }")
    }

    private fun properties(
        name: String, type: String, cityName: String,
        metadata: Map<String, ValueNode> = emptyMap()
    ) = buildString {
        append("{")
        append(" \"name\": ${js(name)},")
        append(" \"type\": ${js(type)},")
        append(" \"city\": ${js(cityName)}")
        append(", ${styleFor(type)}")
        for ((key, value) in metadata) append(", ${js(key)}: ${valueJson(value)}")
        append(" }")
    }

    private fun styleFor(type: String): String = when (type) {
        "road"     -> """"fill": "#e67e22", "fill-opacity": 0.9, "stroke": "#ca6f1e", "stroke-width": 1"""
        "river"    -> """"fill": "#2980b9", "fill-opacity": 0.75, "stroke": "#1a5276", "stroke-width": 1"""
        "building" -> """"fill": "#7f8c8d", "fill-opacity": 0.7, "stroke": "#2c3e50", "stroke-width": 1"""
        "field"    -> """"fill": "#27ae60", "fill-opacity": 0.35, "stroke": "#1e8449", "stroke-width": 1"""
        "zone"     -> """"fill": "#f39c12", "fill-opacity": 0.25, "stroke": "#d68910", "stroke-width": 1"""
        "sensor"   -> """"marker-color": "#e74c3c", "marker-size": "medium""""
        "crop"     -> """"marker-color": "#2ecc71", "marker-size": "small""""
        else       -> """"stroke": "#999999", "stroke-width": 2"""
    }

    private fun coord(p: PointNode) = "${p.y},${p.x}"

    private fun js(s: String) = "\"${s.replace("\\", "\\\\").replace("\"", "\\\"")}\""

    private fun valueJson(v: ValueNode) = when (v) {
        is StringValue -> js(v.value)
        is NumberValue ->
            if (v.value == kotlin.math.floor(v.value) && !v.value.isInfinite())
                v.value.toLong().toString()
            else v.value.toString()
    }
}
