import { spawnSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const hasYesFlag = process.argv.includes("--yes");
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "out");

const nextVersionedOutput = (): string => {
  mkdirSync(OUT_DIR, { recursive: true });

  for (let version = 1; version < 10000; version++) {
    const candidate = path.join(OUT_DIR, `final-${version}.mp4`);
    if (!existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("No available versioned render filename in out/");
};

if (!hasYesFlag) {
  console.error("Render blocked: review-first mode is enabled.");
  console.error("Open the timeline first: npm run dev");
  console.error("When approved, run: npm run render -- --yes");
  process.exit(1);
}

const outputPath = nextVersionedOutput();
const outputArg = path.relative(PROJECT_ROOT, outputPath).replace(/\\/g, "/");

console.log(`Rendering approved export to ${outputArg}`);

const result = spawnSync(
  "npx",
  ["remotion", "render", "src/index.ts", "MainComposition", outputArg, "--crf=18"],
  {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  }
);

if (typeof result.status === "number") {
  process.exit(result.status);
}

if (result.error) {
  console.error(result.error.message);
}

process.exit(1);
