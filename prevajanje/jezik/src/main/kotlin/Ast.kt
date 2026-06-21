package org.example

data class PointNode(
    val x: Double,
    val y: Double,
    val position: Position
) {
    override fun toString() = "(${x},${y})"
}

sealed class ValueNode
data class StringValue(val value: String) : ValueNode() {
    override fun toString() = "\"$value\""
}
data class NumberValue(val value: Double) : ValueNode() {
    override fun toString(): String =
        if (value == kotlin.math.floor(value) && !value.isInfinite())
            value.toLong().toString()
        else value.toString()
}

sealed class CommandNode {
    abstract val position: Position
}

data class LineNode(
    val p1: PointNode, val p2: PointNode, override val position: Position
) : CommandNode()

data class BoxNode(
    val p1: PointNode, val p2: PointNode, override val position: Position
) : CommandNode()

data class BendNode(
    val p1: PointNode, val p2: PointNode, val angle: Double, override val position: Position
) : CommandNode()

data class MetadataNode(
    val key: String, val value: ValueNode, override val position: Position
) : CommandNode()

sealed class CityElementNode {
    abstract val position: Position
}

data class RoadNode(
    val name: String, val commands: List<CommandNode>, override val position: Position
) : CityElementNode()

data class BuildingNode(
    val name: String, val commands: List<CommandNode>, override val position: Position
) : CityElementNode()

data class FieldNode(
    val name: String, val commands: List<CommandNode>, override val position: Position
) : CityElementNode()

data class ZoneNode(
    val name: String, val commands: List<CommandNode>, override val position: Position
) : CityElementNode()

data class RiverNode(
    val name: String, val commands: List<CommandNode>, override val position: Position
) : CityElementNode()

data class SensorNode(
    val name: String, val location: PointNode,
    val metadata: List<MetadataNode>, override val position: Position
) : CityElementNode()

data class CropNode(
    val name: String, val location: PointNode, override val position: Position
) : CityElementNode()

data class CityNode(val name: String, val elements: List<CityElementNode>, val position: Position)
data class ProgramNode(val cities: List<CityNode>)

private const val B_MID  = "+-- "
private const val B_LAST = "\\-- "
private const val PIPE   = "|   "
private const val SPACE  = "    "

fun ProgramNode.prettyPrint() {
    val n = cities.size
    println("Program  [$n ${if (n == 1) "mesto" else "mest"}]")
    cities.forEachIndexed { i, city -> city.prettyPrint("", i == cities.lastIndex) }
}

private fun CityNode.prettyPrint(prefix: String, isLast: Boolean) {
    val b = if (isLast) B_LAST else B_MID
    val c = if (isLast) SPACE  else PIPE
    println("${prefix}${b}City \"$name\"  [${elements.size} elementov]  @${position.line}:${position.column}")
    elements.forEachIndexed { i, el -> el.prettyPrint("$prefix$c", i == elements.lastIndex) }
}

private fun CityElementNode.prettyPrint(prefix: String, isLast: Boolean) {
    val b = if (isLast) B_LAST else B_MID
    val c = if (isLast) SPACE  else PIPE
    when (this) {
        is RoadNode -> {
            println("${prefix}${b}Road \"$name\"  [${commands.size} ukazov]  @${position.line}:${position.column}")
            commands.forEachIndexed { i, cmd -> cmd.prettyPrint("$prefix$c", i == commands.lastIndex) }
        }
        is BuildingNode -> {
            println("${prefix}${b}Building \"$name\"  [${commands.size} ukazov]  @${position.line}:${position.column}")
            commands.forEachIndexed { i, cmd -> cmd.prettyPrint("$prefix$c", i == commands.lastIndex) }
        }
        is FieldNode -> {
            println("${prefix}${b}Field \"$name\"  [${commands.size} ukazov]  @${position.line}:${position.column}")
            commands.forEachIndexed { i, cmd -> cmd.prettyPrint("$prefix$c", i == commands.lastIndex) }
        }
        is ZoneNode -> {
            println("${prefix}${b}Zone \"$name\"  [${commands.size} ukazov]  @${position.line}:${position.column}")
            commands.forEachIndexed { i, cmd -> cmd.prettyPrint("$prefix$c", i == commands.lastIndex) }
        }
        is RiverNode -> {
            println("${prefix}${b}River \"$name\"  [${commands.size} ukazov]  @${position.line}:${position.column}")
            commands.forEachIndexed { i, cmd -> cmd.prettyPrint("$prefix$c", i == commands.lastIndex) }
        }
        is SensorNode -> {
            println("${prefix}${b}Sensor \"$name\"  @ $location  @${position.line}:${position.column}")
            metadata.forEachIndexed { i, m -> (m as CommandNode).prettyPrint("$prefix$c", i == metadata.lastIndex) }
        }
        is CropNode -> {
            println("${prefix}${b}Crop \"$name\"  @ $location  @${position.line}:${position.column}")
        }
    }
}

private fun CommandNode.prettyPrint(prefix: String, isLast: Boolean) {
    val b = if (isLast) B_LAST else B_MID
    when (this) {
        is LineNode -> println("${prefix}${b}line($p1, $p2)  @${position.line}:${position.column}")
        is BoxNode -> println("${prefix}${b}box($p1, $p2)  @${position.line}:${position.column}")
        is BendNode -> println("${prefix}${b}bend($p1, $p2, angle=$angle)  @${position.line}:${position.column}")
        is MetadataNode -> println("${prefix}${b}set(\"$key\", $value)  @${position.line}:${position.column}")
    }
}