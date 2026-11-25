// AI server for the escape room (KAN-85 / KAN-76).
// Connects the front end to the LLM using Gori's shared prompt library (prompt.js, KAN-96):
//   room prompt -> puzzle prompt -> evaluator check (regenerate if it fails) -> game
// plus the hint prompt (3 levels) and the AI Game Master chat prompt.
// Every prompt and model reply is saved in outputs/ as evidence for the weekly reports.
//
// Run:  cd backend && npm install && npm start      (needs GEMINI_API_KEY in backend/.env)

import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import {
  STAGES,
  PUZZLE_TYPES,
  buildRoomPrompt,
  buildPuzzlePrompt,
  buildEvaluatorPrompt,
  buildHintPrompt,
  buildChatbotPrompt,
  parseModelJSON,
} from "./prompt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-flash-latest,gemini-3.8-flash-lite,gemini-flash-lite-latest")
  .split(",").map(m => m.trim()).filter(Boolean);
const PORT = process.env.PORT || 8787;
const OUTPUT_DIR = path.join(__dirname, "outputs");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- LLM call (Gemini) with retry + backup models ----------
async function callModel(model, { system, user }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(120000),
    headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.9, responseMimeType: "application/json" },
    }),
  });
  const data = await res.json();
  console.log(`  ${model}: ${res.status} after ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (!res.ok) throw new Error(data.error?.message || `API error ${res.status}`);
  return data.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
}

// Backup provider when every Gemini model is busy: pollinations.ai (free, no key; suggested in the module brief).
// Set BACKUP_PROVIDER=none in .env to turn it off.
const BACKUP = (process.env.BACKUP_PROVIDER || "pollinations").toLowerCase();
async function callPollinations({ system, user }) {
  const t0 = Date.now();
  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    signal: AbortSignal.timeout(120000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.POLLINATIONS_MODEL || "openai",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  const text = await res.text();
  console.log(`  pollinations: ${res.status} after ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (!res.ok) throw new Error(`pollinations error ${res.status}: ${text.slice(0, 120)}`);
  try { return JSON.parse(text).choices?.[0]?.message?.content ?? text; } catch { return text; }
}

async function askJSON(prompt, label) {
  // main model three times (with growing waits, for "high demand" spikes), then the backup Gemini models
  const models = [MODEL, MODEL, MODEL, ...FALLBACK_MODELS.filter(m => m !== MODEL)];
  let lastErr;
  for (let i = 0; i < models.length; i++) {
    try {
      const text = await callModel(models[i], prompt);
      return { json: parseModelJSON(text), raw: text, model: models[i] };
    } catch (err) {
      lastErr = err;
      console.warn(`  ${label}: ${models[i]} failed – ${err.message.slice(0, 120)}`);
      if (i < models.length - 1) await sleep(i < 2 ? 3000 * (i + 1) : 1500);
    }
  }
  if (BACKUP === "pollinations") {
    try {
      console.warn(`  ${label}: all Gemini models busy – trying the backup (pollinations.ai)`);
      const text = await callPollinations(prompt);
      return { json: parseModelJSON(text), raw: text, model: "pollinations" };
    } catch (err) {
      console.warn(`  ${label}: backup failed – ${err.message.slice(0, 120)}`);
    }
  }
  throw lastErr;
}

// ---------- Sessions (one per generated room; keeps the answer on the server) ----------
const sessions = new Map();
const publicPuzzle = p => ({ type: p.type, difficulty: p.difficulty, puzzle_text: p.puzzle_text, clue_locations: p.clue_locations, answer_format: p.answer_format });
const normalise = s => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function save(name, record) {
  const file = `${name}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(path.join(OUTPUT_DIR, file), JSON.stringify(record, null, 2));
  return file;
}

// ---------- POST /api/room : generate a room + evaluated puzzle ----------
app.post("/api/room", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "No GEMINI_API_KEY found. Add it to backend/.env and restart the server." });
  const stage = STAGES[req.body.stage] ? Number(req.body.stage) : 2;
  const settings = {
    difficulty: req.body.difficulty || "Medium",
    chaos: req.body.chaos || "Medium",
    timeLimit: req.body.timeLimit || "25",
    mood: req.body.mood || "Tense",
  };
  const facts = req.body.facts || [];
  const log = { settings, stage: STAGES[stage], steps: [] };
  console.log(`\nGenerating stage ${stage} (${STAGES[stage].place}) – ${settings.difficulty}/${settings.chaos}/${settings.timeLimit}`);

  try {
    // 1. Room (KAN-97)
    const roomPrompt = buildRoomPrompt({ stage, roomNumber: 1, totalRooms: 1, facts, playerMemory: [], settings });
    const roomRes = await askJSON(roomPrompt, "room");
    const room = roomRes.json;
    log.steps.push({ step: "room", model: roomRes.model, prompt: roomPrompt, output: room });
    console.log(`  room: "${room.title}" with ${room.objects?.length ?? 0} objects`);

    // 2. Puzzle (KAN-98) + 3. Evaluator (KAN-99): up to 3 attempts, feeding the evaluator's fix back in
    let puzzle, evaluation, feedback = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      const type = PUZZLE_TYPES[Math.floor(Math.random() * PUZZLE_TYPES.length)];
      const puzzlePrompt = buildPuzzlePrompt({ room, puzzleType: type, facts: [...facts, ...feedback], settings });
      const pRes = await askJSON(puzzlePrompt, "puzzle");
      puzzle = pRes.json;
      const evalPrompt = buildEvaluatorPrompt({ puzzle, room, settings });
      const eRes = await askJSON(evalPrompt, "evaluator");
      evaluation = eRes.json;
      log.steps.push({ step: `puzzle attempt ${attempt}`, model: pRes.model, prompt: puzzlePrompt, output: puzzle },
                     { step: `evaluator attempt ${attempt}`, model: eRes.model, prompt: evalPrompt, output: evaluation });
      console.log(`  puzzle ${attempt} (${type}): evaluator ${evaluation.pass ? "PASS" : "FAIL"} ${JSON.stringify(evaluation.scores)}`);
      if (evaluation.pass) break;
      feedback = [`Evaluator feedback on the previous puzzle (fix this): ${evaluation.fix || evaluation.reason}`];
    }

    const id = crypto.randomUUID();
    sessions.set(id, { room, puzzle, settings, wrong: [], history: [] });
    log.file = save("room", log);
    console.log(`  saved outputs/${log.file}`);
    res.json({ id, stage: STAGES[stage], room, puzzle: publicPuzzle(puzzle), evaluation, settings });
  } catch (err) {
    console.error("Generation failed:", err.message);
    res.status(502).json({ error: `The AI could not generate a room: ${err.message}` });
  }
});

// ---------- POST /api/check : check an answer on the server ----------
app.post("/api/check", (req, res) => {
  const s = sessions.get(req.body.id);
  if (!s) return res.status(404).json({ error: "Room not found. Generate a new room." });
  const correct = normalise(req.body.answer) === normalise(s.puzzle.answer);
  if (!correct && req.body.answer) s.wrong.push(String(req.body.answer));
  res.json({ correct, wrongAttempts: s.wrong.length });
});

// ---------- POST /api/hint : 3-level hints (KAN-100) ----------
app.post("/api/hint", async (req, res) => {
  const s = sessions.get(req.body.id);
  if (!s) return res.status(404).json({ error: "Room not found." });
  try {
    const prompt = buildHintPrompt({ puzzle: s.puzzle, level: req.body.level || 1, wrongAttempts: s.wrong, settings: s.settings });
    const { json } = await askJSON(prompt, "hint");
    save("hint", { level: req.body.level, prompt, output: json });
    res.json(json);
  } catch (err) { res.status(502).json({ error: err.message }); }
});

// ---------- POST /api/chat : AI Game Master (KAN-101) ----------
app.post("/api/chat", async (req, res) => {
  const s = sessions.get(req.body.id);
  if (!s) return res.status(404).json({ error: "Room not found." });
  try {
    const prompt = buildChatbotPrompt({ room: s.room, puzzle: s.puzzle, playerMemory: { wrongAttempts: s.wrong }, history: s.history.slice(-10), playerMessage: req.body.message, settings: s.settings });
    const { json } = await askJSON(prompt, "chat");
    s.history.push({ player: req.body.message, gameMaster: json.reply });
    save("chat", { prompt, output: json });
    res.json(json);
  } catch (err) { res.status(502).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`AI server running at http://localhost:${PORT}  (model: ${MODEL})`);
  if (!API_KEY) console.warn("Warning: GEMINI_API_KEY is not set in backend/.env");
});
