<program> ::= <city> | <city> <program>

<city> ::= "city" <string> "{" <city_elements> "}"

<city_elements> ::= <city_element> | <city_element> <city_elements> | ε

<city_element> ::= <road> | <building> | <field> | <zone> | <river> | <sensor> | <crop>

<road> ::= "road" <string> "{" <road_commands> "}"

<road_commands> ::= <road_command> | <road_command> <road_commands> | ε

<road_command> ::= <line> | <bend> | <metadata>

<building> ::= "building" <string> "{" <building_commands> "}"

<building_commands> ::= <building_command> | <building_command> <building_commands> | ε

<building_command> ::= <line> | <box> | <metadata>

<field> ::= "field" <string> "{" <field_commands> "}"

<field_commands> ::= <field_command> | <field_command> <field_commands> | ε

<field_command> ::= <line> | <box> | <metadata>

<zone> ::= "zone" <string> "{" <zone_commands> "}"

<zone_commands> ::= <zone_command> | <zone_command> <zone_commands> | ε

<zone_command> ::= <line> | <box> | <metadata>

<river> ::= "river" <string> "{" <river_commands> "}"

<river_commands> ::= <river_command> | <river_command> <river_commands> | ε

<river_command> ::= <line> | <bend> | <metadata>

<sensor> ::= "sensor" <string> <point> "{" <metadata_commands> "}"

<metadata_commands> ::= <metadata> | <metadata> <metadata_commands> | ε

<crop> ::= "crop" <string> <point>

<metadata> ::= "set" "(" <string> "," <value> ")"

<line> ::= "line" "(" <point> "," <point> ")"

<box> ::= "box" "(" <point> "," <point> ")"

<bend> ::= "bend" "(" <point> "," <point> "," <angle> ")"

<point> ::= "(" <number> "," <number> ")"

<angle> ::= <number>

<value> ::= <string> | <number>

<number> ::= <digits> | <digits> "." <digits> | "-" <digits> | "-" <digits> "." <digits>

<digits> ::= <digit> | <digit> <digits>

<string> ::= "\"" <characters> "\""

<characters> ::= <character> | <character> <characters> | ε

<character> ::= <letter> | <digit> | "_" | "-" | " "

<letter> ::= "a" | "b" | "c" | ... | "z" | "A" | "B" | "C" | ... | "Z"

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"