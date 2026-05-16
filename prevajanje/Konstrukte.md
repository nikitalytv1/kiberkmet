# Konstrukti jezika

## 1. Osnovni konstrukti

### `city "NAME" { ... }`
**Mesto / naseljeno območje**

Glavni konstruktor jezika. Predstavlja celotno mesto oziroma območje, ki ga opisujemo. Vse ostale infrastrukturne, naravne in kmetijske komponente so definirane znotraj tega bloka.

### `road "NAME" { ... }`
**Cesta / prometna povezava**

Konstruktor za opis cestne infrastrukture. Cesta je predstavljena kot polilinija, sestavljena iz enega ali več linearnih ali ukrivljenih segmentov. Uporablja se za modeliranje ulic, glavnih cest, dostopnih poti in drugih prometnih povezav.

### `building "NAME" { ... }`
**Stavba**

Konstruktor za opis zgradb v urbanem prostoru. Stavba je predstavljena kot zaprt poligon, ki določa geometrijske meje objekta. Uporablja se za modeliranje stanovanjskih, poslovnih, raziskovalnih ali industrijskih objektov.

---

## 2. Razširjeni konstrukti

### `field "NAME" { ... }`
**Kmetijsko polje / zemljišče**

Predstavlja zemljišče, namenjeno kmetijski uporabi ali analizi kakovosti tal. Konstruktor omogoča opis geometrije polja ter dodajanje dodatnih lastnosti, kot so tip tal, vlažnost ali druge meritve.

### `zone "NAME" { ... }`
**Funkcionalna cona**

Predstavlja območje s specifičnim namenom uporabe. Uporablja se za modeliranje različnih območij znotraj mesta ali njegove okolice.

Primeri uporabe:
- park
- zaščiteno naravno območje
- industrijska cona
- zelena cona

Cona je predstavljena kot poligon.

### `river "NAME" { ... }`
**Reka / vodni tok**

Konstruktor za opis vodnih objektov. Reka je predstavljena kot polilinija, ki sledi toku vode skozi definirane koordinate.

### `sensor "NAME" POINT { ... }`
**Senzor za spremljanje podatkov**

Predstavlja merilno napravo, nameščeno na določeni lokaciji. Konstruktor se uporablja za spremljanje okoljskih ali kmetijskih parametrov.

Primeri podatkov:
- vlažnost tal
- pH vrednost
- temperatura
- količina padavin
- kakovost zraka

### `crop "NAME" POINT`
**Kmetijska kultura / rastlina**

Točkovni element, ki predstavlja lokacijo posamezne kmetijske kulture ali rastline. Uporablja se za označevanje zasaditev na določenem območju.

Primeri:
- wheat
- corn
- tomato
- potato

### `set(KEY, VALUE)`
**Metapodatki elementov**

Omogoča dodajanje dodatnih atributov posameznim elementom jezika. S tem lahko objektom določimo specifične lastnosti, pomembne za analizo ali vizualizacijo.

Primeri:
- tip tal
- vlažnost
- temperatura
- vrsta kulture
- status objekta

---

## 3. Geometrijski konstrukti

### `line(POINT, POINT)`
**Ravna črta**

Ukaz za ustvarjanje linearnega segmenta med dvema koordinatama. Uporablja se pri definiciji cest, meja območij in drugih linearnih struktur.

### `box(POINT, POINT)`
**Pravokotno območje**

Ukaz za ustvarjanje pravokotnega območja z uporabo dveh nasprotnih koordinat. Uporablja se za hitro modeliranje stavb, polj ali drugih pravokotnih objektov.

### `bend(POINT, POINT, ANGLE)`
**Ukrivljen segment**

Ukaz za ustvarjanje ukrivljene povezave med dvema točkama z določenim kotom ukrivljenosti. Uporablja se predvsem pri modeliranju cest ali naravnih linijskih struktur.