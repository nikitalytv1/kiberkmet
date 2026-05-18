# Določanje končnega avtomata

Končni avtomat je zapisan kot:

```txt
M = (Q, Σ, δ, q0, F)
```

## Množica stanj Q

```txt
Q = {
  q0,
  qCityName,
  qCityOpen,
  qCityBody,

  qRoadName,
  qRoadOpen,
  qRoadBody,
  qRiverName,
  qRiverOpen,
  qRiverBody,
  qBuildingName,
  qBuildingOpen,
  qBuildingBody,
  qFieldName,
  qFieldOpen,
  qFieldBody,
  qZoneName,
  qZoneOpen,
  qZoneBody,

  qSensorName,
  qSensorPoint,
  qSensorOpen,
  qSensorBody,
  qCropName,
  qCropPoint,

  qRoadLineOpen,
  qRoadLinePoint1,
  qRoadLineComma,
  qRoadLinePoint2,
  qRoadLineClose,
  qRiverLineOpen,
  qRiverLinePoint1,
  qRiverLineComma,
  qRiverLinePoint2,
  qRiverLineClose,
  qBuildingLineOpen,
  qBuildingLinePoint1,
  qBuildingLineComma,
  qBuildingLinePoint2,
  qBuildingLineClose,
  qFieldLineOpen,
  qFieldLinePoint1,
  qFieldLineComma,
  qFieldLinePoint2,
  qFieldLineClose,
  qZoneLineOpen,
  qZoneLinePoint1,
  qZoneLineComma,
  qZoneLinePoint2,
  qZoneLineClose,

  qBuildingBoxOpen,
  qBuildingBoxPoint1,
  qBuildingBoxComma,
  qBuildingBoxPoint2,
  qBuildingBoxClose,
  qFieldBoxOpen,
  qFieldBoxPoint1,
  qFieldBoxComma,
  qFieldBoxPoint2,
  qFieldBoxClose,
  qZoneBoxOpen,
  qZoneBoxPoint1,
  qZoneBoxComma,
  qZoneBoxPoint2,
  qZoneBoxClose,

  qRoadBendOpen,
  qRoadBendPoint1,
  qRoadBendComma1,
  qRoadBendPoint2,
  qRoadBendComma2,
  qRoadBendAngle,
  qRoadBendClose,
  qRiverBendOpen,
  qRiverBendPoint1,
  qRiverBendComma1,
  qRiverBendPoint2,
  qRiverBendComma2,
  qRiverBendAngle,
  qRiverBendClose,

  qRoadSetOpen,
  qRoadSetKey,
  qRoadSetComma,
  qRoadSetValue,
  qRoadSetClose,
  qRiverSetOpen,
  qRiverSetKey,
  qRiverSetComma,
  qRiverSetValue,
  qRiverSetClose,
  qBuildingSetOpen,
  qBuildingSetKey,
  qBuildingSetComma,
  qBuildingSetValue,
  qBuildingSetClose,
  qFieldSetOpen,
  qFieldSetKey,
  qFieldSetComma,
  qFieldSetValue,
  qFieldSetClose,
  qZoneSetOpen,
  qZoneSetKey,
  qZoneSetComma,
  qZoneSetValue,
  qZoneSetClose,
  qSensorSetOpen,
  qSensorSetKey,
  qSensorSetComma,
  qSensorSetValue,
  qSensorSetClose
}
```

## Vhodna abeceda Σ

```txt
Σ = {
  "city", "road", "building", "field", "zone", "river", "sensor", "crop",
  "line", "box", "bend", "set",
  "{", "}", "(", ")", ",",
  <string>, <number>, <point>
}
```

## Začetno stanje

```txt
q0
```

## Končna stanja F

```txt
F = { q0 }
```

## Tabela prehodov δ

### Matrična oblika

| δ | `city` | `road` | `building` | `field` | `zone` | `river` | `sensor` | `crop` | `line` | `box` | `bend` | `set` | `{` | `}` | `(` | `)` | `,` | `<string>` | `<point>` | `<number>` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `q0` | `qCityName` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `qCityName` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qCityOpen` |  |  |  |
| `qCityOpen` |  |  |  |  |  |  |  |  |  |  |  |  | `qCityBody` |  |  |  |  |  |  |  |  |
| `qCityBody` |  | `qRoadName` | `qBuildingName` | `qFieldName` | `qZoneName` | `qRiverName` | `qSensorName` | `qCropName` |  |  |  |  |  | `q0` |  |  |  |  |  |  |  |
| `qRoadName` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadOpen` |  |  |  |
| `qRoadOpen` |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBody` |  |  |  |  |  |  |  |  |
| `qRoadBody` |  |  |  |  |  |  |  |  | `qRoadLineOpen` |  | `qRoadBendOpen` | `qRoadSetOpen` |  | `qCityBody` |  |  |  |  |  |  |  |
| `qRiverName` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverOpen` |  |  |  |
| `qRiverOpen` |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBody` |  |  |  |  |  |  |  |  |
| `qRiverBody` |  |  |  |  |  |  |  |  | `qRiverLineOpen` |  | `qRiverBendOpen` | `qRiverSetOpen` |  | `qCityBody` |  |  |  |  |  |  |  |
| `qBuildingName` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingOpen` |  |  |  |
| `qBuildingOpen` |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingBody` |  |  |  |  |  |  |  |  |
| `qBuildingBody` |  |  |  |  |  |  |  |  | `qBuildingLineOpen` | `qBuildingBoxOpen` |  | `qBuildingSetOpen` |  | `qCityBody` |  |  |  |  |  |  |  |
| `qFieldName` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldOpen` |  |  |  |
| `qFieldOpen` |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldBody` |  |  |  |  |  |  |  |  |
| `qFieldBody` |  |  |  |  |  |  |  |  | `qFieldLineOpen` | `qFieldBoxOpen` |  | `qFieldSetOpen` |  | `qCityBody` |  |  |  |  |  |  |  |
| `qZoneName` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneOpen` |  |  |  |
| `qZoneOpen` |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneBody` |  |  |  |  |  |  |  |  |
| `qZoneBody` |  |  |  |  |  |  |  |  | `qZoneLineOpen` | `qZoneBoxOpen` |  | `qZoneSetOpen` |  | `qCityBody` |  |  |  |  |  |  |  |
| `qSensorName` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qSensorPoint` |  |  |  |
| `qSensorPoint` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qSensorOpen` |  |  |
| `qSensorOpen` |  |  |  |  |  |  |  |  |  |  |  |  | `qSensorBody` |  |  |  |  |  |  |  |  |
| `qSensorBody` |  |  |  |  |  |  |  |  |  |  |  | `qSensorSetOpen` |  | `qCityBody` |  |  |  |  |  |  |  |
| `qCropName` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qCropPoint` |  |  |  |
| `qCropPoint` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qCityBody` |  |  |
| `qRoadLineOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadLinePoint1` |  |  |  |  |  |  |
| `qRoadLinePoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadLineComma` |  |  |
| `qRoadLineComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadLinePoint2` |  |  |  |  |
| `qRoadLinePoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadLineClose` |  |  |
| `qRoadLineClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBody` |  |  |  |  |  |
| `qRiverLineOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverLinePoint1` |  |  |  |  |  |  |
| `qRiverLinePoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverLineComma` |  |  |
| `qRiverLineComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverLinePoint2` |  |  |  |  |
| `qRiverLinePoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverLineClose` |  |  |
| `qRiverLineClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBody` |  |  |  |  |  |
| `qBuildingLineOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingLinePoint1` |  |  |  |  |  |  |
| `qBuildingLinePoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingLineComma` |  |  |
| `qBuildingLineComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingLinePoint2` |  |  |  |  |
| `qBuildingLinePoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingLineClose` |  |  |
| `qBuildingLineClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingBody` |  |  |  |  |  |
| `qFieldLineOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldLinePoint1` |  |  |  |  |  |  |
| `qFieldLinePoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldLineComma` |  |  |
| `qFieldLineComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldLinePoint2` |  |  |  |  |
| `qFieldLinePoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldLineClose` |  |  |
| `qFieldLineClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldBody` |  |  |  |  |  |
| `qZoneLineOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneLinePoint1` |  |  |  |  |  |  |
| `qZoneLinePoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneLineComma` |  |  |
| `qZoneLineComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneLinePoint2` |  |  |  |  |
| `qZoneLinePoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneLineClose` |  |  |
| `qZoneLineClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneBody` |  |  |  |  |  |
| `qBuildingBoxOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingBoxPoint1` |  |  |  |  |  |  |
| `qBuildingBoxPoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingBoxComma` |  |  |
| `qBuildingBoxComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingBoxPoint2` |  |  |  |  |
| `qBuildingBoxPoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingBoxClose` |  |  |
| `qBuildingBoxClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingBody` |  |  |  |  |  |
| `qFieldBoxOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldBoxPoint1` |  |  |  |  |  |  |
| `qFieldBoxPoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldBoxComma` |  |  |
| `qFieldBoxComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldBoxPoint2` |  |  |  |  |
| `qFieldBoxPoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldBoxClose` |  |  |
| `qFieldBoxClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldBody` |  |  |  |  |  |
| `qZoneBoxOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneBoxPoint1` |  |  |  |  |  |  |
| `qZoneBoxPoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneBoxComma` |  |  |
| `qZoneBoxComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneBoxPoint2` |  |  |  |  |
| `qZoneBoxPoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneBoxClose` |  |  |
| `qZoneBoxClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneBody` |  |  |  |  |  |
| `qRoadBendOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBendPoint1` |  |  |  |  |  |  |
| `qRoadBendPoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBendComma1` |  |  |
| `qRoadBendComma1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBendPoint2` |  |  |  |  |
| `qRoadBendPoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBendComma2` |  |  |
| `qRoadBendComma2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBendAngle` |  |  |  |  |
| `qRoadBendAngle` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBendClose` |  |
| `qRoadBendClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBody` |  |  |  |  |  |
| `qRiverBendOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBendPoint1` |  |  |  |  |  |  |
| `qRiverBendPoint1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBendComma1` |  |  |
| `qRiverBendComma1` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBendPoint2` |  |  |  |  |
| `qRiverBendPoint2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBendComma2` |  |  |
| `qRiverBendComma2` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBendAngle` |  |  |  |  |
| `qRiverBendAngle` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBendClose` |  |
| `qRiverBendClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBody` |  |  |  |  |  |
| `qRoadSetOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadSetKey` |  |  |  |  |  |  |
| `qRoadSetKey` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadSetComma` |  |  |  |
| `qRoadSetComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadSetValue` |  |  |  |  |
| `qRoadSetValue` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadSetClose` |  | `qRoadSetClose` |  |
| `qRoadSetClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRoadBody` |  |  |  |  |  |
| `qRiverSetOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverSetKey` |  |  |  |  |  |  |
| `qRiverSetKey` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverSetComma` |  |  |  |
| `qRiverSetComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverSetValue` |  |  |  |  |
| `qRiverSetValue` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverSetClose` |  | `qRiverSetClose` |  |
| `qRiverSetClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qRiverBody` |  |  |  |  |  |
| `qBuildingSetOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingSetKey` |  |  |  |  |  |  |
| `qBuildingSetKey` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingSetComma` |  |  |  |
| `qBuildingSetComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingSetValue` |  |  |  |  |
| `qBuildingSetValue` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingSetClose` |  | `qBuildingSetClose` |  |
| `qBuildingSetClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qBuildingBody` |  |  |  |  |  |
| `qFieldSetOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldSetKey` |  |  |  |  |  |  |
| `qFieldSetKey` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldSetComma` |  |  |  |
| `qFieldSetComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldSetValue` |  |  |  |  |
| `qFieldSetValue` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldSetClose` |  | `qFieldSetClose` |  |
| `qFieldSetClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qFieldBody` |  |  |  |  |  |
| `qZoneSetOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneSetKey` |  |  |  |  |  |  |
| `qZoneSetKey` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneSetComma` |  |  |  |
| `qZoneSetComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneSetValue` |  |  |  |  |
| `qZoneSetValue` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneSetClose` |  | `qZoneSetClose` |  |
| `qZoneSetClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qZoneBody` |  |  |  |  |  |
| `qSensorSetOpen` |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qSensorSetKey` |  |  |  |  |  |  |
| `qSensorSetKey` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qSensorSetComma` |  |  |  |
| `qSensorSetComma` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qSensorSetValue` |  |  |  |  |
| `qSensorSetValue` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qSensorSetClose` |  | `qSensorSetClose` |  |
| `qSensorSetClose` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `qSensorBody` |  |  |  |  |  |

### Prehodi v telesih blokov

| Trenutno stanje | Vhod | Naslednje stanje |
|---|---|---|
| `qRoadBody` | `"line"` | `qRoadLineOpen` |
| `qRoadBody` | `"bend"` | `qRoadBendOpen` |
| `qRoadBody` | `"set"` | `qRoadSetOpen` |
| `qRoadBody` | `"}"` | `qCityBody` |
| `qRiverBody` | `"line"` | `qRiverLineOpen` |
| `qRiverBody` | `"bend"` | `qRiverBendOpen` |
| `qRiverBody` | `"set"` | `qRiverSetOpen` |
| `qRiverBody` | `"}"` | `qCityBody` |
| `qBuildingBody` | `"line"` | `qBuildingLineOpen` |
| `qBuildingBody` | `"box"` | `qBuildingBoxOpen` |
| `qBuildingBody` | `"set"` | `qBuildingSetOpen` |
| `qBuildingBody` | `"}"` | `qCityBody` |
| `qFieldBody` | `"line"` | `qFieldLineOpen` |
| `qFieldBody` | `"box"` | `qFieldBoxOpen` |
| `qFieldBody` | `"set"` | `qFieldSetOpen` |
| `qFieldBody` | `"}"` | `qCityBody` |
| `qZoneBody` | `"line"` | `qZoneLineOpen` |
| `qZoneBody` | `"box"` | `qZoneBoxOpen` |
| `qZoneBody` | `"set"` | `qZoneSetOpen` |
| `qZoneBody` | `"}"` | `qCityBody` |
| `qSensorBody` | `"set"` | `qSensorSetOpen` |
| `qSensorBody` | `"}"` | `qCityBody` |

### Prehodi za `line`

| Trenutno stanje | Vhod | Naslednje stanje |
|---|---|---|
| `qRoadLineOpen` | `"("` | `qRoadLinePoint1` |
| `qRoadLinePoint1` | `<point>` | `qRoadLineComma` |
| `qRoadLineComma` | `","` | `qRoadLinePoint2` |
| `qRoadLinePoint2` | `<point>` | `qRoadLineClose` |
| `qRoadLineClose` | `")"` | `qRoadBody` |
| `qRiverLineOpen` | `"("` | `qRiverLinePoint1` |
| `qRiverLinePoint1` | `<point>` | `qRiverLineComma` |
| `qRiverLineComma` | `","` | `qRiverLinePoint2` |
| `qRiverLinePoint2` | `<point>` | `qRiverLineClose` |
| `qRiverLineClose` | `")"` | `qRiverBody` |
| `qBuildingLineOpen` | `"("` | `qBuildingLinePoint1` |
| `qBuildingLinePoint1` | `<point>` | `qBuildingLineComma` |
| `qBuildingLineComma` | `","` | `qBuildingLinePoint2` |
| `qBuildingLinePoint2` | `<point>` | `qBuildingLineClose` |
| `qBuildingLineClose` | `")"` | `qBuildingBody` |
| `qFieldLineOpen` | `"("` | `qFieldLinePoint1` |
| `qFieldLinePoint1` | `<point>` | `qFieldLineComma` |
| `qFieldLineComma` | `","` | `qFieldLinePoint2` |
| `qFieldLinePoint2` | `<point>` | `qFieldLineClose` |
| `qFieldLineClose` | `")"` | `qFieldBody` |
| `qZoneLineOpen` | `"("` | `qZoneLinePoint1` |
| `qZoneLinePoint1` | `<point>` | `qZoneLineComma` |
| `qZoneLineComma` | `","` | `qZoneLinePoint2` |
| `qZoneLinePoint2` | `<point>` | `qZoneLineClose` |
| `qZoneLineClose` | `")"` | `qZoneBody` |

### Prehodi za `box`

| Trenutno stanje | Vhod | Naslednje stanje |
|---|---|---|
| `qBuildingBoxOpen` | `"("` | `qBuildingBoxPoint1` |
| `qBuildingBoxPoint1` | `<point>` | `qBuildingBoxComma` |
| `qBuildingBoxComma` | `","` | `qBuildingBoxPoint2` |
| `qBuildingBoxPoint2` | `<point>` | `qBuildingBoxClose` |
| `qBuildingBoxClose` | `")"` | `qBuildingBody` |
| `qFieldBoxOpen` | `"("` | `qFieldBoxPoint1` |
| `qFieldBoxPoint1` | `<point>` | `qFieldBoxComma` |
| `qFieldBoxComma` | `","` | `qFieldBoxPoint2` |
| `qFieldBoxPoint2` | `<point>` | `qFieldBoxClose` |
| `qFieldBoxClose` | `")"` | `qFieldBody` |
| `qZoneBoxOpen` | `"("` | `qZoneBoxPoint1` |
| `qZoneBoxPoint1` | `<point>` | `qZoneBoxComma` |
| `qZoneBoxComma` | `","` | `qZoneBoxPoint2` |
| `qZoneBoxPoint2` | `<point>` | `qZoneBoxClose` |
| `qZoneBoxClose` | `")"` | `qZoneBody` |

### Prehodi za `bend`

| Trenutno stanje | Vhod | Naslednje stanje |
|---|---|---|
| `qRoadBendOpen` | `"("` | `qRoadBendPoint1` |
| `qRoadBendPoint1` | `<point>` | `qRoadBendComma1` |
| `qRoadBendComma1` | `","` | `qRoadBendPoint2` |
| `qRoadBendPoint2` | `<point>` | `qRoadBendComma2` |
| `qRoadBendComma2` | `","` | `qRoadBendAngle` |
| `qRoadBendAngle` | `<number>` | `qRoadBendClose` |
| `qRoadBendClose` | `")"` | `qRoadBody` |
| `qRiverBendOpen` | `"("` | `qRiverBendPoint1` |
| `qRiverBendPoint1` | `<point>` | `qRiverBendComma1` |
| `qRiverBendComma1` | `","` | `qRiverBendPoint2` |
| `qRiverBendPoint2` | `<point>` | `qRiverBendComma2` |
| `qRiverBendComma2` | `","` | `qRiverBendAngle` |
| `qRiverBendAngle` | `<number>` | `qRiverBendClose` |
| `qRiverBendClose` | `")"` | `qRiverBody` |

### Prehodi za `set`

| Trenutno stanje | Vhod | Naslednje stanje |
|---|---|---|
| `qRoadSetOpen` | `"("` | `qRoadSetKey` |
| `qRoadSetKey` | `<string>` | `qRoadSetComma` |
| `qRoadSetComma` | `","` | `qRoadSetValue` |
| `qRoadSetValue` | `<string>` | `qRoadSetClose` |
| `qRoadSetValue` | `<number>` | `qRoadSetClose` |
| `qRoadSetClose` | `")"` | `qRoadBody` |
| `qRiverSetOpen` | `"("` | `qRiverSetKey` |
| `qRiverSetKey` | `<string>` | `qRiverSetComma` |
| `qRiverSetComma` | `","` | `qRiverSetValue` |
| `qRiverSetValue` | `<string>` | `qRiverSetClose` |
| `qRiverSetValue` | `<number>` | `qRiverSetClose` |
| `qRiverSetClose` | `")"` | `qRiverBody` |
| `qBuildingSetOpen` | `"("` | `qBuildingSetKey` |
| `qBuildingSetKey` | `<string>` | `qBuildingSetComma` |
| `qBuildingSetComma` | `","` | `qBuildingSetValue` |
| `qBuildingSetValue` | `<string>` | `qBuildingSetClose` |
| `qBuildingSetValue` | `<number>` | `qBuildingSetClose` |
| `qBuildingSetClose` | `")"` | `qBuildingBody` |
| `qFieldSetOpen` | `"("` | `qFieldSetKey` |
| `qFieldSetKey` | `<string>` | `qFieldSetComma` |
| `qFieldSetComma` | `","` | `qFieldSetValue` |
| `qFieldSetValue` | `<string>` | `qFieldSetClose` |
| `qFieldSetValue` | `<number>` | `qFieldSetClose` |
| `qFieldSetClose` | `")"` | `qFieldBody` |
| `qZoneSetOpen` | `"("` | `qZoneSetKey` |
| `qZoneSetKey` | `<string>` | `qZoneSetComma` |
| `qZoneSetComma` | `","` | `qZoneSetValue` |
| `qZoneSetValue` | `<string>` | `qZoneSetClose` |
| `qZoneSetValue` | `<number>` | `qZoneSetClose` |
| `qZoneSetClose` | `")"` | `qZoneBody` |
| `qSensorSetOpen` | `"("` | `qSensorSetKey` |
| `qSensorSetKey` | `<string>` | `qSensorSetComma` |
| `qSensorSetComma` | `","` | `qSensorSetValue` |
| `qSensorSetValue` | `<string>` | `qSensorSetClose` |
| `qSensorSetValue` | `<number>` | `qSensorSetClose` |
| `qSensorSetClose` | `")"` | `qSensorBody` |

## Primer poti skozi avtomat

Za vhod:

```txt
city "Maribor" {
  crop "Koruza" (46.5557,15.6470)
}
```

je pot:

```txt
q0
-> qCityName
-> qCityOpen
-> qCityBody
-> qCropName
-> qCropPoint
-> qCityBody
-> q0
```

## Bolj kompleksen primer poti skozi avtomat

Za vhod:

```txt
city "Ptuj" {
  road "Poljska cesta" {
    line((46.4200,15.8690),(46.4210,15.8700))
    bend((46.4210,15.8700),(46.4218,15.8712),42)
    set("podlaga","asfalt")
  }

  field "Vrt ob hisi" {
    box((46.4202,15.8692),(46.4208,15.8701))
    set("tip rabe","vrt")
  }

  sensor "Vremenski senzor" (46.4205,15.8697) {
    set("temperatura",18.6)
  }

  crop "Solata" (46.4205,15.8698)
}
```

je pot:

```txt
q0
-> qCityName
-> qCityOpen
-> qCityBody
-> qRoadName
-> qRoadOpen
-> qRoadBody
-> qRoadLineOpen
-> qRoadLinePoint1
-> qRoadLineComma
-> qRoadLinePoint2
-> qRoadLineClose
-> qRoadBody
-> qRoadBendOpen
-> qRoadBendPoint1
-> qRoadBendComma1
-> qRoadBendPoint2
-> qRoadBendComma2
-> qRoadBendAngle
-> qRoadBendClose
-> qRoadBody
-> qRoadSetOpen
-> qRoadSetKey
-> qRoadSetComma
-> qRoadSetValue
-> qRoadSetClose
-> qRoadBody
-> qCityBody
-> qFieldName
-> qFieldOpen
-> qFieldBody
-> qFieldBoxOpen
-> qFieldBoxPoint1
-> qFieldBoxComma
-> qFieldBoxPoint2
-> qFieldBoxClose
-> qFieldBody
-> qFieldSetOpen
-> qFieldSetKey
-> qFieldSetComma
-> qFieldSetValue
-> qFieldSetClose
-> qFieldBody
-> qCityBody
-> qSensorName
-> qSensorPoint
-> qSensorOpen
-> qSensorBody
-> qSensorSetOpen
-> qSensorSetKey
-> qSensorSetComma
-> qSensorSetValue
-> qSensorSetClose
-> qSensorBody
-> qCityBody
-> qCropName
-> qCropPoint
-> qCityBody
-> q0
```
