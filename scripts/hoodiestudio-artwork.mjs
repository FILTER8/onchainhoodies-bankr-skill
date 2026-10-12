import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const id = (value, label) => {
  if (!Number.isInteger(value) || value < 0 || value > 5999) throw new Error(`${label} must be an integer from 0 to 5999`);
  return value;
};
const bitmap = (value, bits, label) => {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]*|0x[0-9a-fA-F]+)$/.test(value)) throw new Error(`${label} must be a decimal or hex integer string`);
  const n = BigInt(value);
  if (n >= 1n << BigInt(bits)) throw new Error(`${label} exceeds ${bits} bits`);
  return n;
};
const text = (value, limit, label) => {
  if (typeof value !== "string" || !value.trim() || Buffer.byteLength(value, "utf8") > limit || [...Buffer.from(value)].some(b => b < 32)) throw new Error(`${label} must contain 1–${limit} UTF-8 bytes without control characters`);
  return value;
};

export function prepareArtwork(input) {
  const canvasId = id(input.canvasId, "canvasId"), custody = id(input.custodyHoodieId, "custodyHoodieId");
  const title = text(input.title, 64, "title"), artist = text(input.artistName, 48, "artistName");
  let low = bitmap(input.currentBitmapLow, 256, "currentBitmapLow"), high = bitmap(input.currentBitmapHigh, 144, "currentBitmapHigh");
  if (!Array.isArray(input.newPixels) || !input.newPixels.length) throw new Error("At least one new pixel is required; title-only publication is unavailable");
  const seen = new Set();
  for (const p of input.newPixels) {
    if (!Number.isInteger(p) || p < 0 || p > 399 || seen.has(p)) throw new Error("newPixels must contain unique integer indices 0–399");
    seen.add(p);
    const bit = 1n << BigInt(p < 256 ? p : p - 256);
    if ((p < 256 ? low : high) & bit) throw new Error(`Pixel ${p} is already permanent`);
    if (p < 256) low |= bit; else high |= bit;
  }
  if (!Array.isArray(input.allocations) || !input.allocations.length) throw new Error("Funding allocations are required");
  const bottles = new Set();
  let sum = 0;
  const allocations = input.allocations.map(a => {
    const bottleId = id(a.bottleId, "bottleId"), custodyHoodieId = id(a.custodyHoodieId, "bottle custodyHoodieId");
    if (bottles.has(bottleId)) throw new Error("Duplicate funding Bottle");
    bottles.add(bottleId);
    if (!Number.isInteger(a.amount) || a.amount < 1 || a.amount > 400) throw new Error("Each INK amount must be an integer from 1 to 400");
    sum += a.amount;
    return { bottleId, custodyHoodieId, amount: a.amount };
  });
  if (sum !== seen.size) throw new Error("Allocated INK must equal the number of new pixels");
  return {
    chainId: 4663, canvasId, custodyHoodieId: custody, title, artistName: artist,
    bitmapLow: low.toString(), bitmapHigh: high.toString(), addedPixels: seen.size, allocations,
    quotePublishArgs: [String(canvasId), low.toString(), high.toString()],
    publishOwnerPixelsArgs: [String(canvasId), String(custody), low.toString(), high.toString(), title, artist,
      allocations.map(a => String(a.bottleId)), allocations.map(a => String(a.custodyHoodieId)), allocations.map(a => a.amount)],
    requiresLiveChecks: ["chain and release", "controller and custody", "delegation", "Bottle INK", "artist reservation", "quote and OCH allowance", "outer execute simulation"],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error("Usage: node scripts/artwork.mjs /absolute/path/to/artwork.json");
    console.log(JSON.stringify(prepareArtwork(JSON.parse(await readFile(process.argv[2], "utf8"))), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
