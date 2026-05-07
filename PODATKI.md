# Kiberkmet – Nabor podatkov in funkcionalnosti digitalnega dvojčka

## 1. Nabor podatkov

### Parcele (geografski podatki)
Osnova sistema so kmetijske parcele, shranjene v bazi s prostorsko podporo (PostgreSQL + PostGIS).

| Podatek | Opis |
|---|---|
| `gerk_pid` | Identifikator iz državnega registra GERK |
| `typeOfUse` | Vrsta rabe tal (njiva, vinograd, gozd, travnik …) |
| `coordinates` | Geografski poligon meje parcele (WGS84, GeoJSON) |

> **Geografska vezanost:** Vsaka parcela je prostorsko opredeljena z večtočkovnim poligonom v koordinatnem sistemu WGS84 (SRID 4326). Iz poligona sistem izračuna centroid, ki se nato uporablja za vse nadaljnje poizvedbe.

---

### Analiza tal (SoilGrids)
Za vsako parcelo sistem poizveduje zunanjo storitev [SoilGrids (ISRIC)](https://www.isric.org/explore/soilgrids) na podlagi koordinat centroida.

| Skupina | Podatki |
|---|---|
| Fizikalne lastnosti | Gostota tal, delež gline/peska/melja, vsebnost skeleta, vododrž |
| Klasifikacija tal | WRB klasifikacija tal z verjetnostjo |
| Izpeljane lastnosti | Gostota organskega ogljika, zaloga organskega ogljika |

---

### Vremenski podatki (Open-Meteo)
Sistem v realnem času pridobiva vremenske podatke za lokacijo parcele.

| Podatek | Opis |
|---|---|
| Trenutno stanje | Temperatura, vlažnost, padavine, hitrost vetra |
| 7-dnevna napoved | Min/max temperatura, dnevne padavine |

---

### Pridelki (stat.si)
Zgodovinski podatki o pridelkih so pridobljeni iz Statističnega urada RS.

| Podatek | Opis |
|---|---|
| `naziv` | Vrsta pridelka (pšenica, koruza, fižol …) |
| `leto` | Leto pridelave |
| `povrsina` | Površina v ha |
| `kolicina` | Količina v tonah |

---

## 2. Dodatne funkcionalnosti

### Že implementirano
- **Priporočilni sistem za pridelke** – algoritem ocenjuje primernost 28 različnih pridelkov (0–100 točk) glede na tla, vreme, letni čas in lokacijo
- **Klasifikacija teksture tal** – razvrstitev v 12 razredov (glinasta, peščena, ilovnata …)
- **CRUD upravljanje parcel** – dodajanje, urejanje, brisanje parcel z GeoJSON poligonom

### Načrtovano
- **Interaktivni zemljevid** – prikaz parcel na zemljevidu z možnostjo risanja novih
- **Nadzorna plošča** – pregled vseh parcel, povzetki analiz in priporočil
- **Avtentikacija** – prijava in registracija z JWT žetoni
- **Veriga blokov** – sledljivost pridelkov in analiz (zapisovanje ključnih podatkov on-chain) ?
- **Nastavitve profila** – upravljanje računa, varnost, jezik vmesnika

### Izbira
**Spletna storitev (Naloga 1)**
- omogočite avtentikacijo s pomočjo žetonov JWT
- uporabite geoprostorske poizvedbe (geospatial queries)

**Spletni vmesnik (Naloga 2)**
- Napredna vizualizacija podatkov (D3.js,...)
- Animirane vizualizacije podatkov (prikaz na zemljevidu skozi čas)

