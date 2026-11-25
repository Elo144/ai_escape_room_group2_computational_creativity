import { FormEvent, ReactNode, useEffect, useState } from "react";
// FormEvent doesn't exist in the react folder?

type Screen = "landing" | "configure" | "game";
type Modal = "how" | "settings" | null;
type Feedback = "idle" | "correct" | "incorrect";
type Result = "escaped" | "failed" | null;

const stages = [
  {
    number: "STAGE 1",
    location: "Brazil",
    name: "Verdant Protocol",
    status: "UNLOCKED",
    detail: "Start here · Amazonas Research Annex",
    image: "/stage-brazil.jpg",
  },
  {
    number: "STAGE 2",
    location: "New York, USA",
    name: "The Silent Grid",
    status: "LOCKED",
    detail: "Manhattan Quarantine Zone",
    image: "/stage-new-york.jpg",
  },
  {
    number: "STAGE 3",
    location: "Europe",
    name: "Last Broadcast",
    status: "LOCKED",
    detail: "Alpine Relay Station",
    image: "/stage-europe.jpg",
  },
  {
    number: "STAGE 4",
    location: "Antarctica",
    name: "Whiteout",
    status: "LOCKED",
    detail: "Vostok Deep Lab",
    image: "/stage-antarctica.jpg",
  },
];

const hints = [
  "The terminal rejects words. Look for a short identifier hidden in the incident report.",
  "The contaminated samples came from the Bio-Containment wing. The number repeats twice in the log.",
  "Enter BIO-7. The hyphen matters in the original access protocol.",
];

function Icon({
  name,
  size = 20,
}: {
  name: "arrow" | "brain" | "check" | "clock" | "close" | "gear" | "lock" | "log" | "map" | "sound" | "star" | "warning";
  size?: number;
}) {
  const paths: Record<string, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    brain: (
      <>
        <path d="M9.5 4.5a3 3 0 0 0-5 2.2 3 3 0 0 0-1 5.6 3 3 0 0 0 2 5.3A3 3 0 0 0 11 16V8a3.5 3.5 0 0 0-1.5-3.5Z" />
        <path d="M14.5 4.5a3 3 0 0 1 5 2.2 3 3 0 0 1 1 5.6 3 3 0 0 1-2 5.3A3 3 0 0 1 13 16V8a3.5 3.5 0 0 1 1.5-3.5Z" />
        <path d="M6.5 9.5A3 3 0 0 0 11 8M17.5 9.5A3 3 0 0 1 13 8M8 14a3 3 0 0 0 3-1M16 14a3 3 0 0 1-3-1" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.56V21h-4v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.62.66 1.08 1.3 1.08H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
      </>
    ),
    log: (
      <>
        <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    sound: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" />
      </>
    ),
    star: <path d="m12 3 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 17.03l-5.5 2.89 1.05-6.12L3.1 9.47l6.15-.9L12 3Z" />,
    warning: (
      <>
        <path d="M12 3 2.8 20h18.4L12 3Z" />
        <path d="M12 9v5M12 17h.01" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <button className="brand" onClick={() => window.location.reload()} aria-label="Return to landing page">
      <span className="brand-mark">
        <span />
      </span>
      <span className="brand-type">
        <b>AI</b> ESCAPE ROOM
      </span>
      {!compact && <span className="brand-edition">SURVIVAL ARCHIVE / 2041</span>}
    </button>
  );
}

function Landing({
  onStart,
  onModal,
}: {
  onStart: () => void;
  onModal: (modal: Modal) => void;
}) {
  return (
    <main className="landing scene">
      <div className="scene-image" />
      <div className="scene-wash" />
      <nav className="topbar">
        <Brand />
        <div className="nav-actions">
          <button className="nav-button" onClick={() => onModal("how")}>
            How to play
          </button>
          <button className="icon-button" onClick={() => onModal("settings")} aria-label="Open settings">
            <Icon name="gear" />
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">
          <span className="pulse-dot" />
          Emergency simulation online
        </div>
        <h1>
          AI ESCAPE
          <span>ROOM</span>
        </h1>
        <p>The world has fallen. Your survival begins here.</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onStart}>
            <span>Start your survival</span>
            <Icon name="arrow" />
          </button>
          <button className="text-button" onClick={() => onModal("how")}>
            <span className="play-icon">?</span>
            How to play
          </button>
        </div>
        <div className="status-strip">
          <div>
            <span>01</span>
            <p>Survivor</p>
            <strong>Solo campaign</strong>
          </div>
          <div>
            <span>04</span>
            <p>Global zones</p>
            <strong>One way out</strong>
          </div>
          <div>
            <span>AI</span>
            <p>Adaptive system</p>
            <strong>It remembers</strong>
          </div>
        </div>
      </section>

      <section className="campaign">
        <div className="section-heading">
          <div>
            <span className="kicker">Survival route</span>
            <h2>CAMPAIGN ARCHIVE</h2>
          </div>
          <p>Complete each zone to reveal the origin of the outbreak.</p>
        </div>
        <div className="stage-grid">
          {stages.map((stage, index) => (
            <button
              className={`stage-card ${index === 0 ? "unlocked" : ""}`}
              key={stage.location}
              onClick={index === 0 ? onStart : undefined}
              disabled={index !== 0}
            >
              <div className="stage-top">
                <span>{stage.number}</span>
                <span className="stage-state">
                  {index === 0 ? <span className="pulse-dot" /> : <Icon name="lock" size={14} />}
                  {stage.status}
                </span>
              </div>
              <div className="stage-image">
                <img src={stage.image} alt={`${stage.location} campaign environment`} />
              </div>
              <div className="stage-content">
                <Icon name="map" size={22} />
                <p>{stage.location}</p>
                <strong>{stage.name}</strong>
                <small>{stage.detail}</small>
              </div>
              <div className="stage-line" />
            </button>
          ))}
        </div>
      </section>
      
      <footer>
        <span>© 2041 AER SYSTEMS</span>
        <span>Visual archive: Unsplash contributors</span>
        <span>CONNECTION SECURE</span>
      </footer>
    </main>
  );
}

  function Config({
  onBack,
  onBegin,
}: {
  onBack: () => void;
  onBegin: (difficulty: string, time: string, chaos: string, mood: string) => void;
}) {
  const [difficulty, setDifficulty] = useState("Medium");
  const [time, setTime] = useState("25");
  const [chaos, setChaos] = useState("Medium");
  const [mood, setMood] = useState("Tense");

  return (
    <main className="config-page scene">
      <div className="scene-image config-image" />
      <div className="scene-wash" />
      <nav className="topbar">
        <Brand />
        <button className="nav-button back-button" onClick={onBack}>
          ← Return to archive
        </button>
      </nav>
      <section className="config-shell">
        <div className="config-intro">
          <span className="kicker">Expedition 01 / Amazonas</span>
          <h1>PREPARE TO <em>SURVIVE</em></h1>
          <p>
            Calibrate the simulation. Every choice changes the station, the infected, and what the system remembers
            about you.
          </p>
          <div className="mission-note">
            <Icon name="warning" />
            <div>
              <span>Mission advisory</span>
              <p>Headphones recommended. Progress is saved at each completed objective.</p>
            </div>
          </div>
        </div>
        <div className="config-panel">
          <div className="config-panel-header">
            <div>
              <span>Simulation parameters</span>
              <strong>FIELD CONFIG / A-01</strong>
            </div>
            <span className="online">SYSTEM READY</span>
          </div>
          <ChoiceGroup
            number="01"
            title="Difficulty"
            subtitle="Changes puzzle complexity and hint depth"
            options={["Easy", "Medium", "Hard"]}
            value={difficulty}
            setValue={setDifficulty}
          />
          <ChoiceGroup
            number="02"
            title="Time limit"
            subtitle="Time remaining until facility breach"
            options={["20", "25", "30", "40", "Unlimited"]}
            labels={["20 min", "25 min", "30 min", "40 min", "No limit"]}
            value={time}
            setValue={setTime}
          />
          <ChoiceGroup
            number="03"
            title="Chaos level"
            subtitle="Controls environmental disruptions"
            options={["Low", "Medium", "High"]}
            value={chaos}
            setValue={setChaos}
          />
                    <ChoiceGroup
            number="04"
            title="Mood"
            subtitle="Sets the tone of the Game Master and the room"
            options={["Tense", "Eerie", "Hopeful", "Dark humour"]}
            value={mood}
            setValue={setMood}
          />
          <div className="config-summary">
            <div>
              <span>Estimated survival odds</span>
              <strong>{difficulty === "Hard" || chaos === "High" ? "32%" : difficulty === "Easy" ? "78%" : "61%"}</strong>
            </div>
            <button className="primary-button" onClick={() => onBegin(difficulty, time, chaos, mood)}>
              Enter the facility <Icon name="arrow" />
            </button>
            {/* KAN-85 / KAN-82: AI-generated 3D room (public/room.html, needs the AI server running) */}
            <a
              className="nav-button"
              href={`/room.html?stage=2&difficulty=${encodeURIComponent(difficulty)}&time=${encodeURIComponent(time)}&chaos=${encodeURIComponent(chaos)}&mood=${encodeURIComponent(mood)}`}
            >
              Play in 3D (AI) <Icon name="arrow" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function ChoiceGroup({
  number,
  title,
  subtitle,
  options,
  labels,
  value,
  setValue,
}: {
  number: string;
  title: string;
  subtitle: string;
  options: string[];
  labels?: string[];
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <div className="choice-group">
      <div className="choice-label">
        <span>{number}</span>
        <div>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
      </div>
      <div className={`choices ${options.length > 3 ? "five" : ""}`}>
        {options.map((option, index) => (
          <button className={value === option ? "selected" : ""} onClick={() => setValue(option)} key={option}>
            {labels?.[index] ?? option}
            {value === option && <Icon name="check" size={15} />}
          </button>
        ))}
      </div>
    </div>
  );
}

const moodTone: Record<string, { intro: string; denied: string }> = {
  Tense: {
    intro: "Every second counts. I'm watching how you handle the pressure.",
    denied: "That code is not recognized. Recheck the report's final instruction. Quickly.",
  },
  Eerie: {
    intro: "The annex is quiet. Too quiet. I'm listening to how you move through it.",
    denied: "The terminal hums and refuses. Something in the walls seems to disagree with you.",
  },
  Hopeful: {
    intro: "There's a way out of here, and I believe you can find it. I'll be right beside you.",
    denied: "Not quite, but you're closer than you think. Look at the report again.",
  },
  "Dark humour": {
    intro: "Welcome to the apocalypse. Try not to die before the tutorial ends.",
    denied: "Wrong. The zombies appreciate the extra thinking time, though.",
  },
};


 function Gameplay({
  onExit,
  onPlayAgain,
  onChangeSettings,
  duration,
  difficulty,
  chaos,
  mood,
}: {
  onExit: () => void;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
  duration: string;
  difficulty: string;
  chaos: string;
  mood: string;
}) {

  const initialSeconds = duration === "Unlimited" ? -1 : Number(duration) * 60;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [hintOpen, setHintOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [wrongCodes, setWrongCodes] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [objectiveComplete, setObjectiveComplete] = useState(false);
  const [memoryUpdated, setMemoryUpdated] = useState(false);
  const [memoryMessage, setMemoryMessage] = useState(
    `${moodTone[mood].intro} (${difficulty.toLowerCase()} puzzles, ${chaos.toLowerCase()} chaos)`,
  );
  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    if (result || objectiveComplete) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
      setSeconds((current) => (current > 0 ? current - 1 : current));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [objectiveComplete, result]);

  useEffect(() => {
    if (seconds === 0 && !result && !objectiveComplete) {
      setMemoryMessage("You stayed with the terminal until the breach. I’ll remember that persistence.");
      setMemoryUpdated(true);
      setResult("failed");
    }
  }, [objectiveComplete, result, seconds]);

  const formattedTime =
    seconds < 0
      ? "∞"
      : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const submitAnswer = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim()) return;
    const normalizedAnswer = answer.trim().toUpperCase().replace(/\s/g, "");
    const correct = normalizedAnswer === "BIO-7";
    setFeedback(correct ? "correct" : "incorrect");
    setMemoryUpdated(true);

    if (correct) {
      setObjectiveComplete(true);
      setMemoryMessage(
        hintsUsed > 0
          ? "You turned guidance into action. BIO-7 opened the route before the facility could adapt."
          : "You trusted the incident report and found BIO-7 without guidance. The system noticed.",
      );
      window.setTimeout(() => setResult("escaped"), 1100);
      return;
    }

    const failedCodes = [...wrongCodes, normalizedAnswer];
    const nextWrongAttempt = wrongAttempts + 1;
    setWrongAttempts((current) => current + 1);
    setWrongCodes(failedCodes);
    setMemoryMessage(
      nextWrongAttempt === 1
        ? `${normalizedAnswer} was rejected. Check the report again.`
        : nextWrongAttempt === 2
          ? failedCodes.every((code) => /^\d+$/.test(code))
            ? "That’s two failed codes. Both were numbers only, but the format needs letters."
            : `That’s two failed codes. ${failedCodes.join(" and ")} were both rejected—compare them with the required XXX-0 format.`
          : `Third miss. ${failedCodes.slice(-3).join(", ")} all failed. The Field Guide might help.`,
    );
  };

  const toggleHint = () => {
    if (!hintOpen && hintsUsed === 0) {
      setHintsUsed(1);
      setMemoryUpdated(true);
      setMemoryMessage("You opened the Field Guide after inspecting the report. I’ll tailor the next clue to that habit.");
    }
    setHintOpen(!hintOpen);
  };

  const revealClearerHint = () => {
    const nextLevel = Math.min(2, hintLevel + 1);
    if (nextLevel === hintLevel) return;
    setHintLevel(nextLevel);
    setHintsUsed((current) => Math.max(current, nextLevel + 1));
    setMemoryUpdated(true);
    setMemoryMessage(
      nextLevel === 2
        ? "You chose direct guidance. I’ll make the next challenge less literal."
        : "You asked me to narrow the search. Focus on the wing designation, not the incident ID.",
    );
  };

  const systemMemory = `You collected 3 items and preserved the flare. ${
    wrongAttempts > 0
      ? `The terminal rejected ${wrongAttempts} ${wrongAttempts === 1 ? "attempt" : "attempts"}. `
      : "You have not wasted an attempt. "
  }${
    hintsUsed > 0
      ? `You used ${hintsUsed} ${hintsUsed === 1 ? "hint" : "hints"} after reading the evidence.`
      : "You are solving without AI guidance."
  }`;

  const storySoFar = objectiveComplete
    ? "You entered through the silent service route, recovered Dr. Varela’s report, and restored access to B-07. Beyond the door, something is moving toward the specimen vault."
    : wrongAttempts > 0 || hintsUsed > 0
      ? "Inside the overgrown annex, you found a maintenance key and a quarantined report. The access terminal still blocks the only safe route forward."
      : "You slipped into the Amazonas annex through a service corridor, preserving your flare and recovering the final incident report from the abandoned security desk.";

  return (
    <main className="game-page" data-mood={mood}>
      <div className="game-scene" />
      <div className="game-overlay" />
      <nav className="game-nav">
        <Brand compact />
        <div className="game-location">
          <span>ZONE 01</span>
          <div>
            <strong>Amazonas Research Annex</strong>
            <small>Bio-Containment Wing / Level B</small>
          </div>
        </div>
        <div className="game-nav-actions">
          <button
            className={`log-button ${memoryUpdated ? "has-memory-update" : ""}`}
            onClick={() => {
              setLogOpen(true);
              setMemoryUpdated(false);
            }}
          >
            <Icon name="log" />
            <span>Survival log</span>
            <b>3</b>
            {memoryUpdated && <span className="memory-update-label">AI memory updated</span>}
          </button>
          <div className="timer">
            <Icon name="clock" />
            <div>
              <span>FACILITY BREACH IN</span>
              <strong>{formattedTime}</strong>
            </div>
          </div>
          <button className="icon-button" onClick={onExit} aria-label="Exit mission">
            <Icon name="close" />
          </button>
        </div>
      </nav>

      <div className="objective-bar">
        <div className="objective-index">
          <span>OBJECTIVE</span>
          <strong>02 / 06</strong>
        </div>
        <div className="objective-copy">
          <span className={objectiveComplete ? "complete-icon done" : "complete-icon"}>
            {objectiveComplete ? <Icon name="check" size={15} /> : "02"}
          </span>
          <div>
            <strong>{objectiveComplete ? "ACCESS PROTOCOL RESTORED" : "RESTORE LAB ACCESS PROTOCOL"}</strong>
            <p>
              {objectiveComplete
                ? "Door B-07 is unlocked. Your response pattern has been added to the survival model."
                : "Decode the incident report and identify the contaminated wing."}
            </p>
          </div>
        </div>
        <div className="objective-progress">
          <span style={{ width: objectiveComplete ? "50%" : "33%" }} />
        </div>
      </div>

      <section className="puzzle-area">
        <div className="evidence-card">
          <div className="file-tabs">
            <span className="active">INCIDENT REPORT</span>
            <span>ATTACHMENT 01</span>
            <small>RECOVERED 18.06.41</small>
          </div>
          <div className="paper">
            <div className="paper-header">
              <div className="seal">ARA</div>
              <div>
                <strong>AMAZONAS RESEARCH ANNEX</strong>
                <span>BIOLOGICAL SECURITY DIVISION</span>
              </div>
              <b>CLASSIFIED</b>
            </div>
            <p className="typewritten">INCIDENT ID: ARA-0618-7</p>
            <p>
              At 03:17, all containment doors in the lower annex entered automatic lockdown. Dr. Varela reported a
              pressure fault after transfer from <mark>Biological Unit 7</mark>.
            </p>
            <p>
              Manual access can be restored using the abbreviated wing designation followed by its containment
              number. All personnel are reminded: protocol labels contain no spaces.
            </p>
            <div className="redacted-lines">
              <span />
              <span />
              <span />
            </div>
            <div className="hand-note">
              <span>“The vines reached the door overnight.”</span>
              <small>— M. Varela</small>
            </div>
            <div className="stamp">QUARANTINED</div>
          </div>
        </div>

        <div className="terminal-card">
          <div className="terminal-head">
            <div>
              <span className="terminal-light" />
              ACCESS TERMINAL B-07
            </div>
            <span>LOCAL NETWORK</span>
          </div>
          <div className="terminal-body">
            <span className="kicker">Puzzle 02 / Protocol cipher</span>
            <h1>WHAT IS THE ACCESS CODE?</h1>
            <p>
              Cross-reference the recovered incident report. Enter the abbreviated wing designation and containment
              number.
            </p>
            <div className="format-note">
              <span>FORMAT</span>
              <code>XXX-0</code>
              <small>One attempt at a time</small>
            </div>
            <form onSubmit={submitAnswer}>
              <label htmlFor="answer">ACCESS CODE</label>
              <div className={`answer-wrap ${feedback}`}>
                <input
                  id="answer"
                  value={answer}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    setFeedback("idle");
                  }}
                  placeholder="ENTER CODE"
                  autoComplete="off"
                  aria-describedby="feedback"
                />
                <span>{answer.length}/12</span>
              </div>
              <button className="submit-button" type="submit" disabled={objectiveComplete}>
                {objectiveComplete ? "Access granted" : "Submit answer"}
                <Icon name={objectiveComplete ? "check" : "arrow"} />
              </button>
            </form>
            <div id="feedback" className={`feedback-message ${feedback}`} aria-live="polite">
              {feedback === "incorrect" && (
                <>
                  <Icon name="warning" />
                  <div>
                    <strong>ACCESS DENIED</strong>
                    <span>{moodTone[mood].denied}</span>
                  </div>
                </>
              )}
              {feedback === "correct" && (
                <>
                  <Icon name="check" />
                  <div>
                    <strong>IDENTITY CONFIRMED</strong>
                    <span>Door B-07 unlocked. The next corridor is now accessible.</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="memory-bar">
            <Icon name="brain" />
            <div>
              <span>AI GAME MASTER</span>
              <p>{memoryMessage}</p>
            </div>
          </div>
        </div>
      </section>

      <button className={`hint-tab ${hintOpen ? "open" : ""}`} onClick={toggleHint}>
        <Icon name="brain" />
        <span>AI HINT</span>
        <b>{hintOpen ? "×" : "+"}</b>
      </button>
      <aside className={`hint-panel ${hintOpen ? "open" : ""}`} aria-hidden={!hintOpen}>
        <div className="drawer-header">
          <div>
            <span className="kicker">Adaptive support</span>
            <h2>AI FIELD GUIDE</h2>
          </div>
          <button className="icon-button" onClick={() => setHintOpen(false)} aria-label="Close hint">
            <Icon name="close" />
          </button>
        </div>
        <div className="ai-message">
          <Icon name="brain" />
          <div>
            <span>GUIDANCE LEVEL {hintLevel + 1} / 3</span>
            <p>{hints[hintLevel]}</p>
          </div>
        </div>
        <p className="hint-disclaimer">Hints become more explicit at each level. Your use of assistance affects later puzzles.</p>
        <button className="secondary-button" onClick={revealClearerHint} disabled={hintLevel === 2}>
          {hintLevel === 2 ? "Maximum guidance reached" : "Reveal a clearer hint"}
          <Icon name="arrow" />
        </button>
      </aside>

      {logOpen && <button className="drawer-scrim" onClick={() => setLogOpen(false)} aria-label="Close survival log" />}
      <aside className={`log-panel ${logOpen ? "open" : ""}`} aria-hidden={!logOpen}>
        <div className="drawer-header">
          <div>
            <span className="kicker">Expedition 01</span>
            <h2>SURVIVAL LOG</h2>
          </div>
          <button className="icon-button" onClick={() => setLogOpen(false)} aria-label="Close survival log">
            <Icon name="close" />
          </button>
        </div>
        <div className="log-section">
          <div className="log-section-title">
            <span>OBJECTIVES</span>
            <small>{objectiveComplete ? "2" : "1"} / 6 COMPLETE</small>
          </div>
          <LogRow done title="Enter the research annex" meta="Completed · 04:12" />
          <LogRow done={objectiveComplete} active={!objectiveComplete} title="Restore lab access protocol" meta={objectiveComplete ? "Completed just now" : "Current objective"} />
          <LogRow title="Reach the specimen vault" meta="Objective locked" />
        </div>
        <div className="log-section">
          <div className="log-section-title">
            <span>INVENTORY</span>
            <small>3 / 8 SLOTS</small>
          </div>
          <div className="inventory-grid">
            <InventoryItem symbol="K" title="Maintenance key" />
            <InventoryItem symbol="R" title="Incident report" />
            <InventoryItem symbol="F" title="Half-full flare" />
            <div className="inventory-empty">EMPTY</div>
          </div>
        </div>
        <div className="log-section">
          <div className="log-section-title">
            <span>CLUES</span>
            <small>2 DISCOVERED</small>
          </div>
          <div className="clue-list">
            <div>
              <span>01</span>
              <p><strong>Biological Unit 7</strong><small>Incident report · Security desk</small></p>
            </div>
            <div>
              <span>02</span>
              <p><strong>Protocol labels contain no spaces</strong><small>Incident report · Final instruction</small></p>
            </div>
          </div>
        </div>
        <div className="log-section story-section">
          <div className="log-section-title">
            <span>STORY SO FAR</span>
            <small>AI RECAP</small>
          </div>
          <p>{storySoFar}</p>
        </div>
        <div className="system-memory">
          <Icon name="brain" />
          <div>
            <span>WHAT THE SYSTEM REMEMBERS</span>
            <p>{systemMemory}</p>
          </div>
        </div>
      </aside>
      {result && (
        <ResultsScreen
          result={result}
          elapsedSeconds={elapsedSeconds}
          hintsUsed={hintsUsed}
          wrongAttempts={wrongAttempts}
          onPlayAgain={onPlayAgain}
          onChangeSettings={onChangeSettings}
        />
      )}
    </main>
  );
}

function LogRow({ done = false, active = false, title, meta }: { done?: boolean; active?: boolean; title: string; meta: string }) {
  return (
    <div className={`log-row ${active ? "active" : ""}`}>
      <span className={done ? "done" : ""}>{done ? <Icon name="check" size={14} /> : ""}</span>
      <div>
        <strong>{title}</strong>
        <small>{meta}</small>
      </div>
    </div>
  );
}

function InventoryItem({ symbol, title }: { symbol: string; title: string }) {
  return (
    <div className="inventory-item">
      <span>{symbol}</span>
      <small>{title}</small>
    </div>
  );
}

function ResultsScreen({
  result,
  elapsedSeconds,
  hintsUsed,
  wrongAttempts,
  onPlayAgain,
  onChangeSettings,
}: {
  result: Exclude<Result, null>;
  elapsedSeconds: number;
  hintsUsed: number;
  wrongAttempts: number;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}) {
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  const rating =
    result === "escaped"
      ? Math.max(1, 5 - Math.min(2, hintsUsed) - Math.min(2, wrongAttempts))
      : Math.max(1, 3 - Math.min(1, hintsUsed) - Math.min(1, wrongAttempts));
  const summary =
    result === "escaped"
      ? `You escaped through B-07 after ${wrongAttempts === 0 ? "trusting the recovered evidence" : `surviving ${wrongAttempts} failed ${wrongAttempts === 1 ? "attempt" : "attempts"}`}. ${hintsUsed > 0 ? `The Field Guide helped ${hintsUsed} ${hintsUsed === 1 ? "time" : "times"}, but the final choice was yours.` : "You refused AI guidance and decoded the report alone."} Your preserved flare may change what waits beyond the vault.`
      : `The annex breached before you could restore B-07. ${wrongAttempts > 0 ? `The system recorded ${wrongAttempts} rejected ${wrongAttempts === 1 ? "code" : "codes"}.` : "You studied the evidence but never committed to a code."} ${hintsUsed > 0 ? "You consulted the Field Guide, but time closed the route." : "You kept the Field Guide silent."} The maintenance key and flare remain your best chance on another run.`;

  return (
    <section className={`results-screen ${result}`} role="dialog" aria-modal="true" aria-label="Mission results">
      <div className="results-grid">
        <div className="results-status">
          <span className="kicker">Expedition 01 / Final report</span>
          <div className="result-mark">
            <Icon name={result === "escaped" ? "check" : "warning"} size={34} />
          </div>
          <h1>{result === "escaped" ? "ESCAPED" : "FAILED"}</h1>
          <p>{result === "escaped" ? "ACCESS ROUTE B-07 SECURED" : "FACILITY CONTAINMENT BREACHED"}</p>
        </div>
        <div className="results-report">
          <div className="results-report-head">
            <div>
              <span>AI GAME MASTER REPORT</span>
              <strong>RUN / A-01</strong>
            </div>
            <span className="online">ARCHIVE UPDATED</span>
          </div>
          <div className="result-stats">
            <div><span>Time taken</span><strong>{minutes}:{seconds}</strong></div>
            <div><span>Hints used</span><strong>{hintsUsed}</strong></div>
            <div><span>Wrong attempts</span><strong>{wrongAttempts}</strong></div>
          </div>
          <div className="ending-summary">
            <span>AI-WRITTEN ENDING</span>
            <p>{summary}</p>
          </div>
          <div className="result-rating">
            <div>
              <span>SURVIVAL RATING</span>
              <strong>{rating} / 5</strong>
            </div>
            <div className="stars" aria-label={`${rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span className={star <= rating ? "earned" : ""} key={star}><Icon name="star" size={22} /></span>
              ))}
            </div>
          </div>
          <div className="result-actions">
            <button className="primary-button" onClick={onPlayAgain}>Play again <Icon name="arrow" /></button>
            <button className="secondary-button" onClick={onChangeSettings}>Change settings <Icon name="gear" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoModal({ type, onClose }: { type: Exclude<Modal, null>; onClose: () => void }) {
  const [sound, setSound] = useState(true);
  const [motion, setMotion] = useState(true);

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label={type === "how" ? "How to play" : "Settings"}>
      <button className="modal-scrim" onClick={onClose} aria-label="Close modal" />
      <section className="modal">
        <div className="drawer-header">
          <div>
            <span className="kicker">{type === "how" ? "Survivor orientation" : "System controls"}</span>
            <h2>{type === "how" ? "HOW TO PLAY" : "SETTINGS"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {type === "how" ? (
          <div className="how-grid">
            <div><span>01</span><strong>Search the evidence</strong><p>Read recovered files and observe details in each environment.</p></div>
            <div><span>02</span><strong>Solve to survive</strong><p>Enter answers in the field terminal before the facility is breached.</p></div>
            <div><span>03</span><strong>Choose carefully</strong><p>Your route, inventory, and hint use reshape challenges ahead.</p></div>
            <div><span>04</span><strong>Ask the field guide</strong><p>AI hints keep you moving without leaving the active scene.</p></div>
          </div>
        ) : (
          <div className="settings-list">
            <SettingRow icon="sound" label="Atmospheric audio" description="Ambient jungle and facility soundscape" value={sound} onChange={setSound} />
            <SettingRow icon="gear" label="Interface motion" description="Transitions and environmental effects" value={motion} onChange={setMotion} />
            <div className="setting-row">
              <Icon name="warning" />
              <div><strong>Text scale</strong><span>Interface readability</span></div>
              <select aria-label="Text scale"><option>Standard</option><option>Large</option></select>
            </div>
          </div>
        )}
        <button className="primary-button modal-action" onClick={onClose}>
          {type === "how" ? "Begin orientation" : "Save settings"} <Icon name="arrow" />
        </button>
      </section>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: "sound" | "gear";
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <Icon name={icon} />
      <div><strong>{label}</strong><span>{description}</span></div>
      <button className={`toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)} aria-pressed={value}>
        <span />
      </button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [modal, setModal] = useState<Modal>(null);
    const [settings, setSettings] = useState({ difficulty: "Medium", time: "25", chaos: "Medium", mood: "Tense" });
  const [gameRun, setGameRun] = useState(0);

  const beginGame = (difficulty: string, time: string, chaos: string, mood: string) => {
    setSettings({ difficulty, time, chaos, mood });
    setScreen("game");
  };

  return (
    <>
      {screen === "landing" && <Landing onStart={() => setScreen("configure")} onModal={setModal} />}
      {screen === "configure" && <Config onBack={() => setScreen("landing")} onBegin={beginGame} />}
      {screen === "game" && (
        <Gameplay
          key={gameRun}
          onExit={() => setScreen("landing")}
          onPlayAgain={() => setGameRun((current) => current + 1)}
          onChangeSettings={() => setScreen("configure")}
          duration={settings.time}
          difficulty={settings.difficulty}
          chaos={settings.chaos}
          mood={settings.mood}
        />
      )}
      {modal && <InfoModal type={modal} onClose={() => setModal(null)} />}
    </>
  );
}
