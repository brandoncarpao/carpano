import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const imageDir = path.join(root, "assets", "js");
const imageNames = (await fs.readdir(imageDir)).filter((name) => /\.jpe?g$/i.test(name));
let originalBytes = 0;
let optimizedBytes = 0;
let converted = 0;

for (const name of imageNames) {
  const inputPath = path.join(imageDir, name);
  const outputPath = path.join(imageDir, name.replace(/\.jpe?g$/i, ".webp"));
  const input = await fs.readFile(inputPath);
  originalBytes += input.byteLength;

  await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .modulate({ brightness: 1.01, saturation: 1.035 })
    .sharpen({ sigma: 0.55, m1: 0.6, m2: 1.0 })
    .webp({ quality: 81, effort: 5, smartSubsample: true })
    .toFile(outputPath);

  optimizedBytes += (await fs.stat(outputPath)).size;
  converted += 1;
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
  const after = before.replace(/(assets\/js\/[^"'?#]+)\.jpe?g/gi, "$1.webp");
  if (after !== before) {
    await fs.writeFile(file, after);
    htmlUpdated += 1;
  }
}

const saved = originalBytes - optimizedBytes;
const pct = originalBytes ? (saved / originalBytes) * 100 : 0;
console.log(JSON.stringify({
  convertedImages: converted,
  htmlFilesUpdated: htmlUpdated,
  originalMB: +(originalBytes / 1024 / 1024).toFixed(2),
  optimizedMB: +(optimizedBytes / 1024 / 1024).toFixed(2),
  savedMB: +(saved / 1024 / 1024).toFixed(2),
  savedPercent: +pct.toFixed(1)
}, null, 2));
