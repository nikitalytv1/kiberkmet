package org.example

class Lexer(fileName: String) {
    private val scanner = Scanner(fileName)
    private var line = 1
    private var col = 1
    var currentToken = Token(TokenType.EOF, "", Position(1, 1))
        private set

    private val maxState = 23
    private val table = Array(maxState + 1) { IntArray(256) { -1 } }

    private enum class Final {
        KEYWORD, STRING, NUMBER, WHITESPACE,
        LEFT_BRACE, RIGHT_BRACE, LEFT_PAREN, RIGHT_PAREN, COMMA, POINT
    }

    private val finite = arrayOfNulls<Final>(maxState + 1)

    init {
        finite[1] = Final.KEYWORD
        finite[3] = Final.STRING
        finite[5] = Final.NUMBER
        finite[7] = Final.NUMBER
        finite[8] = Final.WHITESPACE
        finite[9] = Final.LEFT_BRACE
        finite[10] = Final.RIGHT_BRACE
        finite[11] = Final.RIGHT_PAREN
        finite[12] = Final.COMMA
        finite[13] = Final.LEFT_PAREN
        finite[23] = Final.POINT

        for (c in 'a'..'z') table[0][c.code] = 1
        table[0]['"'.code] = 2
        table[0]['-'.code] = 4
        for (c in '0'..'9') table[0][c.code] = 5
        for (c in " \t\n\r") table[0][c.code] = 8
        table[0]['{'.code] = 9
        table[0]['}'.code] = 10
        table[0][')'.code] = 11
        table[0][','.code] = 12
        table[0]['('.code] = 13

        for (c in 'a'..'z') table[1][c.code] = 1

        for (i in 0 until 256) table[2][i] = 2
        table[2]['"'.code] = 3

        for (c in '0'..'9') table[4][c.code] = 5

        for (c in '0'..'9') table[5][c.code] = 5
        table[5]['.'.code] = 6

        for (c in '0'..'9') table[6][c.code] = 7

        for (c in '0'..'9') table[7][c.code] = 7

        for (c in " \t\n\r") table[8][c.code] = 8

        table[13]['-'.code] = 14
        for (c in '0'..'9') table[13][c.code] = 15

        for (c in '0'..'9') table[14][c.code] = 15

        for (c in '0'..'9') table[15][c.code] = 15
        table[15]['.'.code] = 16
        table[15][','.code] = 18

        for (c in '0'..'9') table[16][c.code] = 17

        for (c in '0'..'9') table[17][c.code] = 17
        table[17][','.code] = 18

        table[18]['-'.code] = 19
        for (c in '0'..'9') table[18][c.code] = 20

        for (c in '0'..'9') table[19][c.code] = 20

        for (c in '0'..'9') table[20][c.code] = 20
        table[20]['.'.code] = 21
        table[20][')'.code] = 23

        for (c in '0'..'9') table[21][c.code] = 22

        for (c in '0'..'9') table[22][c.code] = 22
        table[22][')'.code] = 23
    }

    private fun nextState(state: Int, ch: Char?): Int {
        if (ch == null) return -1
        if (ch.code >= 256) return if (state == 2) 2 else -1
        return table[state][ch.code]
    }

    private fun advance() {
        val ch = scanner.getCurrentChar() ?: return
        if (ch == '\n') {
            line++; col = 1
        } else col++
        scanner.nextChar()
    }

    private fun buildToken(final: Final, lexem: String, pos: Position): Token = when (final) {
        Final.KEYWORD -> {
            val type = when (lexem) {
                "city" -> TokenType.CITY
                "road" -> TokenType.ROAD
                "building" -> TokenType.BUILDING
                "field" -> TokenType.FIELD
                "zone" -> TokenType.ZONE
                "river" -> TokenType.RIVER
                "sensor" -> TokenType.SENSOR
                "crop" -> TokenType.CROP
                "line" -> TokenType.LINE
                "box" -> TokenType.BOX
                "bend" -> TokenType.BEND
                "set" -> TokenType.SET
                else -> throw LexerException("Unknown keyword '$lexem'", pos)
            }
            Token(type, lexem, pos)
        }

        Final.STRING -> Token(TokenType.STRING, lexem.drop(1).dropLast(1), pos)
        Final.NUMBER -> Token(TokenType.NUMBER, lexem, pos)
        Final.LEFT_BRACE -> Token(TokenType.LEFT_BRACE, lexem, pos)
        Final.RIGHT_BRACE -> Token(TokenType.RIGHT_BRACE, lexem, pos)
        Final.LEFT_PAREN -> Token(TokenType.LEFT_PAREN, lexem, pos)
        Final.RIGHT_PAREN -> Token(TokenType.RIGHT_PAREN, lexem, pos)
        Final.COMMA -> Token(TokenType.COMMA, lexem, pos)
        Final.POINT -> Token(TokenType.POINT, lexem.drop(1).dropLast(1), pos)
        Final.WHITESPACE -> nextToken()
    }

    fun nextToken(): Token {
        if (scanner.getCurrentChar() == null) {
            currentToken = Token(TokenType.EOF, "", Position(line, col))
            return currentToken
        }

        var lexem = ""
        var state = 0
        val startLine = line
        val startCol = col

        while (true) {
            val ch = scanner.getCurrentChar()
            val next = nextState(state, ch)

            if (next != -1) {
                lexem += ch!!
                state = next
                advance()
            } else {
                val final = finite[state]
                    ?: throw LexerException("Unexpected character '${ch ?: "EOF"}'", Position(line, col))
                val token = buildToken(final, lexem, Position(startLine, startCol))
                if (final != Final.WHITESPACE) currentToken = token
                return token
            }
        }
    }
}