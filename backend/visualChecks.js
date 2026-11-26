/**
 * KAN-120 – Evaluating the visual output (Angela)
 *
 * Two automatic checks on what the player SEES:
 *
 * 1. checkCluesVisible()  – code check, no AI needed.
 *    Every clue location the puzzle points to must be an object the 3D room
 *    actually shows. A puzzle that points at something the player cannot see
 *    is unfair, even if the AI evaluator gives it a high score.
 *
 * 2. buildImageEvaluatorPrompt() + evaluateImage() – AI judge with vision.
 *    Scores a generated or chosen image (room backdrop, poster, ending art)
 *    against the team's style guide (STYLE_GUIDE in prompt.js).
 *    Run `npm run evaluate-images` to score every stage image.
 */

import fs from "fs";
import path from "path";
import { STAGES, STYLE_GUIDE, PASS_MARK, parseModelJSON } from "./prompt.js";

// ---------------------------------------------------------------------------
// 1. Clue visibility check
// ---------------------------------------------------------------------------

// The 3D room (public/room.html) places the room's first 5 objects on its
// props, plus the puzzle lock (the sealed cure cabinet) which is always there.
export const SCENE_SLOTS = 5;
const ALWAYS_VISIBLE = ["sealed cure cabinet", "cabinet", "keypad", "lock"];
const STOP = new Set(["the", "a", "an", "of", "on", "in", "at", "to", "and", "near", "behind", "under", "inside", "room", "wall", "floor"]);

const words = s => String(s ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));

function matches(clue, name) {
  const c = String(clue).toLowerCase(), n = String(name).toLowerCase();
  if (c.includes(n) || n.includes(c)) return true;
  const cw = new Set(words(clue));
  return words(name).some(w => cw.has(w) || [...cw].some(x => x.startsWith(w) || w.startsWith(x)));
}

export function checkCluesVisible(room, puzzle, { slots = SCENE_SLOTS } = {}) {
  const objects = (room?.objects || []).map(o => o.name);
  const visible = objects.slice(0, slots);
  const hidden = objects.slice(slots);
  const clues = puzzle?.clue_locations || [];
  const results = clues.map(clue => {
    const onVisible = visible.find(n => matches(clue, n)) || ALWAYS_VISIBLE.find(n => matches(clue, n));
    const onHidden = !onVisible && hidden.find(n => matches(clue, n));
    return { clue, object: onVisible || null, status: onVisible ? "visible" : onHidden ? "not placed in 3D room" : "no matching object" };
  });
  const missing = results.filter(r => r.status !== "visible");
  const pass = clues.length > 0 && missing.length === 0;
  return {
    pass,
    checked: clues.length,
    visible_objects: visible,
    results,
    reason: clues.length === 0
      ? "The puzzle lists no clue locations, so the player cannot know where to look."
      : pass ? "Every clue is on an object the player can see and click."
      : `${missing.length} clue(s) point at things the player cannot see: ${missing.map(m => `"${m.clue}" (${m.status})`).join(", ")}.`,
    fix: pass ? "" : `Only place clues on these visible objects: ${visible.join(", ")}.`,
  };
}

// ---------------------------------------------------------------------------
// 2. Image evaluator prompt (LLM-as-judge with vision)
// ---------------------------------------------------------------------------

export function buildImageEvaluatorPrompt({ stage, mood = "Tense", purpose = "room backdrop seen through the window", styleGuide = STYLE_GUIDE } = {}) {
  const stageData = STAGES[stage] || stage || {};
  const system = [
    "ROLE: You are a strict art director for a zombie-apocalypse escape-room game.",
    "You judge whether an image fits the game's agreed visual style before it is shown to players.",
    "Be sceptical: consistency with the style guide matters more than how impressive the image is.",
    "Return one valid JSON object only. Do not use markdown or code fences.",
  ].join("\n");

  const user = [
    "Evaluate the attached image.",
    `PURPOSE: ${purpose}`,
    `STAGE: ${stageData.place || "unknown"} – ${stageData.location || ""} (${stageData.title || ""})`,
    `MOOD SELECTED BY THE PLAYER: ${mood}`,
    `TEAM STYLE GUIDE: ${styleGuide}`,
    "",
    "Score each category from 1 to 5:",
    "- style_match: follows the style guide (medium, palette, lighting, framing).",
    "- mood: matches the selected mood and the tense zombie-outbreak tone.",
    "- stage_fit: clearly belongs to this stage's location and climate.",
    "- readability: works as a game background – not cluttered, the scene reads clearly at a glance.",
    "- clean: no text, logos, watermarks or recognisable real people; follows any 'no people / no zombies' rule in the style guide.",
    `PASS MARK: ${PASS_MARK}. Set pass to true only when every score is ${PASS_MARK} or higher.`,
    "In reason, name the main strength and the main problem. If it fails, give a concrete change to the image prompt in fix; otherwise fix is an empty string.",
    "",
    "JSON FORMAT (return exactly this structure):",
    JSON.stringify({ scores: { style_match: "number (1-5)", mood: "number (1-5)", stage_fit: "number (1-5)", readability: "number (1-5)", clean: "number (1-5)" }, pass: "boolean", reason: "string", fix: "string" }, null, 2),
  ].join("\n");

  return { system, user };
}

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

// Sends the image + prompt to a Gemini vision model. Uses a separate judge model if GEMINI_JUDGE_MODEL is set.
export async function evaluateImage(file, { stage, mood, purpose } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No GEMINI_API_KEY in backend/.env");
  const prompt = buildImageEvaluatorPrompt({ stage, mood, purpose });
  const data = fs.readFileSync(file).toString("base64");
  const mimeType = MIME[path.extname(file).toLowerCase()] || "image/jpeg";
  const models = [process.env.GEMINI_JUDGE_MODEL, process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-flash-lite-latest"].filter(Boolean);
  let lastErr;
  for (const model of [...new Set(models)]) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        signal: AbortSignal.timeout(120000),
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: prompt.system }] },
          contents: [{ role: "user", parts: [{ inline_data: { mime_type: mimeType, data } }, { text: prompt.user }] }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || `API error ${res.status}`);
      const text = json.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
      return { model, prompt, result: parseModelJSON(text) };
    } catch (err) {
      lastErr = err;
      console.warn(`  ${model} failed – ${err.message.slice(0, 100)}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}
