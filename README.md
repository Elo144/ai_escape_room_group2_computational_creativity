# AI Escape Room

A high-fidelity, single-player zombie-apocalypse escape game prototype built for a university software project.

The experience includes:

- A cinematic landing page and four-stage campaign archive
- Game configuration for difficulty, time limit, and chaos level
- An interactive South America research-station escape scenario
- Adaptive Game Master responses that remember incorrect attempts
- Survival-log clues, story recaps, hints, and dynamic system memory
- Escaped and failed result screens with game statistics and ratings

## Tech stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4

## Run locally

Install [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/), then run:

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite.

## Production build

```bash
pnpm build
```

The production files will be generated in `dist/`.

## Project structure

```text
public/          Images and favicon
src/App.tsx      Main application and game logic
src/index.css    Complete visual styling
src/main.tsx     React entry point
index.html       Vite HTML shell
```

## Gameplay

Configure the simulation, inspect the terminal and Survival Log, then enter the access code before time runs out.
