import { spawnSync } from "child_process";

const hasYesFlag = process.argv.includes("--yes");

if (!hasYesFlag) {
  console.error("Render blocked: review-first mode is enabled.");
  console.error("Open the timeline first: npm run dev");
  console.error("When approved, run: npm run render -- --yes");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["remotion", "render", "src/index.ts", "MainComposition", "out/final.mp4", "--crf=18"],
  {
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
