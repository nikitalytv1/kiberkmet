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

## Primer 6

```txt
city "Murska Sobota" {
  road "Njivska pot" {
    line((46.6520,16.1660),(46.6530,16.1672))
    bend((46.6530,16.1672),(46.6540,16.1684),38)
    set("podlaga","makadam")
  }

  building "Sušilnica" {
    box((46.6517,16.1657),(46.6522,16.1662))
    line((46.6517,16.1657),(46.6522,16.1662))
    set("tip","sušilnica za žito")
  }

  field "Koruznо polje" {
    box((46.6524,16.1665),(46.6542,16.1688))
    line((46.6524,16.1665),(46.6542,16.1665))
    set("tip rabe","njiva")
    set("procent površine",90)
    set("načrtovan pridelek","koruza")
    set("količina semena kg",180)
  }

  zone "Pomurska ravnina" {
    box((46.6519,16.1658),(46.6545,16.1692))
    line((46.6519,16.1658),(46.6545,16.1692))
    set("šifra regije",1)
  }

  river "Ledava" {
    line((46.6515,16.1655),(46.6548,16.1695))
    bend((46.6530,16.1670),(46.6542,16.1685),20)
    set("vodno tveganje","srednje")
  }

  sensor "Talni senzor 3" (46.6533,16.1675) {
    set("ph",6.2)
    set("organski ogljik",9.8)
    set("vlažnost tal",55)
  }

  crop "Koruza" (46.6535,16.1677)
}
```

## Primer 7

```txt
city "Velenje" {
  road "Rudarska cesta" {
    line((46.3590,15.1080),(46.3600,15.1092))
    bend((46.3600,15.1092),(46.3610,15.1104),45)
    set("podlaga","asfalt")
  }

  building "Skladišče" {
    box((46.3587,15.1077),(46.3592,15.1082))
    line((46.3587,15.1077),(46.3592,15.1082))
    set("tip","industrijsko skladišče")
  }

  field "Travnik ob jezeru" {
    box((46.3594,15.1085),(46.3614,15.1108))
    line((46.3594,15.1085),(46.3614,15.1085))
    set("tip rabe","travnik")
    set("procent površine",60)
    set("načrtovan pridelek","trava")
  }

  zone "Industrijska cona" {
    box((46.3589,15.1079),(46.3617,15.1112))
    line((46.3589,15.1079),(46.3617,15.1112))
    set("zaščita","nizka")
  }

  river "Paka" {
    line((46.3585,15.1075),(46.3619,15.1115))
    bend((46.3599,15.1090),(46.3613,15.1107),30)
    set("pretok","srednji")
  }

  sensor "Okoljski senzor" (46.3603,15.1095) {
    set("temperatura",12.4)
    set("vlažnost",72)
    set("možnost padavin",48)
  }

  crop "Trava" (46.3605,15.1097)
}
```

## Primer 8

```txt
city "Nova Gorica" {
  road "Vinorodna pot" {
    line((45.9560,13.6520),(45.9570,13.6532))
    bend((45.9570,13.6532),(45.9580,13.6544),50)
    set("podlaga","zemlja")
  }

  building "Zidanica" {
    box((45.9557,13.6517),(45.9562,13.6522))
    line((45.9557,13.6517),(45.9562,13.6522))
    set("tip","zidanica")
  }

  field "Vinograd sever" {
    box((45.9563,13.6524),(45.9583,13.6547))
    line((45.9563,13.6524),(45.9583,13.6524))
    set("tip rabe","vinograd")
    set("procent površine",100)
    set("načrtovan pridelek","merlot")
  }

  zone "Goriška brda" {
    box((45.9558,13.6519),(45.9586,13.6550))
    line((45.9558,13.6519),(45.9586,13.6550))
    set("šifra regije",5)
  }

  river "Soča" {
    line((45.9554,13.6515),(45.9589,13.6553))
    bend((45.9568,13.6530),(45.9582,13.6546),15)
    set("vodno tveganje","nizko")
  }

  sensor "Vinogradniški senzor 2" (45.9572,13.6535) {
    set("ph",7.3)
    set("organski ogljik",21.0)
    set("temperatura",17.8)
  }

  crop "Merlot" (45.9574,13.6537)
}
```

## Primer 9

```txt
city "Koper" {
  road "Obalna pot" {
    line((45.5480,13.7290),(45.5490,13.7302))
    bend((45.5490,13.7302),(45.5500,13.7314),25)
    set("podlaga","asfalt")
  }

  building "Ribnica" {
    box((45.5477,13.7287),(45.5482,13.7292))
    line((45.5477,13.7287),(45.5482,13.7292))
    set("tip","ribiška lopa")
  }

  field "Oljčni nasad" {
    box((45.5484,13.7295),(45.5503,13.7318))
    line((45.5484,13.7295),(45.5503,13.7295))
    set("tip rabe","nasad")
    set("procent površine",85)
    set("načrtovan pridelek","oljke")
  }

  zone "Primorska cona" {
    box((45.5479,13.7289),(45.5506,13.7321))
    line((45.5479,13.7289),(45.5506,13.7321))
    set("šifra regije",6)
  }

  river "Badaševica" {
    line((45.5475,13.7285),(45.5508,13.7324))
    bend((45.5490,13.7300),(45.5504,13.7316),18)
    set("pretok","nizek")
  }

  sensor "Mediteranski senzor" (45.5493,13.7305) {
    set("temperatura",22.5)
    set("vlažnost",58)
    set("ph",7.8)
  }

  crop "Oljke" (45.5495,13.7307)
}
```

## Primer 10

```txt
city "Celje" {
  road "Savinjska pot" {
    line((46.2310,15.2610),(46.2320,15.2622))
    bend((46.2320,15.2622),(46.2330,15.2634),36)
    set("podlaga","gramoz")
  }

  building "Mlin" {
    box((46.2307,15.2607),(46.2312,15.2612))
    line((46.2307,15.2607),(46.2312,15.2612))
    set("tip","mlin")
  }

  field "Hmeljišče" {
    box((46.2314,15.2614),(46.2334,15.2638))
    line((46.2314,15.2614),(46.2334,15.2614))
    set("tip rabe","njiva")
    set("procent površine",95)
    set("načrtovan pridelek","hmelj")
    set("količina semena kg",40)
  }

  zone "Savinjska dolina" {
    box((46.2309,15.2609),(46.2337,15.2641))
    line((46.2309,15.2609),(46.2337,15.2641))
    set("šifra regije",3)
  }

  river "Savinja" {
    line((46.2305,15.2605),(46.2340,15.2644))
    bend((46.2319,15.2620),(46.2333,15.2636),24)
    set("vodno tveganje","visoko")
  }

  sensor "Hmeljarski senzor" (46.2323,15.2625) {
    set("ph",6.5)
    set("dušik",2.3)
    set("vlažnost tal",48)
  }

  crop "Hmelj" (46.2325,15.2627)
}
```