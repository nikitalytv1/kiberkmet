<div align="center">
  <img src="frontend/public/logo.svg" width="72" height="72" alt="Kiberkmet logo" />

  # Kiberkmet

  **Digitalni dvojček za kmetijstvo**

  ![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
  ![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)
  ![Kotlin](https://img.shields.io/badge/Desktop-Kotlin-7F52FF?logo=kotlin&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-4169E1?logo=postgresql&logoColor=white)
</div>

---

Kiberkmet je skupinski projektni repozitorij, ki združuje delo pri več predmetih. Osnova projekta je **spletni sistem za analizo kmetijskih zemljišč**, ki mu sledijo samostojne komponente iz predmetov Principi programskih jezikov, Prevajanje in Sistemska administracija.

---

## 🌱 Spletni sistem

Jedro projekta je spletna aplikacija z **digitalnim dvojčkom** kmetijskega parcele.

**Backend** (Node.js + Express + PostgreSQL/PostGIS) izpostavlja REST API za upravljanje parcel, analizo tal in vremenska poizvedbe. Za vsako parcelo sistem samodejno pridobi podatke o tleh prek [SoilGrids (ISRIC)](https://www.isric.org/explore/soilgrids) in vremensko napoved prek [Open-Meteo](https://open-meteo.com/). Priporočilni algoritem nato oceni primernost 28 različnih pridelkov z rezultatom od 0 do 100.

**Frontend** (React + TypeScript) nudi interaktivni zemljevid za risanje in pregled parcel, nadzorno ploščo s povzetki analiz ter pregledne vizualizacije podatkov o tleh in pridelkih.

```
backend/   – REST API, Prisma ORM, geospatialne poizvedbe
frontend/  – React SPA, interaktivni zemljevid, vizualizacije
```

---

## 🧩 Principi programskih jezikov

Naloge pri predmetu Principi programskih jezikov vsebujejo dve vaji.

**Vaja 1** je konzolno orodje za obdelavo podatkov, napisano v Kotlinu.

**Vaja 2** je namizna aplikacija zgrajena s **Kotlin Multiplatform** in Compose Multiplatform, ki teče na JVM. Aplikacijo zaženete z:

```shell
./gradlew :composeApp:run
```

```
principi/vaja1/  – orodje za obdelavo podatkov
principi/vaja2/  – namizna Compose Multiplatform aplikacija
```

---

## 🔤 Prevajanje

V okviru predmeta Prevajanje je bil zasnovan in implementiran **domensko specifičen jezik (DSL)** za opis geografskih in kmetijskih območij.

Jezik omogoča modeliranje mest, cest, stavb, polj, con, rek, senzorjev in pridelkov z geometrijskimi konstrukti (`line`, `box`, `bend`). Prevajalnik iz izvorne datoteke (`.txt`) generira izhod v formatu **GeoJSON**, ki ga je mogoče neposredno vizualizirati na zemljevidu.

Primer konstrukta:

```
city "Maribor" {
  field "Njiva 1" { box((46.55, 15.64), (46.56, 15.65)) }
  sensor "pH meter" POINT(46.555, 15.645) { set(ph, 6.8) }
  crop "wheat" POINT(46.557, 15.647)
}
```

```
prevajanje/jezik/  – prevajalnik DSL → GeoJSON (Kotlin + Gradle)
prevajanje/Lexer/  – leksikalni analizator
prevajanje/BNF.md  – gramatika jezika (BNF)
```

---

## ☁️ Sistemska administracija

Dokumentacija projektnih nalog pri predmetu Sistemska administracija pokriva postavitev in upravljanje infrastrukture v oblaku **Microsoft Azure** – virtualni stroji, omrežne storitve in varnostne nastavitve.

```
sistemskaAdministracija/  – projektne naloge in dokumentacija Azure
```

---

## 👥 Ekipa

- Nikita Lytvynenko
- Kevin Ornik
- Gašper Potočnik
