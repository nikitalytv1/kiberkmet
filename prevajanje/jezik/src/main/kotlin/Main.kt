package org.example

fun main() {
    // 1. Leksikalna analiza
    println("=".repeat(60))
    println("LEKSIKALNA ANALIZA")
    println("=".repeat(60))

    val lexerForTokens = Lexer("input.txt")
    var tok = lexerForTokens.nextToken()
    while (tok.type != TokenType.EOF) { println(tok); tok = lexerForTokens.nextToken() }
    println(tok) // EOF

    // Sintakticna analiza + AST
    println()
    println("SINTAKTICNA ANALIZA - ABSTRAKTNO SINTAKTICNO DREVO")

    try {
        val parser = Parser(Lexer("input.txt"))
        val ast = parser.parseProgram()
        ast.prettyPrint()

        println()
        println("STATISTIKA")
        printStats(ast)

    } catch (e: ParseException) {
        System.err.println("Napaka pri razclenjevanju: ${e.message}")
    } catch (e: LexerException) {
        System.err.println("Leksikalna napaka: ${e.message}")
    }
}

private fun printStats(program: ProgramNode) {
    val w = 28
    fun row(label: String, value: Any) =
        println("    ${label.padEnd(w)} $value")

    println("Stevilo mest: ${program.cities.size}")

    for (city in program.cities) {
        println()
        println("  Mesto: \"${city.name}\"")

        var roads = 0; var buildings = 0; var fields = 0
        var zones = 0; var rivers = 0; var sensors = 0; var crops = 0
        var lines = 0; var boxes = 0; var bends = 0; var metas = 0

        fun tally(cmds: List<CommandNode>) {
            for (c in cmds) when (c) {
                is LineNode -> lines++
                is BoxNode -> boxes++
                is BendNode -> bends++
                is MetadataNode -> metas++
            }
        }

        for (el in city.elements) when (el) {
            is RoadNode -> { roads++; tally(el.commands) }
            is BuildingNode -> { buildings++; tally(el.commands) }
            is FieldNode -> { fields++; tally(el.commands) }
            is ZoneNode -> { zones++; tally(el.commands) }
            is RiverNode -> { rivers++; tally(el.commands) }
            is SensorNode -> { sensors++; metas += el.metadata.size }
            is CropNode -> crops++
        }

        println("  Elementi:")
        row("Ceste (road):",roads)
        row("Stavbe (building):",buildings)
        row("Polja (field):",fields)
        row("Cone (zone):",zones)
        row("Reke (river):",rivers)
        row("Senzorji (sensor):",sensors)
        row("Kulture (crop):",crops)
        println()
        println("  Ukazi:")
        row("line:",lines)
        row("box:",boxes)
        row("bend:",bends)
        row("set (metadata):",metas)
        row("SKUPAJ:",lines + boxes + bends + metas)
    }
}