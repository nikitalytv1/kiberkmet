# Testni primeri za BNF notacijo

## Primer 1

```txt
city "Maribor" {
  road "Dostopna pot" {
    line((46.5547,15.6459),(46.5553,15.6467))
    bend((46.5553,15.6467),(46.5560,15.6474),35)
    set("podlaga","makadam")
  }

  building "Kmetija" {
    box((46.5542,15.6451),(46.5545,15.6455))
    line((46.5542,15.6451),(46.5545,15.6455))
    set("tip","skladišče")
  }

  field "Njiva pri gozdu" {
    box((46.5550,15.6460),(46.5562,15.6476))
    line((46.5550,15.6460),(46.5562,15.6460))
    set("tip rabe","njiva")
    set("procent površine",75)
    set("načrtovan pridelek","koruza")
  }

  zone "Analizna cona" {
    box((46.5548,15.6458),(46.5564,15.6478))
    line((46.5548,15.6458),(46.5564,15.6478))
    set("šifra regije",8)
  }

  river "Potok" {
    line((46.5539,15.6450),(46.5566,15.6480))
    bend((46.5548,15.6460),(46.5558,15.6470),25)
    set("vodno tveganje","srednje")
  }

  sensor "Talni senzor 1" (46.5555,15.6468) {
    set("ph",5.7)
    set("organski ogljik",12.4)
    set("dušik",1.8)
  }

  crop "Koruza" (46.5557,15.6470)
}
```

## Primer 2

```txt
city "Ptuj" {
  road "Poljska cesta" {
    line((46.4200,15.8690),(46.4210,15.8700))
    bend((46.4210,15.8700),(46.4218,15.8712),42)
    set("podlaga","asfalt")
  }

  building "Hiša" {
    box((46.4197,15.8685),(46.4201,15.8689))
    line((46.4197,15.8685),(46.4201,15.8689))
    set("tip","kmečka hiša")
  }

  field "Vrt ob hiši" {
    box((46.4202,15.8692),(46.4208,15.8701))
    line((46.4202,15.8692),(46.4208,15.8692))
    set("tip rabe","vrt")
    set("procent površine",40)
    set("načrtovan pridelek","solata")
  }

  zone "Namakanje" {
    box((46.4200,15.8690),(46.4210,15.8704))
    line((46.4200,15.8690),(46.4210,15.8704))
    set("namakanje","aktivno")
  }

  river "Kanal" {
    line((46.4198,15.8694),(46.4212,15.8708))
    bend((46.4204,15.8700),(46.4212,15.8708),18)
    set("pretok","nizek")
  }

  sensor "Vremenski senzor" (46.4205,15.8697) {
    set("temperatura",18.6)
    set("možnost padavin",35)
    set("vlažnost",61)
  }

  crop "Solata" (46.4205,15.8698)
}
```

## Primer 3

```txt
city "Ljutomer" {
  road "Glavna pot" {
    line((46.5150,16.1450),(46.5160,16.1460))
    bend((46.5160,16.1460),(46.5170,16.1472),30)
    set("podlaga","gramoz")
  }

  building "Silos" {
    box((46.5147,16.1446),(46.5152,16.1452))
    line((46.5147,16.1446),(46.5152,16.1452))
    set("kapaciteta",120)
  }

  field "Pšenično polje" {
    box((46.5154,16.1455),(46.5175,16.1480))
    line((46.5154,16.1455),(46.5175,16.1455))
    set("tip rabe","njiva")
    set("procent površine",100)
    set("načrtovan pridelek","pšenica")
    set("količina semena kg",220)
  }

  zone "Pomurska cona" {
    box((46.5150,16.1450),(46.5180,16.1485))
    line((46.5150,16.1450),(46.5180,16.1485))
    set("šifra regije",1)
  }

  river "Mali potok" {
    line((46.5145,16.1448),(46.5182,16.1482))
    bend((46.5160,16.1462),(46.5174,16.1478),22)
    set("vodno tveganje","nizko")
  }

  sensor "Talni senzor 2" (46.5164,16.1468) {
    set("ph",6.8)
    set("glina",24)
    set("pesek",42)
  }

  crop "Pšenica" (46.5166,16.1470)
}
```

## Primer 4

```txt
city "Bled" {
  road "Sadovnjak pot" {
    line((46.3680,14.1130),(46.3688,14.1140))
    bend((46.3688,14.1140),(46.3695,14.1152),28)
    set("podlaga","zemlja")
  }

  building "Lopa" {
    box((46.3677,14.1127),(46.3681,14.1131))
    line((46.3677,14.1127),(46.3681,14.1131))
    set("tip","shramba za orodje")
  }

  field "Sadovnjak sever" {
    box((46.3682,14.1134),(46.3696,14.1154))
    line((46.3682,14.1134),(46.3696,14.1134))
    set("tip rabe","sadovnjak")
    set("procent površine",80)
    set("načrtovan pridelek","jablana")
  }

  zone "Zaščitena cona" {
    box((46.3680,14.1130),(46.3698,14.1157))
    line((46.3680,14.1130),(46.3698,14.1157))
    set("zaščita","visoka")
  }

  river "Jarek" {
    line((46.3678,14.1132),(46.3698,14.1155))
    bend((46.3688,14.1143),(46.3698,14.1155),20)
    set("pretok","sezonski")
  }

  sensor "Senzor vlage" (46.3690,14.1144) {
    set("vlažnost tal",44)
    set("ph",6.4)
    set("temperatura",15.2)
  }

  crop "Jablana" (46.3691,14.1146)
}
```

## Primer 5

```txt
city "Kranj" {
  road "Vinograd cesta" {
    line((46.2380,14.3550),(46.2390,14.3560))
    bend((46.2390,14.3560),(46.2400,14.3572),33)
    set("podlaga","asfalt")
  }

  building "Klet" {
    box((46.2378,14.3547),(46.2383,14.3552))
    line((46.2378,14.3547),(46.2383,14.3552))
    set("tip","vinska klet")
  }

  field "Vinograd jug" {
    box((46.2385,14.3554),(46.2402,14.3575))
    line((46.2385,14.3554),(46.2402,14.3554))
    set("tip rabe","vinograd")
    set("procent površine",100)
    set("načrtovan pridelek","sauvignon")
  }

  zone "Gorenjska regija" {
    box((46.2380,14.3550),(46.2405,14.3578))
    line((46.2380,14.3550),(46.2405,14.3578))
    set("šifra regije",9)
  }

  river "Hudournik" {
    line((46.2382,14.3551),(46.2404,14.3576))
    bend((46.2391,14.3562),(46.2404,14.3576),27)
    set("vodno tveganje","visoko")
  }

  sensor "Vinogradniški senzor" (46.2394,14.3565) {
    set("ph",7.1)
    set("organski ogljik",18.5)
    set("možnost padavin",22)
  }

  crop "Sauvignon" (46.2395,14.3567)
}
```
