package org.example

data class Position(val line: Int, val column: Int)

data class Token(
    val type: TokenType,
    val lexeme: String,
    val position: Position
) {
    override fun toString(): String = "${position.line}:${position.column} $type '$lexeme'"
}

class LexerException(message: String, val position: Position) :
    RuntimeException("$message at ${position.line}:${position.column}")
