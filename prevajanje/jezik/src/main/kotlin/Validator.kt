package org.example

import kotlin.math.hypot

class Validator {

    enum class Severity { ERROR, WARNING }

    data class ValidationIssue(val severity: Severity, val message: String)

    fun validate(program: ProgramNode): List<ValidationIssue> {
        val issues = mutableListOf<ValidationIssue>()
        for (city in program.cities) validateCity(city, issues)
        return issues
    }

    private fun validateCity(city: CityNode, issues: MutableList<ValidationIssue>) {
        val buildings = city.elements.filterIsInstance<BuildingNode>()
        val roads = city.elements.filterIsInstance<RoadNode>()
        val rivers = city.elements.filterIsInstance<RiverNode>()
        val fields = city.elements.filterIsInstance<FieldNode>()
        val zones = city.elements.filterIsInstance<ZoneNode>()
        val crops = city.elements.filterIsInstance<CropNode>()
        val sensors = city.elements.filterIsInstance<SensorNode>()

        warnDuplicateElementNames(city, issues)

        val buildingGeom = buildings.map { it to extractBoxes(it.commands) }
        val roadGeom = roads.map { it to extractSegments(it.commands) }
        val riverGeom = rivers.map { it to extractSegments(it.commands) }
        val fieldGeom = fields.map { it to extractBoxes(it.commands) }
        val zoneGeom = zones.map { it to extractBoxes(it.commands) }

        warnEmptyGeometry(city, "Stavba", buildingGeom, issues)
        warnEmptyGeometry(city, "Cesta", roadGeom, issues)
        warnEmptyGeometry(city, "Reka", riverGeom, issues)
        warnEmptyGeometry(city, "Polje", fieldGeom, issues)
        warnEmptyGeometry(city, "Cona", zoneGeom, issues)
        validatePointRanges(city, crops.map { "Kultura '${it.name}'" to it.location }, issues)
        validatePointRanges(city, sensors.map { "Senzor '${it.name}'" to it.location }, issues)

        // 1. Hisa ∩ Hisa
        for (i in buildingGeom.indices) {
            for (j in i + 1 until buildingGeom.size) {
                val (b1, r1) = buildingGeom[i]
                val (b2, r2) = buildingGeom[j]
                if (boxesOverlap(r1, r2))
                    issues += error(city, "Stavbi '${b1.name}' in '${b2.name}' se sekata")
            }
        }

        // 2. Hisa ∩ Cesta
        for ((building, bRects) in buildingGeom) {
            for ((road, rSegs) in roadGeom) {
                if (boxesIntersectSegs(bRects, rSegs))
                    issues += error(city, "Stavba '${building.name}' se seka s cesto '${road.name}'")
            }
        }

        // 3. Hisa ∩ Reka
        for ((building, bRects) in buildingGeom) {
            for ((river, riSegs) in riverGeom) {
                if (boxesIntersectSegs(bRects, riSegs))
                    issues += error(city, "Stavba '${building.name}' se seka z reko '${river.name}'")
            }
        }

        // 4. Cesta ∩ Reka - opozorilo
        for ((road, rSegs) in roadGeom) {
            for ((river, riSegs) in riverGeom) {
                if (segsIntersect(rSegs, riSegs))
                    issues += warn(city, "Cesta '${road.name}' se križa z reko '${river.name}' (morebitni most)")
            }
        }

        // 4b. Križišča med cestami - opozorilo
        for (i in roadGeom.indices) {
            for (j in i + 1 until roadGeom.size) {
                val (r1, segs1) = roadGeom[i]
                val (r2, segs2) = roadGeom[j]
                val junctions = findJunctions(segs1, segs2)
                for ((jx, jy) in junctions) {
                    issues += warn(city, "Križišče med cestama '${r1.name}' in '${r2.name}' pri (%.5f, %.5f)".format(jx, jy))
                }
            }
        }

        // 5–7. Kultura na stavbi/cesti/reki
        for (crop in crops) {
            val pt = crop.location
            for ((building, bRects) in buildingGeom) {
                if (pointInBoxes(pt, bRects))
                    issues += error(city, "Kultura '${crop.name}' stoji na stavbi '${building.name}'")
            }
            for ((road, rSegs) in roadGeom) {
                if (pointNearSegs(pt, rSegs))
                    issues += error(city, "Kultura '${crop.name}' stoji na cesti '${road.name}'")
            }
            for ((river, riSegs) in riverGeom) {
                if (pointNearSegs(pt, riSegs))
                    issues += error(city, "Kultura '${crop.name}' stoji na reki '${river.name}'")
            }
            // 9. Kultura izven polja/cone
            val inField = fieldGeom.any { (_, r) -> pointInBoxes(pt, r) }
            val inZone = zoneGeom.any { (_, r) -> pointInBoxes(pt, r) }
            if (!inField && !inZone)
                issues += warn(city, "Kultura '${crop.name}' ni znotraj nobenega polja ali cone")
        }

        // 8. Senzor na reki
        for (sensor in sensors) {
            val pt = sensor.location
            for ((river, riSegs) in riverGeom) {
                if (pointNearSegs(pt, riSegs))
                    issues += error(city, "Senzor '${sensor.name}' stoji na reki '${river.name}'")
            }
            // 10. Senzor izven polja/cone/ceste
            val inField = fieldGeom.any { (_, r) -> pointInBoxes(pt, r) }
            val inZone = zoneGeom.any { (_, r) -> pointInBoxes(pt, r) }
            val onRoad = roadGeom.any { (_, s) -> pointNearSegs(pt, s) }
            if (!inField && !inZone && !onRoad)
                issues += warn(city, "Senzor '${sensor.name}' ni znotraj polja, cone ali na cesti")
        }
    }

    private data class Rect(val x1: Double, val y1: Double, val x2: Double, val y2: Double)
    private data class Seg(val x1: Double, val y1: Double, val x2: Double, val y2: Double)

    private fun warnDuplicateElementNames(city: CityNode, issues: MutableList<ValidationIssue>) {
        city.elements
            .groupBy { it.elementName() }
            .filterValues { it.size > 1 }
            .keys
            .forEach { issues += warn(city, "Ime elementa '$it' je uporabljeno vec kot enkrat") }
    }

    private fun CityElementNode.elementName(): String = when (this) {
        is RoadNode -> name
        is BuildingNode -> name
        is FieldNode -> name
        is ZoneNode -> name
        is RiverNode -> name
        is SensorNode -> name
        is CropNode -> name
    }

    private fun <T, G> warnEmptyGeometry(
        city: CityNode,
        label: String,
        geometries: List<Pair<T, List<G>>>,
        issues: MutableList<ValidationIssue>
    ) {
        for ((element, geometry) in geometries) {
            if (geometry.isEmpty()) {
                val name = when (element) {
                    is CityElementNode -> element.elementName()
                    else -> "?"
                }
                issues += warn(city, "$label '$name' nima geometrije")
            }
        }
    }

    private fun validatePointRanges(
        city: CityNode,
        points: List<Pair<String, PointNode>>,
        issues: MutableList<ValidationIssue>
    ) {
        for ((label, point) in points) {
            if (point.x !in -90.0..90.0 || point.y !in -180.0..180.0) {
                issues += error(city, "$label ima neveljavne koordinate ${point}")
            }
        }
    }

    private fun extractBoxes(commands: List<CommandNode>): List<Rect> =
        commands.filterIsInstance<BoxNode>().map { b ->
            Rect(
                minOf(b.p1.x, b.p2.x), minOf(b.p1.y, b.p2.y),
                maxOf(b.p1.x, b.p2.x), maxOf(b.p1.y, b.p2.y)
            )
        }

    private fun extractSegments(commands: List<CommandNode>): List<Seg> {
        val segs = mutableListOf<Seg>()
        for (cmd in commands) when (cmd) {
            is LineNode -> segs += Seg(cmd.p1.x, cmd.p1.y, cmd.p2.x, cmd.p2.y)
            is BendNode -> {
                val pts = Bezier.bend(
                    Coordinates(cmd.p1.x, cmd.p1.y),
                    Coordinates(cmd.p2.x, cmd.p2.y),
                    cmd.angle
                ).toPoints(16)
                for (i in 0 until pts.size - 1)
                    segs += Seg(pts[i].lat, pts[i].lon, pts[i + 1].lat, pts[i + 1].lon)
            }

            else -> Unit
        }
        return segs
    }

    private fun boxesOverlap(a: List<Rect>, b: List<Rect>): Boolean =
        a.any { r1 -> b.any { r2 -> r1.x1 <= r2.x2 && r1.x2 >= r2.x1 && r1.y1 <= r2.y2 && r1.y2 >= r2.y1 } }

    private fun boxesIntersectSegs(rects: List<Rect>, segs: List<Seg>): Boolean =
        rects.any { rect -> segs.any { seg -> segIntersectsRect(seg, rect) } }

    private fun segsIntersect(a: List<Seg>, b: List<Seg>): Boolean =
        a.any { s1 -> b.any { s2 -> twoSegsIntersect(s1, s2) } }

    private fun pointInBoxes(pt: PointNode, rects: List<Rect>): Boolean =
        rects.any { r -> pt.x in r.x1..r.x2 && pt.y in r.y1..r.y2 }

    // Tolerance ~5m in degrees (road half-width is 3m)
    private fun pointNearSegs(pt: PointNode, segs: List<Seg>, tol: Double = 0.00005): Boolean =
        segs.any { seg -> pointSegDist(pt.x, pt.y, seg) < tol }

    private fun segIntersectsRect(seg: Seg, r: Rect): Boolean {
        if (seg.x1 in r.x1..r.x2 && seg.y1 in r.y1..r.y2) return true
        if (seg.x2 in r.x1..r.x2 && seg.y2 in r.y1..r.y2) return true
        val edges = listOf(
            Seg(r.x1, r.y1, r.x2, r.y1), Seg(r.x2, r.y1, r.x2, r.y2),
            Seg(r.x2, r.y2, r.x1, r.y2), Seg(r.x1, r.y2, r.x1, r.y1)
        )
        return edges.any { twoSegsIntersect(seg, it) }
    }

    private fun twoSegsIntersect(a: Seg, b: Seg): Boolean {
        fun cross(ox: Double, oy: Double, ax: Double, ay: Double, bx: Double, by: Double) =
            (ax - ox) * (by - oy) - (ay - oy) * (bx - ox)
        fun onSegment(ox: Double, oy: Double, ax: Double, ay: Double, bx: Double, by: Double): Boolean =
            minOf(ox, ax) - EPS <= bx && bx <= maxOf(ox, ax) + EPS &&
                minOf(oy, ay) - EPS <= by && by <= maxOf(oy, ay) + EPS

        val d1 = cross(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1)
        val d2 = cross(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2)
        val d3 = cross(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1)
        val d4 = cross(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2)

        if (d1 * d2 < 0 && d3 * d4 < 0) return true
        if (kotlin.math.abs(d1) <= EPS && onSegment(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1)) return true
        if (kotlin.math.abs(d2) <= EPS && onSegment(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2)) return true
        if (kotlin.math.abs(d3) <= EPS && onSegment(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1)) return true
        if (kotlin.math.abs(d4) <= EPS && onSegment(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2)) return true
        return false
    }

    private fun pointSegDist(px: Double, py: Double, seg: Seg): Double {
        val dx = seg.x2 - seg.x1;
        val dy = seg.y2 - seg.y1
        val lenSq = dx * dx + dy * dy
        if (lenSq == 0.0) return hypot(px - seg.x1, py - seg.y1)
        val t = ((px - seg.x1) * dx + (py - seg.y1) * dy) / lenSq
        val tc = t.coerceIn(0.0, 1.0)
        return hypot(px - (seg.x1 + tc * dx), py - (seg.y1 + tc * dy))
    }

    private fun findJunctions(segs1: List<Seg>, segs2: List<Seg>): List<Pair<Double, Double>> {
        val result = mutableListOf<Pair<Double, Double>>()
        for (s1 in segs1) {
            for (s2 in segs2) {
                val pt = segSegIntersection(s1, s2) ?: continue
                if (result.none { hypot(it.first - pt.first, it.second - pt.second) < 0.00005 })
                    result.add(pt)
            }
        }
        return result
    }

    private fun segSegIntersection(a: Seg, b: Seg): Pair<Double, Double>? {
        val dx1 = a.x2 - a.x1; val dy1 = a.y2 - a.y1
        val dx2 = b.x2 - b.x1; val dy2 = b.y2 - b.y1
        val denom = dx1 * dy2 - dy1 * dx2
        if (kotlin.math.abs(denom) < EPS) return null
        val dx3 = b.x1 - a.x1; val dy3 = b.y1 - a.y1
        val t = (dx3 * dy2 - dy3 * dx2) / denom
        val u = (dx3 * dy1 - dy3 * dx1) / denom
        if (t < -EPS || t > 1.0 + EPS || u < -EPS || u > 1.0 + EPS) return null
        return (a.x1 + t * dx1) to (a.y1 + t * dy1)
    }

    private fun error(city: CityNode, msg: String) =
        ValidationIssue(Severity.ERROR, "[${city.name}] $msg")

    private fun warn(city: CityNode, msg: String) =
        ValidationIssue(Severity.WARNING, "[${city.name}] $msg")

    companion object {
        private const val EPS = 1e-9
    }
}
