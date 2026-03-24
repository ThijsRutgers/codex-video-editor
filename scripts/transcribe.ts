/**
 * Transcription script using @remotion/install-whisper-cpp
 *
 * Transcribes public/video.mp4 → data/transcript.json
 * with word-level timestamps for caption sync.
 *
 * Usage: npx tsx scripts/transcribe.ts
 *
 * Options via env vars:
 *   WHISPER_MODEL=medium (default) | small | large-v3
 *   WHISPER_LANG=auto (default) | en | nl | de | etc.
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const VIDEO_PATH = path.join(PROJECT_ROOT, "public", "video.mp4");
const AUDIO_PATH = path.join(PROJECT_ROOT, "public", "audio.wav");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data", "transcript.json");

const WHISPER_MODEL = process.env.WHISPER_MODEL || "medium";
const WHISPER_LANG = process.env.WHISPER_LANG || "auto";

async function main() {
  console.log("🎤 Starting transcription pipeline...\n");

  // 1. Check video exists
  if (!existsSync(VIDEO_PATH)) {
    console.error(`❌ Video not found at ${VIDEO_PATH}`);
    console.error("   Place your video as public/video.mp4");
    process.exit(1);
  }

  // 2. Ensure data/ directory exists
  const dataDir = path.join(PROJECT_ROOT, "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // 3. Extract audio as 16kHz WAV (required by Whisper)
  console.log("📼 Extracting audio from video...");
  try {
    execSync(
      `ffmpeg -y -i "${VIDEO_PATH}" -ar 16000 -ac 1 -c:a pcm_s16le "${AUDIO_PATH}"`,
      { stdio: "pipe" }
    );
    console.log("   ✓ Audio extracted to public/audio.wav\n");
  } catch (e) {
    console.error("❌ FFmpeg failed. Is ffmpeg installed?");
    console.error("   Install: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)");
    process.exit(1);
  }

  // 4. Install Whisper.cpp if needed
  console.log("🔧 Checking Whisper.cpp installation...");
  try {
    const {
      installWhisperCpp,
      downloadWhisperModel,
    } = await import("@remotion/install-whisper-cpp");

    const whisperDir = path.join(PROJECT_ROOT, "whisper.cpp");
    if (!existsSync(whisperDir)) {
      console.log("   Installing Whisper.cpp (first time only)...");
      await installWhisperCpp({ to: whisperDir, version: "1.5.5" });
      console.log("   ✓ Whisper.cpp installed\n");
    }

    // Download model if needed
    const modelDir = path.join(whisperDir, "models");
    console.log(`   Ensuring ${WHISPER_MODEL} model is available...`);
    await downloadWhisperModel({
      model: WHISPER_MODEL as any,
      folder: modelDir,
    });
    console.log(`   ✓ Model '${WHISPER_MODEL}' ready\n`);

    // 5. Transcribe
    console.log("🎙️ Transcribing audio (this may take a few minutes)...");
    const { transcribe, convertToCaptions } = await import(
      "@remotion/install-whisper-cpp"
    );

    const result = await transcribe({
      inputPath: AUDIO_PATH,
      whisperPath: whisperDir,
      whisperCppVersion: "1.5.5",
      model: WHISPER_MODEL as any,
      modelFolder: modelDir,
      tokenLevelTimestamps: true,
      printOutput: false,
      ...(WHISPER_LANG !== "auto" ? { language: WHISPER_LANG } : {}),
    });

    // 6. Format output
    console.log("📝 Formatting transcript...");

    const converted = convertToCaptions({
      transcription: result.transcription,
      combineTokensWithinMilliseconds: 180,
    });

    // Re-expand short caption chunks into word-level timings.
    const words: Array<{ word: string; startMs: number; endMs: number }> = [];
    let fullText = "";
    const lastOffsetMs =
      result.transcription[result.transcription.length - 1]?.offsets?.to ?? 0;

    for (let i = 0; i < converted.captions.length; i++) {
      const caption = converted.captions[i];
      const text = caption.text.replace(/\s+/g, " ").trim();
      if (!text) {
        continue;
      }

      const startMs = Math.max(0, Math.round(caption.startInSeconds * 1000));
      const nextStartMs =
        i < converted.captions.length - 1
          ? Math.round(converted.captions[i + 1].startInSeconds * 1000)
          : Math.max(startMs + 220, lastOffsetMs);

      const durationMs = Math.max(220, nextStartMs - startMs);
      const segmentWords = text.split(" ").filter((w) => w.length > 0);

      for (let wi = 0; wi < segmentWords.length; wi++) {
        const wordStart = startMs + Math.floor((durationMs * wi) / segmentWords.length);
        const wordEnd = startMs + Math.floor((durationMs * (wi + 1)) / segmentWords.length);
        words.push({
          word: segmentWords[wi],
          startMs: wordStart,
          endMs: Math.max(wordStart + 40, wordEnd),
        });
        fullText += `${segmentWords[wi]} `;
      }
    }

    const transcript = {
      videoFile: "video.mp4",
      model: WHISPER_MODEL,
      language: WHISPER_LANG,
      fullText: fullText.trim(),
      wordCount: words.length,
      words,
    };

    writeFileSync(OUTPUT_PATH, JSON.stringify(transcript, null, 2));

    console.log(`\n✅ Transcription complete!`);
    console.log(`   Words: ${words.length}`);
    console.log(`   Output: ${OUTPUT_PATH}`);
    console.log(`   Full text preview: "${fullText.trim().slice(0, 100)}..."`);
  } catch (e: any) {
    console.error("❌ Transcription failed:", e.message);
    console.error("\nTroubleshooting:");
    console.error("  1. Ensure @remotion/install-whisper-cpp is installed");
    console.error("  2. Try: WHISPER_MODEL=small npx tsx scripts/transcribe.ts");
    console.error("  3. Check that public/audio.wav is valid");
    process.exit(1);
  }
}

main();
