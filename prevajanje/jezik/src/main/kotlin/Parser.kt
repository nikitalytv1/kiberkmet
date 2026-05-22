package org.example

class ParseException(message: String, val position: Position) :
    RuntimeException("$message at ${position.line}:${position.column}")

class Parser(private val lexer: Lexer) {

    private var current: Token = lexer.nextToken()

    private fun eat(type: TokenType): Token {
        if (current.type != type)
            throw ParseException(
                "Pričakoval $type, dobil '${current.lexeme}' (${current.type})",
                current.position
            )
        val tok = current
        current = lexer.nextToken()
        return tok
    }

    private fun peek(): Token = current

    fun parseProgram(): ProgramNode {
        val cities = mutableListOf<CityNode>()

        if (current.type == TokenType.EOF)
            throw ParseException("Program mora vsebovati vsaj eno mesto (city)", current.position)

        while (current.type == TokenType.CITY) {
            cities.add(parseCity())
        }

        if (current.type != TokenType.EOF)
            throw ParseException(
                "Pričakoval 'city' ali konec datoteke, dobil '${current.lexeme}'",
                current.position
            )

        return ProgramNode(cities)
    }

    private fun parseCity(): CityNode {
        val pos = current.position
        eat(TokenType.CITY)
        val name = eat(TokenType.STRING).lexeme
        eat(TokenType.LEFT_BRACE)
        val elements = parseCityElements()
        eat(TokenType.RIGHT_BRACE)
        return CityNode(name, elements, pos)
    }

    private fun parseCityElements(): List<CityElementNode> {
        val elements = mutableListOf<CityElementNode>()
        while (current.type in CITY_ELEMENT_FIRST) {
            elements.add(parseCityElement())
        }
        return elements
    }

    private fun parseCityElement(): CityElementNode = when (current.type) {
        TokenType.ROAD     -> parseRoad()
        TokenType.BUILDING -> parseBuilding()
        TokenType.FIELD    -> parseField()
        TokenType.ZONE     -> parseZone()
        TokenType.RIVER    -> parseRiver()
        TokenType.SENSOR   -> parseSensor()
        TokenType.CROP     -> parseCrop()
        else -> throw ParseException(
            "Pričakoval element mesta (road/building/field/zone/river/sensor/crop), dobil '${current.lexeme}'",
            current.position
        )
    }

    private fun parseRoad(): RoadNode {
        val pos = current.position
        eat(TokenType.ROAD)
        val name = eat(TokenType.STRING).lexeme
        eat(TokenType.LEFT_BRACE)
        val commands = parseRoadCommands()
        eat(TokenType.RIGHT_BRACE)
        return RoadNode(name, commands, pos)
    }

    private fun parseRoadCommands(): List<CommandNode> {
        val cmds = mutableListOf<CommandNode>()
        while (current.type in ROAD_COMMAND_FIRST) {
            cmds.add(parseRoadCommand())
        }
        return cmds
    }

    private fun parseRoadCommand(): CommandNode = when (current.type) {
        TokenType.LINE -> parseLine()
        TokenType.BEND -> parseBend()
        TokenType.SET  -> parseMetadata()
        else -> throw ParseException("Pričakoval ukaz ceste (line/bend/set), dobil '${current.lexeme}'", current.position)
    }

    private fun parseBuilding(): BuildingNode {
        val pos = current.position
        eat(TokenType.BUILDING)
        val name = eat(TokenType.STRING).lexeme
        eat(TokenType.LEFT_BRACE)
        val commands = parseBuildingCommands()
        eat(TokenType.RIGHT_BRACE)
        return BuildingNode(name, commands, pos)
    }

    private fun parseBuildingCommands(): List<CommandNode> {
        val cmds = mutableListOf<CommandNode>()
        while (current.type in BOX_COMMAND_FIRST) {
            cmds.add(parseBuildingCommand())
        }
        return cmds
    }

    private fun parseBuildingCommand(): CommandNode = when (current.type) {
        TokenType.LINE -> parseLine()
        TokenType.BOX  -> parseBox()
        TokenType.SET  -> parseMetadata()
        else -> throw ParseException("Pričakoval ukaz stavbe (line/box/set), dobil '${current.lexeme}'", current.position)
    }

    private fun parseField(): FieldNode {
        val pos = current.position
        eat(TokenType.FIELD)
        val name = eat(TokenType.STRING).lexeme
        eat(TokenType.LEFT_BRACE)
        val commands = parseFieldCommands()
        eat(TokenType.RIGHT_BRACE)
        return FieldNode(name, commands, pos)
    }

    private fun parseFieldCommands(): List<CommandNode> {
        val cmds = mutableListOf<CommandNode>()
        while (current.type in BOX_COMMAND_FIRST) {
            cmds.add(parseFieldCommand())
        }
        return cmds
    }

    private fun parseFieldCommand(): CommandNode = when (current.type) {
        TokenType.LINE -> parseLine()
        TokenType.BOX  -> parseBox()
        TokenType.SET  -> parseMetadata()
        else -> throw ParseException("Pričakoval ukaz polja (line/box/set), dobil '${current.lexeme}'", current.position)
    }

    private fun parseZone(): ZoneNode {
        val pos = current.position
        eat(TokenType.ZONE)
        val name = eat(TokenType.STRING).lexeme
        eat(TokenType.LEFT_BRACE)
        val commands = parseZoneCommands()
        eat(TokenType.RIGHT_BRACE)
        return ZoneNode(name, commands, pos)
    }

    private fun parseZoneCommands(): List<CommandNode> {
        val cmds = mutableListOf<CommandNode>()
        while (current.type in BOX_COMMAND_FIRST) {
            cmds.add(parseZoneCommand())
        }
        return cmds
    }

    private fun parseZoneCommand(): CommandNode = when (current.type) {
        TokenType.LINE -> parseLine()
        TokenType.BOX  -> parseBox()
        TokenType.SET  -> parseMetadata()
        else -> throw ParseException("Pričakoval ukaz cone (line/box/set), dobil '${current.lexeme}'", current.position)
    }

    private fun parseRiver(): RiverNode {
        val pos = current.position
        eat(TokenType.RIVER)
        val name = eat(TokenType.STRING).lexeme
        eat(TokenType.LEFT_BRACE)
        val commands = parseRiverCommands()
        eat(TokenType.RIGHT_BRACE)
        return RiverNode(name, commands, pos)
    }

    private fun parseRiverCommands(): List<CommandNode> {
        val cmds = mutableListOf<CommandNode>()
        while (current.type in ROAD_COMMAND_FIRST) {
            cmds.add(parseRiverCommand())
        }
        return cmds
    }

    private fun parseRiverCommand(): CommandNode = when (current.type) {
        TokenType.LINE -> parseLine()
        TokenType.BEND -> parseBend()
        TokenType.SET  -> parseMetadata()
        else -> throw ParseException("Pričakoval ukaz reke (line/bend/set), dobil '${current.lexeme}'", current.position)
    }

    private fun parseSensor(): SensorNode {
        val pos = current.position
        eat(TokenType.SENSOR)
        val name = eat(TokenType.STRING).lexeme
        val location = parsePoint()
        eat(TokenType.LEFT_BRACE)
        val metadata = parseMetadataCommands()
        eat(TokenType.RIGHT_BRACE)
        return SensorNode(name, location, metadata, pos)
    }

    private fun parseMetadataCommands(): List<MetadataNode> {
        val mds = mutableListOf<MetadataNode>()
        while (current.type == TokenType.SET) {
            mds.add(parseMetadata())
        }
        return mds
    }

    private fun parseCrop(): CropNode {
        val pos = current.position
        eat(TokenType.CROP)
        val name = eat(TokenType.STRING).lexeme
        val location = parsePoint()
        return CropNode(name, location, pos)
    }

    private fun parseLine(): LineNode {
        val pos = current.position
        eat(TokenType.LINE)
        eat(TokenType.LEFT_PAREN)
        val p1 = parsePoint()
        eat(TokenType.COMMA)
        val p2 = parsePoint()
        eat(TokenType.RIGHT_PAREN)
        return LineNode(p1, p2, pos)
    }

    private fun parseBox(): BoxNode {
        val pos = current.position
        eat(TokenType.BOX)
        eat(TokenType.LEFT_PAREN)
        val p1 = parsePoint()
        eat(TokenType.COMMA)
        val p2 = parsePoint()
        eat(TokenType.RIGHT_PAREN)
        return BoxNode(p1, p2, pos)
    }

    private fun parseBend(): BendNode {
        val pos = current.position
        eat(TokenType.BEND)
        eat(TokenType.LEFT_PAREN)
        val p1 = parsePoint()
        eat(TokenType.COMMA)
        val p2 = parsePoint()
        eat(TokenType.COMMA)
        val angleTok = eat(TokenType.NUMBER)
        val angle = angleTok.lexeme.toDoubleOrNull()
            ?: throw ParseException("Neveljaven kot: '${angleTok.lexeme}'", angleTok.position)
        eat(TokenType.RIGHT_PAREN)
        return BendNode(p1, p2, angle, pos)
    }

    private fun parseMetadata(): MetadataNode {
        val pos = current.position
        eat(TokenType.SET)
        eat(TokenType.LEFT_PAREN)
        val key = eat(TokenType.STRING).lexeme
        eat(TokenType.COMMA)
        val value = parseValue()
        eat(TokenType.RIGHT_PAREN)
        return MetadataNode(key, value, pos)
    }

    private fun parseValue(): ValueNode = when (current.type) {
        TokenType.STRING -> StringValue(eat(TokenType.STRING).lexeme)
        TokenType.NUMBER -> {
            val tok = eat(TokenType.NUMBER)
            val num = tok.lexeme.toDoubleOrNull()
                ?: throw ParseException("Neveljaven zapis števila: '${tok.lexeme}'", tok.position)
            NumberValue(num)
        }
        else -> throw ParseException(
            "Pričakoval vrednost (niz ali število), dobil '${current.lexeme}'",
            current.position
        )
    }

    private fun parsePoint(): PointNode {
        val tok = eat(TokenType.POINT)
        val parts = tok.lexeme.split(",")
        if (parts.size != 2)
            throw ParseException("Neveljaven format točke: '${tok.lexeme}'", tok.position)
        val x = parts[0].toDoubleOrNull()
            ?: throw ParseException("Neveljaven x v točki: '${parts[0]}'", tok.position)
        val y = parts[1].toDoubleOrNull()
            ?: throw ParseException("Neveljaven y v točki: '${parts[1]}'", tok.position)
        return PointNode(x, y, tok.position)
    }

    companion object {
        private val CITY_ELEMENT_FIRST = setOf(
            TokenType.ROAD, TokenType.BUILDING, TokenType.FIELD,
            TokenType.ZONE, TokenType.RIVER, TokenType.SENSOR, TokenType.CROP
        )

        private val ROAD_COMMAND_FIRST = setOf(
            TokenType.LINE, TokenType.BEND, TokenType.SET
        )

        private val BOX_COMMAND_FIRST = setOf(
            TokenType.LINE, TokenType.BOX, TokenType.SET
        )
    }
}