import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

type OverlayType =
  | "opening_title"
  | "chapter_title"
  | "year_stamp"
  | "location_label"
  | "key_fact"
  | "quote_card"
  | "person_label"
  | "outro";

type Overlay = {
  id: string;
  type: OverlayType;
  startTime: number;
  duration: number;
  content: Record<string, unknown>;
};

type Storyboard = {
  duration?: number;
  overlays: Overlay[];
};

type Transcript = {
  fullText: string;
  words: Array<{ word: string; startMs: number; endMs: number }>;
};

type FaceLibraryEntry = {
  name: string;
  aliases?: string[];
  role?: string;
  imageSrc?: string;
};

type FaceLibrary = {
  version?: number;
  people: FaceLibraryEntry[];
};

type ParseArgsResult = {
  max?: number;
  minGap?: number;
  force: boolean;
  replaceExisting: boolean;
};

type PersonCandidate = {
  name: string;
  role: string;
  sentence: string;
  start: number;
  source: "library" | "detected";
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const STORYBOARD_PATH = path.join(PROJECT_ROOT, "data", "storyboard.json");
const TRANSCRIPT_PATH = path.join(PROJECT_ROOT, "data", "transcript.json");
const FACE_LIBRARY_PATH = path.join(PROJECT_ROOT, "data", "face-library.json");

const EXCLUDE_NAMES = new Set([
  "Operation Rising Lion",
  "United States",
  "Saudi Arabia",
  "United Arab Emirates",
  "Middle East",
  "Abraham Accords",
  "Oval Office",
  "Tehran",
  "Russia",
  "Turkey",
  "Iran",
  "Israel",
  "Persia",
  "Magog",
  "Gog Magog",
]);

const NAME_START_STOPWORDS = new Set([
  "And",
  "In",
  "On",
  "At",
  "From",
  "The",
  "A",
  "An",
  "But",
  "Now",
  "Within",
  "Before",
  "After",
  "During",
]);

const MONTH_WORDS = new Set([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]);

const TITLE_PREFIXES = new Set([
  "Pastor",
  "President",
  "King",
  "Dr",
  "Mr",
  "Mrs",
  "Ms",
  "Prophet",
  "Leader",
  "Supreme",
]);

const PERSON_CONTEXT_CUES = [
  "president",
  "pastor",
  "supreme leader",
  "king",
  "leader",
  "commentator",
  "influencer",
  "anointed",
  "photographed",
  "killing",
  "including",
  "surrounded",
];

const GENERIC_NON_PERSON_TOKENS = new Set([
  "Invasion",
  "Accords",
  "Office",
  "States",
  "Campaign",
  "Facilities",
  "Cities",
  "Storm",
  "War",
  "Peace",
  "Bible",
  "Prophecy",
]);

const NON_PERSON_NAME_TOKENS = new Set([
  "Operation",
  "Rising",
  "Lion",
  "Temple",
  "Mount",
  "Heifers",
  "Minister",
  "Arabia",
  "Emirates",
  "States",
  "East",
  "West",
  "North",
  "South",
  "Sea",
  "Asia",
  "Europe",
  "Africa",
]);

const parseArgs = (): ParseArgsResult => {
  const args = process.argv.slice(2);
  let max: number | undefined;
  let minGap: number | undefined;
  let force = false;
  let replaceExisting = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--max" && args[i + 1]) {
      max = Number(args[i + 1]);
      i += 1;
      continue;
    }

    if (arg === "--min-gap" && args[i + 1]) {
      minGap = Number(args[i + 1]);
      i += 1;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--replace-existing") {
      replaceExisting = true;
      continue;
    }

    if (arg === "--help") {
      console.log(
        "Usage: npx tsx scripts/auto-person-labels.ts [--max 3] [--min-gap 40] [--force] [--replace-existing]"
      );
      process.exit(0);
    }
  }

  return { max, minGap, force, replaceExisting };
};

const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const toSlug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const splitSentences = (text: string): string[] => {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const getDefaultsForDuration = (durationSec: number): { max: number; minGap: number } => {
  const minutes = durationSec / 60;

  if (minutes >= 15) {
    return { max: 3, minGap: 40 };
  }

  if (minutes >= 10) {
    return { max: 3, minGap: 30 };
  }

  if (minutes >= 5) {
    return { max: 2, minGap: 22 };
  }

  return { max: 2, minGap: 12 };
};

const loadFaceLibrary = (): FaceLibrary => {
  if (!existsSync(FACE_LIBRARY_PATH)) {
    return { version: 1, people: [] };
  }

  try {
    const raw = JSON.parse(readFileSync(FACE_LIBRARY_PATH, "utf8")) as FaceLibrary;
    if (!Array.isArray(raw.people)) {
      return { version: 1, people: [] };
    }

    return {
      version: Number(raw.version ?? 1),
      people: raw.people
        .filter((person) => !!person && typeof person.name === "string" && person.name.trim().length > 0)
        .map((person) => ({
          name: person.name.trim(),
          aliases: Array.isArray(person.aliases)
            ? person.aliases
                .filter((alias): alias is string => typeof alias === "string" && alias.trim().length > 0)
                .map((alias) => alias.trim())
            : [],
          role: typeof person.role === "string" ? person.role.trim() : undefined,
          imageSrc: typeof person.imageSrc === "string" ? person.imageSrc.trim() : undefined,
        })),
    };
  } catch {
    return { version: 1, people: [] };
  }
};

const resolveLibraryEntryByPhrase = (
  library: FaceLibrary,
  phrase: string
): FaceLibraryEntry | null => {
  const target = normalize(phrase);
  if (!target) {
    return null;
  }

  for (const person of library.people) {
    if (normalize(person.name) === target) {
      return person;
    }

    for (const alias of person.aliases ?? []) {
      if (normalize(alias) === target) {
        return person;
      }
    }
  }

  return null;
};

const detectNameCandidates = (sentences: string[]): Array<{ name: string; sentence: string }> => {
  const results: Array<{ name: string; sentence: string }> = [];
  const directNameRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const hasCue = PERSON_CONTEXT_CUES.some((cue) => lowerSentence.includes(cue));

    const matches = sentence.matchAll(directNameRegex);
    for (const match of matches) {
      const rawName = match[1].trim().replace(/[.,:;!?]+$/g, "");
      const parts = rawName.split(/\s+/).filter(Boolean);

      if (parts.length < 2) {
        continue;
      }

      if (NAME_START_STOPWORDS.has(parts[0])) {
        continue;
      }

      const cleaned = [...parts];
      if (TITLE_PREFIXES.has(cleaned[0])) {
        cleaned.shift();
      }

      const candidateParts = cleaned.length >= 2 ? cleaned : parts;
      if (candidateParts.length < 2) {
        continue;
      }

      if (MONTH_WORDS.has(candidateParts[0])) {
        continue;
      }

      if (NAME_START_STOPWORDS.has(candidateParts[0])) {
        continue;
      }

      if (candidateParts.some((token) => GENERIC_NON_PERSON_TOKENS.has(token))) {
        continue;
      }

      if (candidateParts.some((token) => NON_PERSON_NAME_TOKENS.has(token))) {
        continue;
      }

      const name = candidateParts.join(" ");
      if (EXCLUDE_NAMES.has(name)) {
        continue;
      }
      if (name.length < 6) {
        continue;
      }

      const score = (hasCue ? 2 : 0) + (candidateParts.length >= 2 ? 1 : 0);
      if (score < 2) {
        continue;
      }

      results.push({ name, sentence });
    }
  }

  return results;
};

const findPhraseStartSec = (words: Transcript["words"], phrase: string): number | null => {
  const tokens = phrase
    .split(/\s+/)
    .map((x) => normalize(x))
    .filter(Boolean);

  if (tokens.length === 0) {
    return null;
  }

  const source = words.map((w) => ({ token: normalize(w.word), ms: w.startMs }));

  for (let i = 0; i <= source.length - tokens.length; i++) {
    let ok = true;
    for (let j = 0; j < tokens.length; j++) {
      if (source[i + j].token !== tokens[j]) {
        ok = false;
        break;
      }
    }

    if (ok) {
      return source[i].ms / 1000;
    }
  }

  return null;
};

const inferRole = (name: string, sentence: string): string => {
  const lower = sentence.toLowerCase();

  if (lower.includes("president")) {
    return "President";
  }

  if (lower.includes("pastor")) {
    return "Pastor";
  }

  if (lower.includes("supreme leader")) {
    return "Supreme Leader";
  }

  if (lower.includes("king")) {
    return "King";
  }

  if (lower.includes("prophet")) {
    return "Prophet";
  }

  if (lower.includes("commentator") || lower.includes("influencer")) {
    return "Commentator";
  }

  if (name === "Donald Trump") {
    return "U.S. President";
  }

  if (name === "Greg Laurie") {
    return "Pastor";
  }

  return "Referenced Figure";
};

const detectLibraryCandidates = (
  library: FaceLibrary,
  words: Transcript["words"]
): PersonCandidate[] => {
  const candidates: PersonCandidate[] = [];

  for (const person of library.people) {
    const phrases = [person.name, ...(person.aliases ?? [])]
      .map((x) => x.trim())
      .filter(Boolean);

    let earliest: number | null = null;

    for (const phrase of phrases) {
      const start = findPhraseStartSec(words, phrase);
      if (start === null) {
        continue;
      }

      if (earliest === null || start < earliest) {
        earliest = start;
      }
    }

    if (earliest === null) {
      continue;
    }

    candidates.push({
      name: person.name,
      role: person.role?.trim() || "Referenced Figure",
      sentence: person.role?.trim() || "",
      start: earliest,
      source: "library",
    });
  }

  return candidates;
};

const conflicts = (
  start: number,
  duration: number,
  overlays: Overlay[],
  minGap: number
): boolean => {
  const end = start + duration;

  return overlays.some((overlay) => {
    if (overlay.type !== "person_label" && overlay.type !== "location_label") {
      return false;
    }

    const otherStart = overlay.startTime;
    const otherEnd = overlay.startTime + overlay.duration;

    return start < otherEnd + minGap && end > otherStart - minGap;
  });
};

const findNonConflictingStart = (
  start: number,
  duration: number,
  storyboardDuration: number,
  overlays: Overlay[],
  minGap: number
): number => {
  let candidate = Math.max(0, start);
  const maxStart = Math.max(0, storyboardDuration - duration - 0.2);

  while (candidate <= maxStart) {
    if (!conflicts(candidate, duration, overlays, minGap)) {
      return candidate;
    }
    candidate += 0.4;
  }

  return Math.min(start, maxStart);
};

const main = () => {
  const { max: maxArg, minGap: minGapArg, force, replaceExisting } = parseArgs();

  if (!existsSync(STORYBOARD_PATH) || !existsSync(TRANSCRIPT_PATH)) {
    throw new Error("Missing data/storyboard.json or data/transcript.json");
  }

  const storyboard = JSON.parse(readFileSync(STORYBOARD_PATH, "utf8")) as Storyboard;
  const transcript = JSON.parse(readFileSync(TRANSCRIPT_PATH, "utf8")) as Transcript;
  const library = loadFaceLibrary();
  const storyboardDuration =
    Number(storyboard.duration) || (transcript.words[transcript.words.length - 1]?.endMs ?? 0) / 1000;

  const defaults = getDefaultsForDuration(storyboardDuration);
  const max = Number.isFinite(maxArg) ? Math.max(0, Number(maxArg)) : defaults.max;
  const minGap = Number.isFinite(minGapArg) ? Math.max(0, Number(minGapArg)) : defaults.minGap;

  if (force) {
    storyboard.overlays = storyboard.overlays.filter((o) => !o.id.startsWith("auto-person-"));
  }

  if (replaceExisting) {
    storyboard.overlays = storyboard.overlays.filter((o) => o.type !== "person_label");
  }

  const existingPersonNames = new Set(
    storyboard.overlays
      .filter((o) => o.type === "person_label")
      .map((o) => String(o.content.name ?? "").trim().toLowerCase())
      .filter(Boolean)
  );

  const uniqueByName = new Map<string, PersonCandidate>();

  const addCandidate = (candidate: PersonCandidate) => {
    const key = candidate.name.toLowerCase();

    if (existingPersonNames.has(key) || uniqueByName.has(key)) {
      return;
    }

    uniqueByName.set(key, candidate);
  };

  const libraryCandidates = detectLibraryCandidates(library, transcript.words);
  for (const candidate of libraryCandidates) {
    addCandidate(candidate);
  }

  const sentences = splitSentences(transcript.fullText);
  const detected = detectNameCandidates(sentences);

  for (const item of detected) {
    const canonical = resolveLibraryEntryByPhrase(library, item.name);
    const startSec = findPhraseStartSec(transcript.words, item.name);

    if (startSec === null) {
      continue;
    }

    if (canonical) {
      addCandidate({
        name: canonical.name,
        role: canonical.role?.trim() || inferRole(canonical.name, item.sentence),
        sentence: item.sentence,
        start: startSec,
        source: "detected",
      });
      continue;
    }

    addCandidate({
      name: item.name,
      role: inferRole(item.name, item.sentence),
      sentence: item.sentence,
      start: startSec,
      source: "detected",
    });
  }

  const picked = [...uniqueByName.values()]
    .sort((a, b) => a.start - b.start)
    .slice(0, max);

  if (picked.length === 0) {
    console.log("No new person names detected.");
    return;
  }

  for (const person of picked) {
    const duration = 3.4;
    const proposed = Math.max(0, person.start - 0.2);
    const startTime = findNonConflictingStart(
      proposed,
      duration,
      storyboardDuration,
      storyboard.overlays,
      minGap
    );

    const overlay: Overlay = {
      id: `auto-person-${toSlug(person.name)}`,
      type: "person_label",
      startTime,
      duration,
      content: {
        name: person.name,
        role: person.role,
        source: person.source,
      },
    };

    storyboard.overlays.push(overlay);
    console.log(`Added person_label: ${person.name} @ ${startTime.toFixed(2)}s`);
  }

  storyboard.overlays.sort((a, b) => a.startTime - b.startTime);
  writeFileSync(STORYBOARD_PATH, `${JSON.stringify(storyboard, null, 2)}\n`);
  console.log(`Updated ${STORYBOARD_PATH}`);
};

try {
  main();
} catch (error) {
  console.error(`❌ ${(error as Error).message}`);
  process.exit(1);
}
