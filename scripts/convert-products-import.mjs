import { readFile, writeFile } from "node:fs/promises";

const sourcePath = process.argv[2];
const outputPath = process.argv[3];

if (!sourcePath || !outputPath) {
  throw new Error("Usage: node scripts/convert-products-import.mjs <source.tsv> <output.json>");
}

const source = (await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "").trim();
const products = parseRows(source)
  .filter((row) => row.some((value) => value.trim()))
  .map((row, index) => ({
    id: `product-${row[0] || index + 1}`,
    handle: row[0] || "",
    title: row[1] || "",
    description: row[2] || "",
    highlights: row[3] || "",
    sku: row[4] || "",
    seoTitle: row[5] || "",
    seoDescription: row[6] || "",
    colors: splitList(row[7]),
    materials: splitList(row[8]),
    sizes: splitList(row[9]),
    price: toPrice(row[10]),
    storefrontUrl: "",
    importedAt: new Date().toISOString(),
  }))
  .filter((product) => product.handle || product.title);

await writeFile(outputPath, `${JSON.stringify(products, null, 2)}\n`);
console.log(`Created ${products.length} products in ${outputPath}`);

function splitList(value = "") {
  return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
}

function toPrice(value = "") {
  const price = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(price) && price > 0 ? price : null;
}

function parseRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "\t" && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}
