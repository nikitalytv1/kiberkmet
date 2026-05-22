package org.example

fun main() {
    val lexer = Lexer("input.txt")
    var tok = lexer.nextToken()
    while (tok.type != TokenType.EOF) {
        println(tok)
        tok = lexer.nextToken()
    }
    println(tok) // EOF
}