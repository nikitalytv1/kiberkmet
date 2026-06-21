import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("Začenjam seed...\n");

  const janez = await prisma.user.upsert({
    where: { email: "janez@kmet.si" },
    update: {},
    create: { name: "Janez Novak", email: "janez@kmet.si" },
  });
  const maja = await prisma.user.upsert({
    where: { email: "maja@kmet.si" },
    update: {},
    create: { name: "Maja Kovač", email: "maja@kmet.si" },
  });
  console.log("Ustvarjeni userji");

  console.log("\nSeeding parcele...");

  const obstoječa1 = await prisma.$queryRaw`SELECT id FROM "Parcela" WHERE gerk_pid = ${BigInt(10001001)}`;
  const parcela1 = obstoječa1.length > 0 ? obstoječa1[0] : (await prisma.$queryRaw`
    INSERT INTO "Parcela" (id, gerk_pid, "typeOfUse", coordinates, "userId", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(), ${BigInt(10001001)}, 'Njiva',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[15.6421,46.5547],[15.6431,46.5547],[15.6431,46.5557],[15.6421,46.5557],[15.6421,46.5547]]]}'),
      ${janez.id}::uuid, NOW(), NOW()
    )
    RETURNING id, gerk_pid::text, "typeOfUse", "userId"
  `)[0];
  console.log(`   ${obstoječa1.length > 0 ? "Preskočeno" : "Ustvarjeno"}: Njiva (10001001)`);

  const obstoječa2 = await prisma.$queryRaw`SELECT id FROM "Parcela" WHERE gerk_pid = ${BigInt(10001002)}`;
  const parcela2 = obstoječa2.length > 0 ? obstoječa2[0] : (await prisma.$queryRaw`
    INSERT INTO "Parcela" (id, gerk_pid, "typeOfUse", coordinates, "userId", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(), ${BigInt(10001002)}, 'Vinograd',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[15.6500,46.5600],[15.6510,46.5600],[15.6510,46.5610],[15.6500,46.5610],[15.6500,46.5600]]]}'),
      ${janez.id}::uuid, NOW(), NOW()
    )
    RETURNING id, gerk_pid::text, "typeOfUse", "userId"
  `)[0];
  console.log(`   ${obstoječa2.length > 0 ? "Preskočeno" : "Ustvarjeno"}: Vinograd (10001002)`);

  const obstoječa3 = await prisma.$queryRaw`SELECT id FROM "Parcela" WHERE gerk_pid = ${BigInt(10001003)}`;
  const parcela3 = obstoječa3.length > 0 ? obstoječa3[0] : (await prisma.$queryRaw`
    INSERT INTO "Parcela" (id, gerk_pid, "typeOfUse", coordinates, "userId", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(), ${BigInt(10001003)}, 'Gozd',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[15.6600,46.5700],[15.6620,46.5700],[15.6620,46.5720],[15.6600,46.5720],[15.6600,46.5700]]]}'),
      ${maja.id}::uuid, NOW(), NOW()
    )
    RETURNING id, gerk_pid::text, "typeOfUse", "userId"
  `)[0];
  console.log(`   ${obstoječa3.length > 0 ? "Preskočeno" : "Ustvarjeno"}: Gozd (10001003)`);

  // Analize
  console.log("\nSeeding analize...");
  for (const [parcelaId, lon, lat, physical, chemical, classification, derived] of [
    [parcela1.id, 15.6426, 46.5552,
      { bdod: { mean: 1.35, Q005: 1.20, Q095: 1.50 }, clay: { mean: 22.4, Q005: 18.1, Q095: 28.3 }, sand: { mean: 41.2, Q005: 35.0, Q095: 48.0 }, silt: { mean: 36.4, Q005: 30.0, Q095: 42.0 } },
      { phh2o: { mean: 6.4, Q005: 5.8, Q095: 7.1 }, cec: { mean: 18.6, Q005: 12.2, Q095: 25.3 }, nitrogen: { mean: 1.8, Q005: 1.1, Q095: 2.5 }, soc: { mean: 24.1, Q005: 14.8, Q095: 36.2 } },
      { wrb: "Cambisol", probability: 0.72 },
      { ocd: { mean: 15.2, Q005: 10.1, Q095: 21.3 }, ocs: { mean: 72.4, Q005: 48.2, Q095: 98.1 } }],
    [parcela2.id, 15.6505, 46.5605,
      { bdod: { mean: 1.28, Q005: 1.10, Q095: 1.45 }, clay: { mean: 18.2, Q005: 14.0, Q095: 24.1 }, sand: { mean: 52.3, Q005: 45.0, Q095: 60.0 }, silt: { mean: 29.5, Q005: 24.0, Q095: 35.0 } },
      { phh2o: { mean: 6.9, Q005: 6.2, Q095: 7.5 }, cec: { mean: 15.4, Q005: 9.8, Q095: 22.0 }, nitrogen: { mean: 1.3, Q005: 0.8, Q095: 2.1 }, soc: { mean: 18.7, Q005: 11.2, Q095: 28.4 } },
      { wrb: "Luvisol", probability: 0.65 },
      { ocd: { mean: 12.8, Q005: 8.5, Q095: 18.2 }, ocs: { mean: 61.3, Q005: 40.1, Q095: 85.4 } }],
  ]) {
    const obstoječa = await prisma.analiza.findFirst({ where: { parcelaId, lon, lat } });
    if (obstoječa) {
      console.log(`   Analiza za parcelo ${parcelaId} že obstaja`);
    } else {
      await prisma.analiza.create({ data: { parcelaId, lon, lat, physicalSoil: physical, chemicalProperties: chemical, soilClassification: classification, derivedProperties: derived } });
      console.log(`   Analiza ustvarjena`);
    }
  }

  // Pridelki
  console.log("\nSeeding pridelki...");
  for (const [parcelaId, naziv, leto, povrsina, kolicina, rawData] of [
    [parcela1.id, "Pšenica", 2024, 2.5, 17.5, { vir: "stat.si", enota: "tone/ha" }],
    [parcela1.id, "Koruza", 2023, 2.5, 22.3, { vir: "stat.si", enota: "tone/ha" }],
    [parcela2.id, "Fižol", 2024, 1.2, 8.4, { vir: "stat.si", enota: "tone/ha" }],
    [parcela3.id, "Grah", 2024, 5.0, 45.0, { vir: "stat.si", enota: "tone/ha" }],
  ]) {
    const obstoječi = await prisma.pridelek.findFirst({ where: { parcelaId, naziv, leto } });
    if (obstoječi) {
      console.log(`   Pridelek ${naziv} (${leto}) že obstaja`);
    } else {
      await prisma.pridelek.create({ data: { parcelaId, naziv, leto, povrsina, kolicina, rawData } });
      console.log(`   Pridelek ${naziv} (${leto}) ustvarjen`);
    }
  }

  console.log("\nSeed uspešen!");
}

main()
  .catch((e) => {
    console.error("Seed napaka:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
