// Builds web/src/data/pincodes.json (pincode → [city, state]) for the Gold Member form's pincode auto-fill (D-133)
// from India Post's official "All India Pincode Directory" CSV (data.gov.in). The CSV lives in the project resource
// folder (read-only); only this compact derived table is committed. Log the CSV's sha256 in docs/logs/RESOURCES_LOG.md.
//
// Usage:  node scripts/build-pincodes.mjs "<path to the India Post CSV>" [output.json]
// Columns used (by header name, any order): pincode, district, statename. City = the district, title-cased.
// States kept: Karnataka, Maharashtra, Goa (the resort's region). A pincode with offices in several districts takes
// the district most of its offices are in.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KEEP = { KARNATAKA: "Karnataka", MAHARASHTRA: "Maharashtra", GOA: "Goa" };

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/build-pincodes.mjs "<India Post CSV>"');
  process.exit(1);
}
const raw = readFileSync(src);
const text = raw.toString("utf8").replace(/^﻿/, "");

/** Minimal RFC 4180 line splitter (quoted fields may contain commas and doubled quotes). */
function fields(line) {
  const out = [];
  let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((f) => f.trim());
}

const titleCase = (s) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

const lines = text.split(/\r?\n/).filter((l) => l.trim());
const header = fields(lines[0]).map((h) => h.toLowerCase());
const col = (name) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`Column "${name}" not found; header is: ${header.join(", ")}`);
  return i;
};
const [iPin, iDistrict, iState] = [col("pincode"), col("district"), col("statename")];

const votes = new Map();   // pincode -> Map("City|State" -> count)
for (const line of lines.slice(1)) {
  const f = fields(line);
  const state = KEEP[(f[iState] ?? "").toUpperCase()];
  const pin = f[iPin];
  if (!state || !/^[1-9]\d{5}$/.test(pin ?? "") || !f[iDistrict]) continue;
  const key = `${titleCase(f[iDistrict])}|${state}`;
  const m = votes.get(pin) ?? new Map();
  m.set(key, (m.get(key) ?? 0) + 1);
  votes.set(pin, m);
}

const table = {};
for (const pin of [...votes.keys()].sort()) {
  const [best] = [...votes.get(pin).entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  table[pin] = best[0].split("|");
}

const out = process.argv[3] ?? join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "pincodes.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(table) + "\n");
console.log(`${Object.keys(table).length} pincodes written to ${out}`);
console.log(`source sha256 ${createHash("sha256").update(raw).digest("hex")}`);
