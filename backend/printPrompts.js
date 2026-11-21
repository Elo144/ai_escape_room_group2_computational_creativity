/**
 * Example prompt printer.
 *
 * Run from the repository root with:
 *   node backend/printPrompts.js
 *
 * The script prints all six prompt outputs so they can be copied into an
 * LLM playground or used for manual prompt testing.
 */

import {
  STAGES,
  buildRoomPrompt,
  buildPuzzlePrompt,
  buildEvaluatorPrompt,
  buildHintPrompt,
  buildChatbotPrompt,
  buildImagePrompt,
} from "./prompt.js";

// --------------------------------------------------
// Shared example settings
// --------------------------------------------------

const settings = {
  difficulty: "Medium",
  chaos: "Medium",
  timeLimit: "25",
};

// Stage 1: Brazil
const stage = STAGES[1];

// --------------------------------------------------
// Example incident report facts
// --------------------------------------------------

const facts = [
  "Incident report ARA-0618-7: at 03:17 all containment doors in the lower annex locked.",
  "Dr. Varela reported a pressure fault after transfer from Biological Unit 7.",
  "Protocol labels contain no spaces.",
];

// --------------------------------------------------
// Example room
// --------------------------------------------------

const room = {
  title: "Bio-Containment Wing",

  room_description:
    "An overgrown research corridor in the Amazonas Research Annex. Vines trail over a sealed access terminal.",

  objects: [
    {
      name: "Access terminal B-07",
      description:
        "A sealed terminal with a small identifier display.",
    },
    {
      name: "Incident report",
      description:
        "A printed incident report, damp at the edges.",
    },
    {
      name: "Maintenance key",
      description:
        "A worn key on a hook beside the terminal.",
    },
  ],
};

// --------------------------------------------------
// Example player memory
// --------------------------------------------------

const playerMemory = [
  "The player inspected the access terminal.",
  "The player has not opened the maintenance panel.",
];

// --------------------------------------------------
// Example puzzle
// --------------------------------------------------

const puzzle = {
  type: "code",
  difficulty: "Medium",

  puzzle_text:
    "The terminal requests the protocol identifier linked to the pressure fault. Cross-reference the incident report with the terminal label.",

  clue_locations: [
    "Incident report: the transfer from Biological Unit 7.",
    "Access terminal: label B-07.",
    "Incident report: protocol labels contain no spaces.",
  ],

  answer: "BIO-7",

  answer_format:
    "Letters and a hyphen; no spaces.",

  solution_steps: [
    "Find the biological unit named in the incident report.",
    "Use the protocol-label convention and terminal context to identify the code.",
  ],
};

// --------------------------------------------------
// KAN-97: Room generation prompt
// --------------------------------------------------

const roomPrompt = buildRoomPrompt({
  stage,
  roomNumber: 1,
  totalRooms: 4,
  facts,
  playerMemory,
  settings,
});

// --------------------------------------------------
// KAN-98: Puzzle generation prompt
// --------------------------------------------------

const puzzlePrompt = buildPuzzlePrompt({
  room,
  puzzleType: "code",
  answer: "BIO-7",
  facts,
  settings,
});

// --------------------------------------------------
// KAN-99: Puzzle evaluation prompt
// --------------------------------------------------

const evaluatorPrompt = buildEvaluatorPrompt({
  puzzle,
  room,
  settings,
});

// --------------------------------------------------
// KAN-100: AI Field Guide hint prompt
// --------------------------------------------------

const hintPrompt = buildHintPrompt({
  puzzle,
  level: 2,
  wrongAttempts: ["BIO7", "UNIT7"],
  settings,
});

// --------------------------------------------------
// KAN-101: AI Game Master chatbot prompt
// --------------------------------------------------

const chatbotPrompt = buildChatbotPrompt({
  room,
  puzzle,
  playerMemory,

  history: [
    {
      role: "player",
      content: "I checked the report.",
    },
    {
      role: "assistant",
      content:
        "I saw you pause at the transfer note.",
    },
  ],

  playerMessage: "Just tell me the code!",

  settings,
});

// --------------------------------------------------
// KAN-102: Room image generation prompt
// --------------------------------------------------

const imagePrompt = buildImagePrompt({
  room,
  stage,
});

// --------------------------------------------------
// Print all six prompts
// --------------------------------------------------

const prompts = [
  ["KAN-97 ROOM PROMPT", roomPrompt],
  ["KAN-98 PUZZLE PROMPT", puzzlePrompt],
  ["KAN-99 EVALUATOR PROMPT", evaluatorPrompt],
  ["KAN-100 HINT PROMPT", hintPrompt],
  ["KAN-101 CHATBOT PROMPT", chatbotPrompt],
  ["KAN-102 IMAGE PROMPT (no LLM call)", imagePrompt],
];

// --------------------------------------------------
// Output
// --------------------------------------------------

for (const [title, prompt] of prompts) {
  console.log(
    `\n${"=".repeat(80)}\n${title}\n${"=".repeat(80)}`,
  );

  if (typeof prompt === "string") {
    // Image prompt is a plain text string.
    console.log(prompt);
  } else {
    // LLM prompts contain separate system and user messages.
    console.log("SYSTEM:\n");
    console.log(prompt.system);

    console.log("\nUSER:\n");
    console.log(prompt.user);
  }
}
