import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const imageDir = path.join(root, "assets", "js");
const entries = await fs.readdir(imageDir);
const webpNames = entries.filter((name) => /\.webp$/i.test(name));
const pngNames = entries.filter((name) => /\.png$/i.test(name));
const names = [...new Set([...webpNames, ...pngNames.map((name) => name.replace(/\.png$/i, ".webp"))])];

let inputBytes = 0;
let outputBytes = 0;
let converted = 0;
let replacedPngs = 0;

for (const webpName of names) {
  const base = webpName.replace(/\.webp$/i, "");
  const pngName = `${base}.png`;
  const hasPng = pngNames.includes(pngName);
  const inputName = hasPng ? pngName : webpName;
  const inputPath = path.join(imageDir, inputName);
  const outputPath = path.join(imageDir, webpName);
  const input = await fs.readFile(inputPath);
  inputBytes += input.byteLength;

  await sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: 1200,
      height: 1500,
      fit: "contain",
      position: "centre",
      background: { r: 240, g: 235, b: 227, alpha: 1 },
      withoutEnlargement: true
    })
    .toColourspace("srgb")
    .modulate({ brightness: 1.01, saturation: 1.035 })
    .sharpen({ sigma: 0.55, m1: 0.6, m2: 1.0 })
    .webp({ quality: 81, effort: 5, smartSubsample: true })
    .toFile(outputPath);

  const metadata = await sharp(outputPath).metadata();
  if (metadata.width !== 1200 || metadata.height !== 1500) {
    throw new Error(`Unexpected dimensions for ${webpName}: ${metadata.width}x${metadata.height}`);
  }
  outputBytes += (await fs.stat(outputPath)).size;
  converted += 1;

  if (hasPng) {
    await fs.unlink(inputPath);
    replacedPngs += 1;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

const htmlFiles = await walk(root);
let htmlUpdated = 0;
for (const file of htmlFiles) {
  const before = await fs.readFile(file, "utf8");
  let after = before.replace(/(assets\/js\/[^"'?#]+)\.jpe?g/gi, "$1.webp");
  after = after.replace(/width="600"\s+height="600"/g, 'width="600" height="750"');
  if (!after.includes("aspect-ratio:4/5")) {
    after = after.replace("</head>", '<style> .product-img,.product-card img,.photo img,.photo-frame img{aspect-ratio:4/5;object-fit:contain} </style>\\n</head>');
  }
  if (after !== before) {
    await fs.writeFile(file, after);
    htmlUpdated += 1;
  }
}

const saved = inputBytes - outputBytes;
const pct = inputBytes ? (saved / inputBytes) * 100 : 0;
console.log(JSON.stringify({
  convertedImages: converted,
  replacedAndRemovedPngs: replacedPngs,
  htmlFilesUpdated: htmlUpdated,
  inputMB: +(inputBytes / 1024 / 1024).toFixed(2),
  optimizedMB: +(outputBytes / 1024 / 1024).toFixed(2),
  savedMB: +(saved / 1024 / 1024).toFixed(2),
  savedPercent: +pct.toFixed(1),
  dimensions: "1200x1500 (4:5)"
}, null, 2));
