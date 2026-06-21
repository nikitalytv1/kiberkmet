package org.example

import java.io.File

class Scanner(fileName: String) {
    private val reader = File(fileName).bufferedReader()
    private var currentChar: Int = reader.read()

    fun getCurrentChar(): Char? = if (currentChar == -1) null else currentChar.toChar()

    fun nextChar() {
        currentChar = reader.read()
    }

    fun peekChar(): Char? {
        reader.mark(1)
        val next = reader.read()
        reader.reset()
        return if (next == -1) null else next.toChar()
    }
}
