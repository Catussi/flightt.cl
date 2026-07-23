import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const imagesDir = join(__dirname, "seed-images");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] ??= val;
  }
}

loadEnvFile(join(root, ".env"));
loadEnvFile(join(root, ".env.seed"));
loadEnvFile(join(root, ".env.local"));

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    code: "FT-001",
    image: "FT-001-poleron-jordan-rojo-negro.png",
    title: "Polerón Jordan rojo/negro",
    price: 42000,
    brand: "Jordan",
    size: "L",
    category: "TOP",
    description: "Polerón en excelente estado, tela gruesa, ideal para feria.",
  },
  {
    code: "FT-002",
    image: "FT-002-polera-nike-blanca.png",
    title: "Polera Nike blanca básica",
    price: 18000,
    brand: "Nike",
    size: "M",
    category: "TOP",
    description: "Básica limpia, sin manchas. Perfecta daily.",
    discountPercent: 15,
    discountDays: 7,
  },
  {
    code: "FT-003",
    image: "FT-003-chaqueta-puffer-jordan-negra.png",
    title: "Chaqueta puffer Jordan negra",
    price: 55000,
    brand: "Jordan",
    size: "XL",
    category: "TOP",
    description: "Puffer abrigada, cierre y bolsillos OK.",
  },
  {
    code: "FT-004",
    image: "FT-004-cortaviento-tommy-azul.png",
    title: "Cortaviento Tommy azul marino",
    price: 38000,
    brand: "Tommy Hilfiger",
    size: "L",
    category: "TOP",
    description: "Cortaviento impermeable liviano.",
    discountPercent: 20,
    discountDays: 5,
  },
  {
    code: "FT-005",
    image: "FT-005-poleron-polo-gris.png",
    title: "Polerón Polo gris",
    price: 35000,
    brand: "Polo Ralph Lauren",
    size: "M",
    category: "TOP",
    description: "Hoodie gris, fit regular.",
  },
  {
    code: "FT-006",
    image: "FT-006-jogger-nike-celeste.png",
    title: "Jogger Nike celeste",
    price: 28000,
    brand: "Nike",
    size: "L",
    category: "BOTTOM",
    description: "Jogger cómodo, pretina elástica.",
  },
  {
    code: "FT-007",
    image: "FT-007-short-jordan-negro-rojo.png",
    title: "Short Jordan negro/rojo",
    price: 22000,
    brand: "Jordan",
    size: "M",
    category: "BOTTOM",
    description: "Short deportivo, tela dry-fit.",
    discountPercent: 10,
    discountDays: 3,
  },
  {
    code: "FT-008",
    image: "FT-008-pantalon-buzo-armani.png",
    title: "Pantalón buzo Emporio Armani",
    price: 40000,
    brand: "Emporio Armani",
    size: "L",
    category: "BOTTOM",
    description: "Buzo premium, estado casi nuevo.",
  },
  {
    code: "FT-009",
    image: "FT-009-gorra-negra-new-era.png",
    title: "Gorra negra New Era",
    price: 15000,
    brand: "New Era",
    size: "Única",
    category: "ACCESSORY",
    description: "Gorra ajustable, visera curva.",
  },
  {
    code: "FT-010",
    image: "FT-010-mochila-jordan-roja.png",
    title: "Mochila Jordan roja",
    price: 32000,
    brand: "Jordan",
    size: "Única",
    category: "ACCESSORY",
    description: "Mochila espaciosa, compartimento laptop.",
    discountPercent: 25,
    discountDays: 10,
  },
];

const IMAGE_BASE =
  process.env.SEED_IMAGE_BASE ??
  "https://raw.githubusercontent.com/Catussi/flightt.cl/master/scripts/seed-images";

async function imageUrl(filename) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token && !token.includes("SENSITIVE")) {
    return uploadImageToBlob(filename, token);
  }
  return `${IMAGE_BASE}/${filename}`;
}

async function uploadImageToBlob(filename, token) {
  const path = join(imagesDir, filename);
  if (!existsSync(path)) throw new Error(`Missing image: ${filename}`);
  const buf = readFileSync(path);
  const blob = await put(`products/seed/${filename}`, buf, {
    access: "public",
    token,
    contentType: "image/png",
  });
  return blob.url;
}

async function main() {
  const drop = await prisma.drop.upsert({
    where: { slug: "feria-caupolican" },
    create: {
      slug: "feria-caupolican",
      name: "Feria Caupolicán",
      location: "Feria Caupolicán, V Región",
      schedule: "Jueves y domingo",
      note: "Retiro en feria o envío Starken.",
      published: true,
      featured: true,
    },
    update: {
      published: true,
      featured: true,
    },
  });

  await prisma.drop.updateMany({
    where: { NOT: { id: drop.id } },
    data: { featured: false },
  });

  const existingCodes = new Set(
    (
      await prisma.product.findMany({
        where: { code: { in: PRODUCTS.map((p) => p.code) } },
        select: { code: true },
      })
    ).map((p) => p.code),
  );

  let created = 0;
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    if (existingCodes.has(p.code)) {
      console.log(`Skip ${p.code} (exists)`);
      continue;
    }

    const imageUrlValue = await imageUrl(p.image);
    const discountEndsAt =
      p.discountPercent != null
        ? new Date(Date.now() + p.discountDays * 24 * 60 * 60 * 1000)
        : null;

    await prisma.product.create({
      data: {
        code: p.code,
        title: p.title,
        price: p.price,
        brand: p.brand,
        size: p.size,
        description: p.description,
        category: p.category,
        images: JSON.stringify([imageUrlValue]),
        dropId: drop.id,
        sortOrder: (PRODUCTS.length - i) * 10,
        discountPercent: p.discountPercent ?? null,
        discountEndsAt,
      },
    });
    created += 1;
    console.log(`Created ${p.code} — ${p.title}`);
  }

  console.log(created > 0 ? `Done (${created} new). Drop: /d/${drop.slug}` : "Nothing new to create.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
