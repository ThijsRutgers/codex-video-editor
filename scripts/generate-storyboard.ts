import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";

type Word = { word: string; startMs: number; endMs: number };

type Overlay = {
  id: string;
  type:
    | "opening_title"
    | "chapter_title"
    | "year_stamp"
    | "location_label"
    | "key_fact"
    | "quote_card"
    | "person_label"
    | "outro";
  startTime: number;
  duration: number;
  content: Record<string, unknown>;
  triggerWord?: string;
};

type Storyboard = {
  videoFile: string;
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  videoType: string;
  storySummary: string;
  generatedTitle: { text: string; subtitle: string | null };
  chapters: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    summary: string;
  }>;
  overlays: Overlay[];
  outro: { startTime: number; hasLogo: boolean; websiteUrl: string | null };
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const TRANSCRIPT_PATH = path.join(PROJECT_ROOT, "data", "transcript.json");
const STORYBOARD_PATH = path.join(PROJECT_ROOT, "data", "storyboard.json");
const VIDEO_PATH = path.join(PROJECT_ROOT, "public", "video.mp4");

const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const findPhraseStartSec = (words: Word[], phrase: string): number | null => {
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

const ffprobeInfo = (): { width: number; height: number; fps: number; duration: number } => {
  const result = spawnSync(
    "ffprobe",
    ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", VIDEO_PATH],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    return { width: 1920, height: 1080, fps: 30, duration: 120 };
  }

  const parsed = JSON.parse(result.stdout) as {
    streams: Array<Record<string, string | number>>;
    format: { duration?: string };
  };

  const video = parsed.streams.find((s) => s.codec_type === "video") ?? {};
  const fpsRaw = String(video.avg_frame_rate ?? "30/1");
  const [n, d] = fpsRaw.split("/").map((x) => Number(x));
  const fps = n && d ? n / d : 30;

  return {
    width: Number(video.width ?? 1920),
    height: Number(video.height ?? 1080),
    fps: Number.isFinite(fps) ? fps : 30,
    duration: Number(parsed.format.duration ?? 120),
  };
};

const buildRisingLionStoryboard = (
  transcript: { fullText: string; words: Word[] },
  meta: { width: number; height: number; fps: number; duration: number },
  duration: number
): Storyboard => {
  const t = (phrase: string, fallback: number): number => {
    const found = findPhraseStartSec(transcript.words, phrase);
    return found === null ? fallback : found;
  };

  const chapterStarts = [
    0,
    Math.max(160, t("Most Bible scholars", 220)),
    Math.max(460, t("Gog from the land of Magog", 574)),
    Math.max(860, t("Temple Institute", 958)),
    Math.max(1020, t("Luke", 1096)),
  ];

  const chapters = [
    {
      id: "ch-1",
      title: "The 12-Day War",
      startTime: chapterStarts[0],
      endTime: chapterStarts[1],
      summary: "Military escalation and regional alignment after Operation Rising Lion.",
    },
    {
      id: "ch-2",
      title: "Dates vs Discernment",
      startTime: chapterStarts[1],
      endTime: chapterStarts[2],
      summary: "Distinguishing speculative date-setting from biblical watchfulness.",
    },
    {
      id: "ch-3",
      title: "Ezekiel 38 Lens",
      startTime: chapterStarts[2],
      endTime: chapterStarts[3],
      summary: "Examining Gog-Magog geography and coalition structure.",
    },
    {
      id: "ch-4",
      title: "Temple Preparations",
      startTime: chapterStarts[3],
      endTime: chapterStarts[4],
      summary: "Red heifer program and Temple Institute activity in present-day context.",
    },
    {
      id: "ch-5",
      title: "Watch The Season",
      startTime: chapterStarts[4],
      endTime: duration,
      summary: "Final call to readiness without date-setting claims.",
    },
  ];

  const overlays: Overlay[] = [];
  let id = 1;
  const add = (overlay: Omit<Overlay, "id">) => {
    const safeDuration = Math.max(1.6, overlay.duration);
    const startTime = Math.max(0, Math.min(duration - safeDuration - 0.2, overlay.startTime));
    overlays.push({ ...overlay, id: `ovl-${id++}`, startTime, duration: safeDuration });
  };

  add({
    type: "opening_title",
    startTime: 0,
    duration: 5.2,
    content: {
      title: "Operation Rising Lion and the Prophetic Timeline",
      subtitle: "A Documentary Geopolitical Brief",
    },
  });

  for (const chapter of chapters) {
    add({
      type: "chapter_title",
      startTime: Math.min(chapter.startTime + 6, duration - 8),
      duration: 3.8,
      content: { title: chapter.title },
    });
  }

  add({
    type: "year_stamp",
    startTime: Math.max(18, t("In June of 2025", 2.8) + 14),
    duration: 3.2,
    content: { year: "2025", detail: "Operation Rising Lion" },
    triggerWord: "In June of 2025",
  });

  add({
    type: "key_fact",
    startTime: t("12-day war", 21.2),
    duration: 3.2,
    content: { value: "12 DAYS", context: "Ceasefire after direct Israel-Iran exchange" },
    triggerWord: "12-day war",
  });

  add({
    type: "year_stamp",
    startTime: Math.max(122, t("In February of 2026", 24.4) + 96),
    duration: 3.2,
    content: { year: "2026", detail: "Joint regional statement" },
    triggerWord: "In February of 2026",
  });

  add({
    type: "key_fact",
    startTime: t("Saudi Arabia", 29.3),
    duration: 3.2,
    content: { value: "8 NATIONS", context: "Joint condemnation statement" },
    triggerWord: "Saudi Arabia",
  });

  add({
    type: "location_label",
    startTime: t("Temple Mount", 48.1),
    duration: 3.2,
    content: { location: "Temple Mount, Jerusalem", qualifier: "Attendance records highlighted" },
    triggerWord: "Temple Mount",
  });

  add({
    type: "quote_card",
    startTime: Math.max(332, t("No one knows", 360) - 36),
    duration: 4.2,
    content: { quote: "No one knows the day or the hour.", attribution: "Matthew 24:36" },
    triggerWord: "No one knows",
  });

  add({
    type: "person_label",
    startTime: t("Harold Camping", 376.6),
    duration: 3.4,
    content: { name: "Harold Camping", role: "Radio Broadcaster" },
    triggerWord: "Harold Camping",
  });

  add({
    type: "person_label",
    startTime: Math.max(454, t("Edgar Wissenand", 380.7) + 74),
    duration: 3.4,
    content: { name: "Edgar Whisenant", role: "Author, Rapture Date Prediction" },
    triggerWord: "Edgar Wissenand",
  });

  add({
    type: "location_label",
    startTime: t("Black Sea", 610.8),
    duration: 3.2,
    content: { location: "Black Sea to Moscow Arc", qualifier: "Geographic argument in narration" },
    triggerWord: "Black Sea",
  });

  add({
    type: "quote_card",
    startTime: Math.max(736, t("hooks in your jaws", 738) + 145),
    duration: 4,
    content: { quote: "I will turn you around, put hooks in your jaws.", attribution: "Ezekiel 38" },
    triggerWord: "hooks in your jaws",
  });

  add({
    type: "person_label",
    startTime: Math.max(812, t("Ezekiel 38", 737.4) + 84),
    duration: 3.4,
    content: { name: "Ezekiel", role: "Hebrew Prophet" },
    triggerWord: "Ezekiel 38",
  });

  add({
    type: "location_label",
    startTime: t("Temple Institute", 958.4),
    duration: 3.2,
    content: { location: "Temple Institute, Jerusalem", qualifier: "Preparation milestones discussed" },
    triggerWord: "Temple Institute",
  });

  add({
    type: "key_fact",
    startTime: Math.max(884, t("all the nations of the earth", 860) + 24),
    duration: 3.2,
    content: { value: "GLOBAL FLASHPOINT", context: "Jerusalem presented as a geopolitical pressure point" },
    triggerWord: "all the nations of the earth",
  });

  add({
    type: "person_label",
    startTime: Math.max(1032, t("Amihai Eliyahu", 978.9) + 52),
    duration: 3.4,
    content: { name: "Amihai Eliyahu", role: "Israeli Heritage Minister" },
    triggerWord: "Amihai Eliyahu",
  });

  add({
    type: "key_fact",
    startTime: t("October 7, 2023", 1005.6),
    duration: 3.2,
    content: { value: "OCT 7, 2023", context: "Referenced motive in released documents" },
    triggerWord: "October 7, 2023",
  });

  add({
    type: "key_fact",
    startTime: Math.max(1068, t("recognize the season", 1090) - 22),
    duration: 3.2,
    content: { value: "WATCH THE SEASON", context: "Closing emphasis: discernment over date-setting" },
    triggerWord: "recognize the season",
  });

  const outroStart = Math.max(0, duration - 2.4);
  add({
    type: "outro",
    startTime: outroStart,
    duration: 2.2,
    content: { hasLogo: false, websiteUrl: null },
  });

  overlays.sort((a, b) => a.startTime - b.startTime);

  return {
    videoFile: "video.mp4",
    duration,
    fps: meta.fps,
    resolution: { width: meta.width, height: meta.height },
    videoType: "documentary_commentary",
    storySummary:
      "A long-form documentary commentary tracing the 2025-2026 Middle East escalation and evaluating it through an Ezekiel 38 prophetic framework.",
    generatedTitle: {
      text: "Operation Rising Lion and the Prophetic Timeline",
      subtitle: "A Documentary Geopolitical Brief",
    },
    chapters,
    overlays,
    outro: { startTime: outroStart, hasLogo: false, websiteUrl: null },
  };
};

const buildDefaultStoryboard = (
  transcript: { fullText: string; words: Word[] },
  meta: { width: number; height: number; fps: number; duration: number },
  duration: number
): Storyboard => {
  const title = "Documentary Brief";
  const overlays: Overlay[] = [];
  overlays.push({
    id: "ovl-1",
    type: "opening_title",
    startTime: 0,
    duration: 4.8,
    content: { title, subtitle: "Analysis and Timeline" },
  });
  overlays.push({
    id: "ovl-2",
    type: "chapter_title",
    startTime: Math.min(8, Math.max(1, duration * 0.08)),
    duration: 3.8,
    content: { title: "Context" },
  });
  overlays.push({
    id: "ovl-3",
    type: "chapter_title",
    startTime: Math.min(duration - 10, Math.max(12, duration * 0.45)),
    duration: 3.8,
    content: { title: "Main Analysis" },
  });
  overlays.push({
    id: "ovl-4",
    type: "chapter_title",
    startTime: Math.min(duration - 6, Math.max(16, duration * 0.78)),
    duration: 3.8,
    content: { title: "Conclusion" },
  });
  const outroStart = Math.max(0, duration - 1.8);
  overlays.push({
    id: "ovl-5",
    type: "outro",
    startTime: outroStart,
    duration: 1.8,
    content: { hasLogo: false, websiteUrl: null },
  });

  return {
    videoFile: "video.mp4",
    duration,
    fps: meta.fps,
    resolution: { width: meta.width, height: meta.height },
    videoType: "documentary",
    storySummary: "Documentary-style narrative with chapter markers and subtitles.",
    generatedTitle: { text: title, subtitle: "Analysis and Timeline" },
    chapters: [
      { id: "ch-1", title: "Context", startTime: 0, endTime: duration * 0.4, summary: "Setup and background." },
      {
        id: "ch-2",
        title: "Main Analysis",
        startTime: duration * 0.4,
        endTime: duration * 0.75,
        summary: "Core analysis and evidence.",
      },
      {
        id: "ch-3",
        title: "Conclusion",
        startTime: duration * 0.75,
        endTime: duration,
        summary: "Closing synthesis and implications.",
      },
    ],
    overlays,
    outro: { startTime: outroStart, hasLogo: false, websiteUrl: null },
  };
};

const main = () => {
  if (!existsSync(TRANSCRIPT_PATH)) {
    throw new Error("Missing data/transcript.json. Run transcription first.");
  }

  const transcript = JSON.parse(readFileSync(TRANSCRIPT_PATH, "utf8")) as {
    fullText: string;
    words: Word[];
  };

  if (!Array.isArray(transcript.words) || transcript.words.length === 0) {
    throw new Error("Transcript has no words.");
  }

  const meta = ffprobeInfo();
  const durationFromWords = transcript.words[transcript.words.length - 1].endMs / 1000;
  const duration = Math.max(meta.duration || 0, durationFromWords || 0);

  const isRisingLion = /operation\s+rising\s+lion/i.test(transcript.fullText);

  const storyboard = isRisingLion
    ? buildRisingLionStoryboard(transcript, meta, duration)
    : buildDefaultStoryboard(transcript, meta, duration);

  writeFileSync(STORYBOARD_PATH, `${JSON.stringify(storyboard, null, 2)}\n`);
  console.log(`Generated ${STORYBOARD_PATH} with ${storyboard.overlays.length} overlays.`);
};

try {
  main();
} catch (error) {
  console.error(`❌ ${(error as Error).message}`);
  process.exit(1);
}
