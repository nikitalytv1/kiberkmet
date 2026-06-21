package org.example

import kotlin.math.PI
import kotlin.math.pow
import kotlin.math.tan

class Bezier(private val p0: Coordinates, private val p1: Coordinates, private val p2: Coordinates, private val p3: Coordinates) {

    fun at(t: Double) =
        p0 * (1.0 - t).pow(3.0) + p1 * 3.0 * (1.0 - t).pow(2.0) * t + p2 * 3.0 * (1.0 - t) * t.pow(2.0) + p3 * t.pow(3.0)

    fun toPoints(segmentsCount: Int): List<Coordinates> {
        val ps = mutableListOf<Coordinates>()
        for (i in 0 .. segmentsCount) {
            val t = i / segmentsCount.toDouble()
            ps.add(at(t))
        }
        return ps
    }

    fun approxLength(): Double {
        val midpoint = at(0.5)
        return p0.dist(midpoint) + midpoint.dist(p3)
    }

    fun resolutionToSegmentsCount(resolution: Double) =
        (resolution * approxLength()).coerceAtLeast(2.0).toInt()

    companion object {
        fun bend(t0: Coordinates, t1: Coordinates, relativeAngle: Double): Bezier {
            val relativeAngle = Math.toRadians(relativeAngle)
            val oppositeRelativeAngle = PI - relativeAngle

            val angle = t0.angle(t1)
            val dist = t0.dist(t1)
            val constant = (4 / 3) * tan(PI / 8)

            val c0 = t0.offset(constant * dist, angle + relativeAngle)
            val c1 = t1.offset(constant * dist, angle + oppositeRelativeAngle)

            return Bezier(t0, c0, c1, t1)
        }
    }
}