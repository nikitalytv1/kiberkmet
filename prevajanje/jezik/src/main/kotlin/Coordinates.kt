package org.example
data class Coordinates(val lat: Double, val lon: Double) {
    operator fun plus(other: Coordinates) = Coordinates(lat + other.lat, lon + other.lon)
    operator fun times(t: Double) = Coordinates(lat * t, lon * t)
    
    fun dist(other: Coordinates): Double {
        val dLat = other.lat - lat
        val dLon = other.lon - lon
        return Math.sqrt(dLat * dLat + dLon * dLon)
    }
    
    fun angle(other: Coordinates): Double {
        return Math.atan2(other.lon - lon, other.lat - lat)
    }
    
    fun offset(dist: Double, angle: Double): Coordinates {
        return Coordinates(lat + dist * Math.cos(angle), lon + dist * Math.sin(angle))
    }
}