enum class TokenType {
    // Konstrukti
    CITY,       // city
    ROAD,       // road
    BUILDING,   // building
    FIELD,      // field
    ZONE,       // zone
    RIVER,      // river
    SENSOR,     // sensor
    CROP,       // crop
    LINE,       // line
    BOX,        // box
    BEND,       // bend
    SET,        // set

    // Vrednosti
    STRING,     // "Maribor", "Dostopna pot"
    NUMBER,     // 35, 18.6
    POINT,      // (46.5557,15.6470)

    // Simboli
    LEFT_BRACE,     // {
    RIGHT_BRACE,    // }
    LEFT_PAREN,     // (
    RIGHT_PAREN,    // )
    COMMA,          // ,

    EOF             // konec vhodnega besedila
}
