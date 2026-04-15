import { copyFileSync, existsSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const TARGET_VIDEO = path.join(PROJECT_ROOT, "public", "video.mp4");

const usage = () => {
  console.log('Usage: npx tsx scripts/new-project.ts "/absolute/path/to/video.mp4"');
};

const run = (cmd: string, args: string[]): void => {
  const result = spawnSync(cmd, args, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: process.env,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with exit code ${result.status}`);
  }
};

const main = () => {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    usage();
    process.exit(1);
  }

  const sourceVideo = path.resolve(input);
  if (!existsSync(sourceVideo)) {
    throw new Error(`Input video not found: ${sourceVideo}`);
  }

  copyFileSync(sourceVideo, TARGET_VIDEO);
  console.log(`Copied source video to ${TARGET_VIDEO}`);

  run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-show_entries",
    "stream=width,height,r_frame_rate",
    "-of",
    "default=noprint_wrappers=1",
    TARGET_VIDEO,
  ]);

  run("npm", ["run", "prepare:review"]);

  console.log("\nProject prepared. Review with:");
  console.log("npm run dev");
  console.log("Then open: http://localhost:3000/MainComposition");
};

try {
  main();
} catch (error) {
  console.error(`❌ ${(error as Error).message}`);
  process.exit(1);
}
