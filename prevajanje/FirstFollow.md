# FIRST in FOLLOW množice

## FIRST množice

| Ne-terminal | FIRST |
|---|---|
| `<program>` | `{ "city" }` |
| `<city>` | `{ "city" }` |
| `<city_elements>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop", ε }` |
| `<city_element>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop" }` |
| `<road>` | `{ "road" }` |
| `<road_commands>` | `{ "line", "bend", "set", ε }` |
| `<road_command>` | `{ "line", "bend", "set" }` |
| `<building>` | `{ "building" }` |
| `<building_commands>` | `{ "line", "box", "set", ε }` |
| `<building_command>` | `{ "line", "box", "set" }` |
| `<field>` | `{ "field" }` |
| `<field_commands>` | `{ "line", "box", "set", ε }` |
| `<field_command>` | `{ "line", "box", "set" }` |
| `<zone>` | `{ "zone" }` |
| `<zone_commands>` | `{ "line", "box", "set", ε }` |
| `<zone_command>` | `{ "line", "box", "set" }` |
| `<river>` | `{ "river" }` |
| `<river_commands>` | `{ "line", "bend", "set", ε }` |
| `<river_command>` | `{ "line", "bend", "set" }` |
| `<sensor>` | `{ "sensor" }` |
| `<metadata_commands>` | `{ "set", ε }` |
| `<crop>` | `{ "crop" }` |
| `<metadata>` | `{ "set" }` |
| `<line>` | `{ "line" }` |
| `<box>` | `{ "box" }` |
| `<bend>` | `{ "bend" }` |
| `<point>` | `{ "(" }` |
| `<angle>` | `{ <number> }` |
| `<value>` | `{ <string>, <number> }` |
| `<number>` | `{ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-" }` |
| `<digits>` | `{ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" }` |
| `<string>` | `{ "\"" }` |
| `<characters>` | `{ <letter>, <digit>, "_", "-", " ", ε }` |
| `<character>` | `{ <letter>, <digit>, "_", "-", " " }` |
| `<letter>` | `{ "a" ... "z", "A" ... "Z" }` |
| `<digit>` | `{ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" }` |

## FOLLOW množice

| Ne-terminal | FOLLOW |
|---|---|
| `<program>` | `{ $ }` |
| `<city>` | `{ "city", $ }` |
| `<city_elements>` | `{ "}" }` |
| `<city_element>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop", "}" }` |
| `<road>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop", "}" }` |
| `<road_commands>` | `{ "}" }` |
| `<road_command>` | `{ "line", "bend", "set", "}" }` |
| `<building>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop", "}" }` |
| `<building_commands>` | `{ "}" }` |
| `<building_command>` | `{ "line", "box", "set", "}" }` |
| `<field>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop", "}" }` |
| `<field_commands>` | `{ "}" }` |
| `<field_command>` | `{ "line", "box", "set", "}" }` |
| `<zone>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop", "}" }` |
| `<zone_commands>` | `{ "}" }` |
| `<zone_command>` | `{ "line", "box", "set", "}" }` |
| `<river>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop", "}" }` |
| `<river_commands>` | `{ "}" }` |
| `<river_command>` | `{ "line", "bend", "set", "}" }` |
| `<sensor>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop", "}" }` |
| `<metadata_commands>` | `{ "}" }` |
| `<crop>` | `{ "road", "building", "field", "zone", "river", "sensor", "crop", "}" }` |
| `<metadata>` | `{ "line", "bend", "box", "set", "}" }` |
| `<line>` | `{ "line", "bend", "box", "set", "}" }` |
| `<box>` | `{ "line", "box", "set", "}" }` |
| `<bend>` | `{ "line", "bend", "set", "}" }` |
| `<point>` | `{ ",", ")" }` |
| `<angle>` | `{ ")" }` |
| `<value>` | `{ ")" }` |
| `<number>` | `{ ",", ")" }` |
| `<digits>` | `{ ".", ",", ")" }` |
| `<string>` | `{ "{", ",", "(", ")" }` |
| `<characters>` | `{ "\"" }` |
| `<character>` | `{ <letter>, <digit>, "_", "-", " ", "\"" }` |
| `<letter>` | `{ <letter>, <digit>, "_", "-", " ", "\"" }` |
| `<digit>` | `{ <digit>, ".", ",", ")", "_", "-", " ", "\"" }` |

## Postopek FIRST

```txt
FIRST(<program>) = FIRST(<city>) ∪ FIRST(<city> <program>)
                 = { "city" } ∪ { "city" }
                 = { "city" }
```

```txt
FIRST(<city>) = FIRST("city" <string> "{" <city_elements> "}")
              = FIRST("city")
              = { "city" }
```

```txt
FIRST(<city_elements>) = FIRST(<city_element>) ∪ FIRST(<city_element> <city_elements>) ∪ FIRST(ε)
                       = { "road", "building", "field", "zone", "river", "sensor", "crop" }
                         ∪ { "road", "building", "field", "zone", "river", "sensor", "crop" }
                         ∪ { ε }
                       = { "road", "building", "field", "zone", "river", "sensor", "crop", ε }
```

```txt
FIRST(<city_element>) = FIRST(<road>) ∪ FIRST(<building>) ∪ FIRST(<field>) ∪ FIRST(<zone>) ∪ FIRST(<river>) ∪ FIRST(<sensor>) ∪ FIRST(<crop>)
                      = { "road" } ∪ { "building" } ∪ { "field" } ∪ { "zone" } ∪ { "river" } ∪ { "sensor" } ∪ { "crop" }
                      = { "road", "building", "field", "zone", "river", "sensor", "crop" }
```

```txt
FIRST(<road>) = FIRST("road" <string> "{" <road_commands> "}")
              = { "road" }
```

```txt
FIRST(<road_commands>) = FIRST(<road_command>) ∪ FIRST(<road_command> <road_commands>) ∪ FIRST(ε)
                       = { "line", "bend", "set" } ∪ { "line", "bend", "set" } ∪ { ε }
                       = { "line", "bend", "set", ε }
```

```txt
FIRST(<road_command>) = FIRST(<line>) ∪ FIRST(<bend>) ∪ FIRST(<metadata>)
                      = { "line" } ∪ { "bend" } ∪ { "set" }
                      = { "line", "bend", "set" }
```

```txt
FIRST(<building>) = FIRST("building" <string> "{" <building_commands> "}")
                  = { "building" }
```

```txt
FIRST(<building_commands>) = FIRST(<building_command>) ∪ FIRST(<building_command> <building_commands>) ∪ FIRST(ε)
                           = { "line", "box", "set" } ∪ { "line", "box", "set" } ∪ { ε }
                           = { "line", "box", "set", ε }
```

```txt
FIRST(<building_command>) = FIRST(<line>) ∪ FIRST(<box>) ∪ FIRST(<metadata>)
                          = { "line" } ∪ { "box" } ∪ { "set" }
                          = { "line", "box", "set" }
```

```txt
FIRST(<field>) = FIRST("field" <string> "{" <field_commands> "}")
               = { "field" }
```

```txt
FIRST(<field_commands>) = FIRST(<field_command>) ∪ FIRST(<field_command> <field_commands>) ∪ FIRST(ε)
                        = { "line", "box", "set" } ∪ { "line", "box", "set" } ∪ { ε }
                        = { "line", "box", "set", ε }
```

```txt
FIRST(<field_command>) = FIRST(<line>) ∪ FIRST(<box>) ∪ FIRST(<metadata>)
                       = { "line" } ∪ { "box" } ∪ { "set" }
                       = { "line", "box", "set" }
```

```txt
FIRST(<zone>) = FIRST("zone" <string> "{" <zone_commands> "}")
              = { "zone" }
```

```txt
FIRST(<zone_commands>) = FIRST(<zone_command>) ∪ FIRST(<zone_command> <zone_commands>) ∪ FIRST(ε)
                       = { "line", "box", "set" } ∪ { "line", "box", "set" } ∪ { ε }
                       = { "line", "box", "set", ε }
```

```txt
FIRST(<zone_command>) = FIRST(<line>) ∪ FIRST(<box>) ∪ FIRST(<metadata>)
                      = { "line" } ∪ { "box" } ∪ { "set" }
                      = { "line", "box", "set" }
```

```txt
FIRST(<river>) = FIRST("river" <string> "{" <river_commands> "}")
               = { "river" }
```

```txt
FIRST(<river_commands>) = FIRST(<river_command>) ∪ FIRST(<river_command> <river_commands>) ∪ FIRST(ε)
                        = { "line", "bend", "set" } ∪ { "line", "bend", "set" } ∪ { ε }
                        = { "line", "bend", "set", ε }
```

```txt
FIRST(<river_command>) = FIRST(<line>) ∪ FIRST(<bend>) ∪ FIRST(<metadata>)
                       = { "line" } ∪ { "bend" } ∪ { "set" }
                       = { "line", "bend", "set" }
```

```txt
FIRST(<sensor>) = FIRST("sensor" <string> <point> "{" <metadata_commands> "}")
                = { "sensor" }
```

```txt
FIRST(<metadata_commands>) = FIRST(<metadata>) ∪ FIRST(<metadata> <metadata_commands>) ∪ FIRST(ε)
                           = { "set" } ∪ { "set" } ∪ { ε }
                           = { "set", ε }
```

```txt
FIRST(<crop>) = FIRST("crop" <string> <point>)
              = { "crop" }
```

```txt
FIRST(<metadata>) = FIRST("set" "(" <string> "," <value> ")")
                  = { "set" }
```

```txt
FIRST(<line>) = FIRST("line" "(" <point> "," <point> ")")
              = { "line" }
```

```txt
FIRST(<box>) = FIRST("box" "(" <point> "," <point> ")")
             = { "box" }
```

```txt
FIRST(<bend>) = FIRST("bend" "(" <point> "," <point> "," <angle> ")")
              = { "bend" }
```

```txt
FIRST(<point>) = FIRST("(" <number> "," <number> ")")
               = { "(" }
```

```txt
FIRST(<angle>) = FIRST(<number>)
               = { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-" }
```

```txt
FIRST(<value>) = FIRST(<string>) ∪ FIRST(<number>)
               = { "\"" } ∪ { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-" }
               = { <string>, <number> }
```

```txt
FIRST(<number>) = FIRST(<digits>) ∪ FIRST(<digits> "." <digits>) ∪ FIRST("-" <digits>) ∪ FIRST("-" <digits> "." <digits>)
                = { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" } ∪ { "-" }
                = { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-" }
```

```txt
FIRST(<digits>) = FIRST(<digit>) ∪ FIRST(<digit> <digits>)
                = { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" }
```

```txt
FIRST(<string>) = FIRST("\"" <characters> "\"")
                = { "\"" }
```

```txt
FIRST(<characters>) = FIRST(<character>) ∪ FIRST(<character> <characters>) ∪ FIRST(ε)
                    = { <letter>, <digit>, "_", "-", " " } ∪ { <letter>, <digit>, "_", "-", " " } ∪ { ε }
                    = { <letter>, <digit>, "_", "-", " ", ε }
```

```txt
FIRST(<character>) = FIRST(<letter>) ∪ FIRST(<digit>) ∪ FIRST("_") ∪ FIRST("-") ∪ FIRST(" ")
                   = { <letter> } ∪ { <digit> } ∪ { "_" } ∪ { "-" } ∪ { " " }
                   = { <letter>, <digit>, "_", "-", " " }
```

```txt
FIRST(<letter>) = { "a" ... "z", "A" ... "Z" }
```

```txt
FIRST(<digit>) = { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" }
```

## Postopek FOLLOW:

```txt
FOLLOW(<program>) = { $ }
```

```txt
FOLLOW(<city>) = FIRST(<program>) ∪ FIRST(FOLLOW(<program>))
               = { "city" } ∪ { $ }
               = { "city", $ }
```

```txt
FOLLOW(<city_elements>) = FIRST("}" ° FOLLOW(<city>))
                        = { "}" }
```

```txt
FOLLOW(<city_element>) = FIRST(<city_elements> ° FOLLOW(<city_elements>))
                       = FIRST({ "road", "building", "field", "zone", "river", "sensor", "crop", ε } ° { "}" })
                       = { "road", "building", "field", "zone", "river", "sensor", "crop" } ∪ { "}" }
                       = { "road", "building", "field", "zone", "river", "sensor", "crop", "}" }
```

```txt
FOLLOW(<road>) = FOLLOW(<city_element>)
               = { "road", "building", "field", "zone", "river", "sensor", "crop", "}" }
```

```txt
FOLLOW(<road_commands>) = FIRST("}" ° FOLLOW(<road>))
                        = { "}" }
```

```txt
FOLLOW(<road_command>) = FIRST(<road_commands> ° FOLLOW(<road_commands>))
                       = FIRST({ "line", "bend", "set", ε } ° { "}" })
                       = { "line", "bend", "set" } ∪ { "}" }
                       = { "line", "bend", "set", "}" }
```

```txt
FOLLOW(<building>) = FOLLOW(<city_element>)
                   = { "road", "building", "field", "zone", "river", "sensor", "crop", "}" }
```

```txt
FOLLOW(<building_commands>) = FIRST("}" ° FOLLOW(<building>))
                            = { "}" }
```

```txt
FOLLOW(<building_command>) = FIRST(<building_commands> ° FOLLOW(<building_commands>))
                           = FIRST({ "line", "box", "set", ε } ° { "}" })
                           = { "line", "box", "set" } ∪ { "}" }
                           = { "line", "box", "set", "}" }
```

```txt
FOLLOW(<field>) = FOLLOW(<city_element>)
                = { "road", "building", "field", "zone", "river", "sensor", "crop", "}" }
```

```txt
FOLLOW(<field_commands>) = FIRST("}" ° FOLLOW(<field>))
                         = { "}" }
```

```txt
FOLLOW(<field_command>) = FIRST(<field_commands> ° FOLLOW(<field_commands>))
                        = FIRST({ "line", "box", "set", ε } ° { "}" })
                        = { "line", "box", "set" } ∪ { "}" }
                        = { "line", "box", "set", "}" }
```

```txt
FOLLOW(<zone>) = FOLLOW(<city_element>)
               = { "road", "building", "field", "zone", "river", "sensor", "crop", "}" }
```

```txt
FOLLOW(<zone_commands>) = FIRST("}" ° FOLLOW(<zone>))
                        = { "}" }
```

```txt
FOLLOW(<zone_command>) = FIRST(<zone_commands> ° FOLLOW(<zone_commands>))
                       = FIRST({ "line", "box", "set", ε } ° { "}" })
                       = { "line", "box", "set" } ∪ { "}" }
                       = { "line", "box", "set", "}" }
```

```txt
FOLLOW(<river>) = FOLLOW(<city_element>)
                = { "road", "building", "field", "zone", "river", "sensor", "crop", "}" }
```

```txt
FOLLOW(<river_commands>) = FIRST("}" ° FOLLOW(<river>))
                         = { "}" }
```

```txt
FOLLOW(<river_command>) = FIRST(<river_commands> ° FOLLOW(<river_commands>))
                        = FIRST({ "line", "bend", "set", ε } ° { "}" })
                        = { "line", "bend", "set" } ∪ { "}" }
                        = { "line", "bend", "set", "}" }
```

```txt
FOLLOW(<sensor>) = FOLLOW(<city_element>)
                 = { "road", "building", "field", "zone", "river", "sensor", "crop", "}" }
```

```txt
FOLLOW(<metadata_commands>) = FIRST("}" ° FOLLOW(<sensor>))
                            = { "}" }
```

```txt
FOLLOW(<crop>) = FOLLOW(<city_element>)
               = { "road", "building", "field", "zone", "river", "sensor", "crop", "}" }
```

```txt
FOLLOW(<metadata>) =
  FOLLOW(<road_command>) ∪ FOLLOW(<building_command>) ∪ FOLLOW(<field_command>) ∪ FOLLOW(<zone_command>) ∪ FOLLOW(<river_command>) ∪ FOLLOW(<metadata_commands>)
= { "line", "bend", "set", "}" } ∪ { "line", "box", "set", "}" } ∪ { "line", "box", "set", "}" } ∪ { "line", "box", "set", "}" } ∪ { "line", "bend", "set", "}" } ∪ { "}" }
= { "line", "bend", "box", "set", "}" }
```

```txt
FOLLOW(<line>) =
  FOLLOW(<road_command>) ∪ FOLLOW(<building_command>) ∪ FOLLOW(<field_command>) ∪ FOLLOW(<zone_command>) ∪ FOLLOW(<river_command>)
= { "line", "bend", "set", "}" } ∪ { "line", "box", "set", "}" } ∪ { "line", "box", "set", "}" } ∪ { "line", "box", "set", "}" } ∪ { "line", "bend", "set", "}" }
= { "line", "bend", "box", "set", "}" }
```

```txt
FOLLOW(<box>) =
  FOLLOW(<building_command>) ∪ FOLLOW(<field_command>) ∪ FOLLOW(<zone_command>)
= { "line", "box", "set", "}" } ∪ { "line", "box", "set", "}" } ∪ { "line", "box", "set", "}" }
= { "line", "box", "set", "}" }
```

```txt
FOLLOW(<bend>) =
  FOLLOW(<road_command>) ∪ FOLLOW(<river_command>)
= { "line", "bend", "set", "}" } ∪ { "line", "bend", "set", "}" }
= { "line", "bend", "set", "}" }
```

```txt
FOLLOW(<point>) =
  FIRST("," <point> ")" ° FOLLOW(<line>))
  ∪ FIRST(")" ° FOLLOW(<line>))
  ∪ FIRST("," <point> ")" ° FOLLOW(<box>))
  ∪ FIRST(")" ° FOLLOW(<box>))
  ∪ FIRST("," <point> "," <angle> ")" ° FOLLOW(<bend>))
  ∪ FIRST(")" ° FOLLOW(<crop>))
= { "," } ∪ { ")" } ∪ { "," } ∪ { ")" } ∪ { "," } ∪ { ")" }
= { ",", ")" }
```

```txt
FOLLOW(<angle>) = FIRST(")" ° FOLLOW(<bend>))
                = { ")" }
```

```txt
FOLLOW(<value>) = FIRST(")" ° FOLLOW(<metadata>))
                = { ")" }
```

```txt
FOLLOW(<number>) =
  FIRST("," <number> ")" ° FOLLOW(<point>))
  ∪ FIRST(")" ° FOLLOW(<point>))
= { "," } ∪ { ")" }
= { ",", ")" }
```

```txt
FOLLOW(<digits>) =
  FIRST("." <digits> ° FOLLOW(<number>))
  ∪ FOLLOW(<number>)
= { "." } ∪ { ",", ")" }
= { ".", ",", ")" }
```

```txt
FOLLOW(<string>) =
  FIRST("{" <city_elements> "}" ° FOLLOW(<city>))
  ∪ FIRST("{" <road_commands> "}" ° FOLLOW(<road>))
  ∪ FIRST("{" <building_commands> "}" ° FOLLOW(<building>))
  ∪ FIRST("{" <field_commands> "}" ° FOLLOW(<field>))
  ∪ FIRST("{" <zone_commands> "}" ° FOLLOW(<zone>))
  ∪ FIRST("{" <river_commands> "}" ° FOLLOW(<river>))
  ∪ FIRST(<point> "{" <metadata_commands> "}" ° FOLLOW(<sensor>))
  ∪ FIRST(<point> ° FOLLOW(<crop>))
  ∪ FIRST("," <value> ")" ° FOLLOW(<metadata>))
= { "{", "(", "," }
```

```txt
FOLLOW(<characters>) = FIRST("\"" ° FOLLOW(<string>))
                     = { "\"" }
```

```txt
FOLLOW(<character>) = FIRST(<characters> ° FOLLOW(<characters>))
                    = FIRST({ <character>, ε } ° { "\"" })
                    = { <letter>, <digit>, "_", "-", " " } ∪ { "\"" }
                    = { <letter>, <digit>, "_", "-", " ", "\"" }
```

```txt
FOLLOW(<letter>) = FOLLOW(<character>)
                 = { <letter>, <digit>, "_", "-", " ", "\"" }
```

```txt
FOLLOW(<digit>) =
  FOLLOW(<character>) ∪ FOLLOW(<digits>)
= { <letter>, <digit>, "_", "-", " ", "\"" } ∪ { ".", ",", ")" }
= { <letter>, <digit>, "_", "-", " ", "\"", ".", ",", ")" }
```
