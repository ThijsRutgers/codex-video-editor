import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";

type Word = { word: string; startMs: number; endMs: number };

type Overlay = {
  id: string;
  type: "year_stamp" | "person_label";
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
  overlays: Overlay[];
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const TRANSCRIPT_PATH = path.join(PROJECT_ROOT, "data", "transcript.json");
const STORYBOARD_PATH = path.join(PROJECT_ROOT, "data", "storyboard.json");
const VIDEO_PATH = path.join(PROJECT_ROOT, "public", "video.mp4");

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

const detectYearOverlays = (words: Word[], duration: number): Overlay[] => {
  const overlays: Overlay[] = [];
  const seenYears = new Set<string>();
  let lastStart = -Infinity;

  for (const word of words) {
    const year = word.word.replace(/[^0-9]/g, "");
    if (!/^(18|19|20)\d{2}$/.test(year) || seenYears.has(year)) {
      continue;
    }

    const startTime = Math.max(10, word.startMs / 1000);
    if (startTime - lastStart < 18) {
      continue;
    }

    overlays.push({
      id: `year-${year}`,
      type: "year_stamp",
      startTime: Math.min(startTime, Math.max(0, duration - 3.4)),
      duration: 3.2,
      content: { year },
      triggerWord: word.word,
    });
    seenYears.add(year);
    lastStart = startTime;

    if (overlays.length >= 5) {
      break;
    }
  }

  return overlays;
};

const buildStoryboard = (
  transcript: { words: Word[] },
  meta: { width: number; height: number; fps: number; duration: number },
  duration: number
): Storyboard => {
  const overlays = detectYearOverlays(transcript.words, duration);

  return {
    videoFile: "video.mp4",
    duration,
    fps: meta.fps,
    resolution: { width: meta.width, height: meta.height },
    videoType: "documentary",
    storySummary: "Documentary-style narrative scaffold for subtitles and an AI director pass.",
    overlays,
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
  const storyboard = buildStoryboard(transcript, meta, duration);

  writeFileSync(STORYBOARD_PATH, `${JSON.stringify(storyboard, null, 2)}\n`);
  console.log(`Generated ${STORYBOARD_PATH} with ${storyboard.overlays.length} overlays.`);
};

try {
  main();
} catch (error) {
  console.error(`❌ ${(error as Error).message}`);
  process.exit(1);
}
