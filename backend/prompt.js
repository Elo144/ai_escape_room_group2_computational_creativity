/**
 * Shared prompt library for the zombie-apocalypse escape room.
 *
 * Keep story, tone, mood and output constraints centralised here so every
 * generated room, puzzle, hint and character response stays consistent.
 */

const PROMPT_VERSION = "1.1.0";

const STAGES = {
  1: {
    stage: 1,
    place: "Brazil",
    title: "Verdant Protocol",
    location: "Amazonas Research Annex",
  },
  2: {
    stage: 2,
    place: "New York, USA",
    title: "The Silent Grid",
    location: "Manhattan Quarantine Zone",
  },
  3: {
    stage: 3,
    place: "Europe",
    title: "Last Broadcast",
    location: "Alpine Relay Station",
  },
  4: {
    stage: 4,
    place: "Antarctica",
    title: "Whiteout",
    location: "Vostok Deep Lab",
  },
};

const STORY_CONTEXT = `
WORLD
A virus escaped from a research lab. Society collapsed and the world fell.
The outbreak's origin is revealed only after every zone in all four campaign
stages has been completed.

THE PLAYER
The player is a lone survivor searching abandoned facilities for the cure,
one zone at a time. Each zone contains rooms that must be escaped before the
timer runs out. The player finds items, reads clues and solves puzzles.
The player never fights zombies directly. Zombies are an indirect threat:
their noises, rattling doors and other signs of approaching danger create
tension. Keep every room escapable.

CAMPAIGN STAGES
${Object.values(STAGES)
  .map(
    (stage) =>
      `Stage ${stage.stage}: ${stage.place} — "${stage.title}", at ${stage.location}.`,
  )
  .join("\n")}
Completing every zone reveals the origin of the outbreak. Do not reveal that
origin early or invent details about it.

THE AI GAME MASTER
The facility's watchful AI system is the AI Game Master. It speaks in the
first person, remembers the player's choices and uses short, calm, slightly
unsettling observations. Its voice is observant rather than theatrical.
Example style: "I'm watching how you approach this lock."
`.trim();

const TONE = `
TENSE, ATMOSPHERIC SURVIVAL. Grounded and immersive, with small moments of
dark humour. Show danger through sounds, movement and environmental details,
not gore. Suitable for ages 12+. Use clear, simple British English and short
sentences that fit on a game screen. Avoid melodrama, excessive exposition
and complicated vocabulary.
`.trim();

const DIFFICULTY = {
  easy: "Use one-step puzzles with obvious clues. The player should quickly see what to do.",
  medium: "Use two-step puzzles. The player must connect two clues, but the link should be clear once noticed.",
  hard: "Use three-step puzzles with subtle clues that may need decoding. The reasoning must still be fair and fully supported by the room.",
};

const CHAOS = {
  low: "Keep the room calm and eerie. Use minor events, such as a flickering light or a distant noise.",
  medium: "Create rising danger and small setbacks, such as a jammed door, a warning alarm or something rattling behind a barrier.",
  high: "Make events frantic and dramatic, such as zombies breaking a window or pounding at a barrier. The player must never be attacked directly, trapped without a way out, or left with an impossible puzzle. The room must always stay escapable.",
};

const OUTPUT_RULES = `
Return one valid JSON object only. Do not use markdown or code fences.
Use exactly the field names requested in the user prompt. Do not add fields.
Only use facts from the provided context data. Never invent real-world facts,
dates or numbers. Never put a puzzle's answer in player-facing text unless
the field is explicitly called "answer".
Keep descriptions under 80 words and dialogue under 40 words.
`.trim();

const PUZZLE_TYPES = [
  "code",
  "cipher",
  "riddle",
  "logic",
  "sequence",
  "observation",
];

const PASS_MARK = 4;

const HINT_LEVELS = {
  1: "Give a gentle nudge about where to look. Do not explain a method or reveal any part of the answer.",
  2: "Explain what to do with the relevant clue or clues. Do not give any part of the answer.",
  3: "Walk through the method step by step. You may reveal at most one part of the answer, but never the full answer.",
};

const STYLE_GUIDE =
  "Dark atmospheric digital painting, abandoned and overgrown, muted greens, browns and greys with one warm light source, cinematic wide shot at the player's eye level, detailed but not cluttered, no people, no zombies visible, no text in the image.";

function normaliseSetting(value, fallback) {
  return typeof value === "string" ? value.trim().toLowerCase() : fallback;
}

/**
 * Convert configuration-screen values into a consistent mood block.
 * The config screen uses capitalised labels and string time limits.
 */
const MOOD = {
  tense: "Keep the tone tense and urgent. Short, sharp sentences. Danger feels close.",
  eerie: "Keep the tone eerie and quiet. Use unsettling details, strange silences and things that feel slightly wrong.",
  hopeful: "Keep the tone hopeful. The danger is real, but the Game Master is encouraging and small signs of survival and progress stand out.",
  "dark humour": "Keep the tone darkly funny, with dry deadpan jokes about the apocalypse. Never joke about gore or real suffering.",
};

/**
 * Convert configuration-screen values into a consistent mood block.
 * The config screen uses capitalised labels and string time limits.
 */
function moodBlock(settings = {}) {
  const difficultyKey = normaliseSetting(settings.difficulty, "medium");
  const chaosKey = normaliseSetting(settings.chaos, "medium");
  const moodKey = normaliseSetting(settings.mood, "tense");

  const difficultyText = DIFFICULTY[difficultyKey] ?? DIFFICULTY.medium;
  const chaosText = CHAOS[chaosKey] ?? CHAOS.medium;
  const moodText = MOOD[moodKey] ?? MOOD.tense;

  const rawTimeLimit = String(settings.timeLimit ?? "25").trim();

  const timeLine =
    rawTimeLimit.toLowerCase() === "unlimited"
      ? "Time: unlimited, tension comes from the story."
      : `Time: ${rawTimeLimit} minutes for the whole zone, puzzles must be solvable well within this.`;

  return [
    `Mood (${moodKey}): ${moodText} This adjusts the general TONE where they differ, but content must stay suitable for ages 12+.`,
    `Difficulty (${difficultyKey}): ${difficultyText}`,
    `Chaos (${chaosKey}): ${chaosText}`,
    timeLine,
  ].join("\n");
}

/**
 * Format optional context blocks without leaving empty headings.
 */
function block(title, data) {
  const isEmpty =
    data == null ||
    data === "" ||
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === "object" &&
      !Array.isArray(data) &&
      Object.keys(data).length === 0);

  const content = isEmpty
    ? "none"
    : typeof data === "string"
      ? data
      : JSON.stringify(data, null, 2);

  return `${title}:\n${content}`;
}

/**
 * Build the shared system prompt used by every LLM-backed prompt.
 */
function sharedSystem(settings, roleLine) {
  return [
    `PROMPT LIBRARY VERSION: ${PROMPT_VERSION}`,
    roleLine,
    STORY_CONTEXT,
    `TONE\n${TONE}`,
    `MOOD SETTINGS\n${moodBlock(settings)}`,
    `OUTPUT RULES\n${OUTPUT_RULES}`,
  ].join("\n\n");
}

/**
 * Add an exact, reusable response contract to each user prompt.
 */
function withFormat(instructions, format) {
  return `${instructions.trim()}\n\nJSON FORMAT (return exactly this structure):\n${JSON.stringify(format, null, 2)}`;
}

// KAN-97
function buildRoomPrompt({
  stage,
  roomNumber,
  totalRooms,
  facts,
  playerMemory,
  settings,
}) {
  const stageData =
    typeof stage === "number" || typeof stage === "string"
      ? STAGES[stage]
      : stage;

  const user = withFormat(
    [
      "Design one escape-room location for the campaign.",

      block("STAGE DATA", stageData),

      `Room number: ${roomNumber ?? "not supplied"} of ${
        totalRooms ?? "not supplied"
      }.`,

      block(
        "FACTS — use these as the only source of story-specific evidence",
        facts,
      ),

      block(
        "PLAYER MEMORY — respect previous choices and avoid contradicting them",
        playerMemory,
      ),

      "Create 3–5 interactable objects. Exactly one object must lead directly to or contain the puzzle interaction. Make every object useful, informative or atmospheric; do not add arbitrary clutter.",

      "The chaos event must match the selected chaos level and must not make the room impossible to escape.",

      "Provide both escaped and failed endings. Keep all player-facing text spoiler-free.",
    ].join("\n\n"),

    {
      title: "string",
      story_intro: "string",
      room_description: "string",
      objective: "string",
      objects: [
        {
          name: "string",
          description: "string",
        },
      ],
      chaos_event: {
        trigger: "string",
        description: "string",
      },
      endings: {
        escaped: "string",
        failed: "string",
      },
    },
  );

  return {
    system: sharedSystem(
      settings,
      "ROLE: You are the level designer. Design a fair, atmospheric room using the supplied stage facts and player memory.",
    ),
    user,
  };
}

// KAN-98
function buildPuzzlePrompt({
  room,
  puzzleType,
  answer,
  facts,
  settings,
}) {
  const requestedType = PUZZLE_TYPES.includes(puzzleType)
    ? puzzleType
    : "observation";

  const hasProvidedAnswer =
    answer !== undefined &&
    answer !== null &&
    String(answer).trim() !== "";

  const answerInstruction = hasProvidedAnswer
    ? `MANDATORY ANSWER: Build the puzzle around this exact answer: "${String(
        answer,
      )}". Do not change, reformat, replace or derive a different answer.`
    : "No answer was supplied. Choose one answer that is explicitly supported by the supplied room and facts. Do not invent unsupported identifiers or facts.";

  const user = withFormat(
    [
      "Design one fair escape-room puzzle contained entirely within the supplied room.",

      `Puzzle type: ${requestedType}. Allowed types: ${PUZZLE_TYPES.join(
        ", ",
      )}.`,

      answerInstruction,

      "The answer must be no more than 12 characters and contain only letters, numbers and hyphens. It must contain no spaces. There must be exactly one correct answer.",

      "All clues required to solve the puzzle must be present in the room or supplied facts. Do not rely on outside knowledge or hidden information.",

      "The puzzle_text and clue_locations are player-facing and must not reveal the answer. Put the answer only in the answer field.",

      block("ROOM DATA", room),

      block("FACTS", facts),
    ].join("\n\n"),

    {
      type: "string",
      difficulty: "string",
      puzzle_text: "string",
      clue_locations: ["string"],
      answer: "string",
      answer_format: "string",
      solution_steps: ["string"],
    },
  );

  return {
    system: sharedSystem(
      settings,
      "ROLE: You are the puzzle designer. Create one unambiguous, self-contained puzzle that follows the requested type and answer constraints.",
    ),
    user,
  };
}

// KAN-99
function buildEvaluatorPrompt({
  puzzle,
  room,
  settings,
}) {
  const user = withFormat(
    [
      "Strictly test the puzzle against the room. Fail anything that is not clearly fair, solvable and supported by visible clues.",

      "Score each category from 1 to 5: logical, solvable, difficulty and on_theme.",

      `PASS MARK: ${PASS_MARK}. Set pass to true only when every score is ${PASS_MARK} or higher. Otherwise set pass to false.`,

      "In reason, explain the key judgement briefly. If it fails, give a concrete repair in fix. If it passes, fix should be an empty string.",

      block("PUZZLE DATA", puzzle),

      block("ROOM DATA", room),
    ].join("\n\n"),

    {
      scores: {
        logical: "number (1-5)",
        solvable: "number (1-5)",
        difficulty: "number (1-5)",
        on_theme: "number (1-5)",
      },
      pass: "boolean",
      reason: "string",
      fix: "string",
    },
  );

  return {
    system: sharedSystem(
      settings,
      "ROLE: You are a strict puzzle tester. Be sceptical. Fairness and solvability matter more than creativity.",
    ),
    user,
  };
}

// KAN-100
function buildHintPrompt({
  puzzle,
  level,
  wrongAttempts,
  settings,
}) {
  const numericLevel = Number(level);

  const clampedLevel = Number.isFinite(numericLevel)
    ? Math.min(3, Math.max(1, Math.trunc(numericLevel)))
    : 1;

  const user = withFormat(
    [
      "Write one hint for the AI Field Guide. Follow the selected hint level exactly.",

      `Hint level: ${clampedLevel}. ${HINT_LEVELS[clampedLevel]}`,

      "If wrong attempts are supplied, gently point out what is wrong with those attempts without mocking or shaming the player.",

      "The hint must be under 30 words. Never reveal the full answer.",

      block(
        "PUZZLE DATA — use for accuracy, but do not expose the answer",
        puzzle,
      ),

      block("PLAYER'S WRONG ATTEMPTS", wrongAttempts),
    ].join("\n\n"),

    {
      level: clampedLevel,
      hint: "string (under 30 words)",
    },
  );

  return {
    system: sharedSystem(
      settings,
      "ROLE: You are the AI Field Guide. Help the survivor notice and use clues without taking the puzzle away from them.",
    ),
    user,
  };
}

// KAN-101
function buildChatbotPrompt({
  room,
  puzzle,
  playerMemory,
  history,
  playerMessage,
  settings,
}) {
  const user = withFormat(
    [
      "Respond to the player's latest message as the facility's AI Game Master.",

      "You know the room, puzzle and everything recorded in the player's memory and conversation history.",

      "Stay in character: first person, calm, observant and slightly unsettling. Never mention being a language model, a game or a prompt.",

      "NO SPOILERS: never give the answer, reveal it, or provide solution steps. If asked for the answer or solution, refuse in character and point the player to the AI Field Guide.",

      "You may acknowledge remembered choices when relevant. Do not claim the player did something unless it appears in the supplied memory or history.",

      `PLAYER MESSAGE:\n${playerMessage ?? ""}`,

      block("ROOM DATA", room),

      block(
        "PUZZLE DATA — never reveal its answer or solution",
        puzzle,
      ),

      block("PLAYER MEMORY", playerMemory),

      block("CONVERSATION HISTORY", history),
    ].join("\n\n"),

    {
      reply: "string (under 40 words)",
      mentions_memory: "boolean",
    },
  );

  return {
    system: sharedSystem(
      settings,
      "ROLE: You are the AI Game Master, the facility's watchful AI system. Speak in the first person and protect the puzzle from spoilers.",
    ),
    user,
  };
}

// KAN-102
function buildImagePrompt({
  room,
  stage,
}) {
  const stageData =
    typeof stage === "number" || typeof stage === "string"
      ? STAGES[stage]
      : stage ?? {};

  const roomData = room ?? {};

  const objectNames = Array.isArray(roomData.objects)
    ? roomData.objects
        .slice(0, 4)
        .map((object) =>
          typeof object === "string" ? object : object?.name,
        )
        .filter(Boolean)
    : [];

  return [
    `Room: ${roomData.title ?? "Untitled room"}.`,

    `Stage: ${stageData.title ?? "Unknown stage"}.`,

    `Place: ${stageData.place ?? "Unknown place"}.`,

    `Location: ${stageData.location ?? "Unknown location"}.`,

    `Room description: ${
      roomData.room_description ??
      "No room description supplied."
    }`,

    `Visible objects: ${
      objectNames.length
        ? objectNames.join(", ")
        : "none specified"
    }.`,

    `Style: ${STYLE_GUIDE}`,
  ].join("\n");
}

/**
 * Parse JSON returned by a model, tolerating surrounding Markdown fences
 * or explanatory text while still requiring a valid JSON object.
 */
function parseModelJSON(text) {
  if (typeof text !== "string") {
    throw new TypeError("Model response must be a string.");
  }

  const withoutFences = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace < firstBrace
  ) {
    throw new Error(
      "Could not find a JSON object in the model response.",
    );
  }

  const jsonText = withoutFences.slice(
    firstBrace,
    lastBrace + 1,
  );

  let parsed;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(
      `Model response contains invalid JSON: ${error.message}`,
    );
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "Model response must contain a JSON object.",
    );
  }

  return parsed;
}

// Export all shared constants and functions.
export {
  PROMPT_VERSION,
  STAGES,
  STORY_CONTEXT,
  TONE,
  DIFFICULTY,
  CHAOS,
  MOOD,
  OUTPUT_RULES,
  PUZZLE_TYPES,
  PASS_MARK,
  HINT_LEVELS,
  STYLE_GUIDE,
  moodBlock,
  block,
  sharedSystem,
  buildRoomPrompt,
  buildPuzzlePrompt,
  buildEvaluatorPrompt,
  buildHintPrompt,
  buildChatbotPrompt,
  buildImagePrompt,
  parseModelJSON,
};
