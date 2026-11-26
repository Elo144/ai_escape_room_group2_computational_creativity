/**
 * KAN-120 – Score the game's images against the style guide with the AI image evaluator.
 *
 *   npm run evaluate-images            score every stage image, save results in outputs/
 *   npm run evaluate-images -- --print print the evaluator prompt only (evidence for the report)
 *   npm run evaluate-images -- --only brazil   score just one image
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildImageEvaluatorPrompt, evaluateImage } from "./visualChecks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");

// The backdrops the 3D room uses for each stage (see LOOKS in public/room.html)
const IMAGES = [
  { file: "stage-brazil.jpg", stage: 1 },
  { file: "img/nyc-sunset.jpg", stage: 2 },
  { file: "stage-new-york.jpg", stage: 2 },
  { file: "stage-europe.jpg", stage: 3 },
  { file: "stage-antarctica.jpg", stage: 4 },
];

if (process.argv.includes("--print")) {
  const p = buildImageEvaluatorPrompt({ stage: 2, mood: "Tense" });
  console.log("=== SYSTEM ===\n" + p.system + "\n\n=== USER ===\n" + p.user);
  process.exit(0);
}

const mood = process.env.MOOD || "Tense";
// --only brazil  → evaluate just the images whose file name contains "brazil"
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1]?.toLowerCase() : null;
const todo = IMAGES.filter(img => !only || img.file.toLowerCase().includes(only));

// Scores sometimes come back as text ("2"): store them as numbers for the charts
function clean(result) {
  const scores = Object.fromEntries(Object.entries(result.scores || {}).map(([k, v]) => [k, Number(v)]));
  return { ...result, scores, pass: result.pass === true || result.pass === "true" };
}

async function run(img) {
  const file = path.join(PUBLIC, img.file);
  if (!fs.existsSync(file)) { console.warn(`skip ${img.file} (not found)`); return null; }
  console.log(`Evaluating ${img.file} (stage ${img.stage}, mood ${mood})…`);
  try {
    const { model, result } = await evaluateImage(file, { stage: img.stage, mood });
    const r = clean(result);
    console.log(`  ${r.pass ? "PASS" : "FAIL"} ${JSON.stringify(r.scores)} – ${r.reason}`);
    return { image: img.file, stage: img.stage, mood, model, ...r };
  } catch (err) {
    console.log(`  ERROR ${err.message}`);
    return { image: img.file, stage: img.stage, mood, error: err.message };
  }
}

const rows = [];
for (const img of todo) { const r = await run(img); if (r) rows.push(r); }

// Retry anything that errored (usually "high demand"), once, after a short wait
const failed = rows.filter(r => r.error);
if (failed.length) {
  console.log(`\nRetrying ${failed.length} image(s) that errored, in 15 seconds…`);
  await new Promise(r => setTimeout(r, 15000));
  for (const f of failed) {
    const r = await run(IMAGES.find(i => i.file === f.image));
    if (r && !r.error) rows[rows.indexOf(f)] = r;
  }
}

const out = path.join(__dirname, "outputs", `image_eval_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ prompt: buildImageEvaluatorPrompt({ stage: 2, mood }), results: rows }, null, 2));
const passed = rows.filter(r => r.pass).length, errors = rows.filter(r => r.error).length;
console.log(`\n${passed}/${rows.length} images passed${errors ? `, ${errors} could not be evaluated (AI busy – run again later)` : ""}. Saved ${path.relative(path.join(__dirname, ".."), out)}`);
