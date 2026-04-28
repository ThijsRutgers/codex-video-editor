#!/usr/bin/env node

import {existsSync, mkdirSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {spawnSync} from "node:child_process";

const root = process.cwd();
const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";
const checks = [];

const add = (status, label, detail = "", fix = "") => {
  checks.push({status, label, detail, fix});
};

const commandExists = (command) => {
  const probe = isWindows ? "where" : "command";
  const args = isWindows ? [command] : ["-v", command];
  const result = spawnSync(probe, args, {stdio: "ignore", shell: !isWindows});
  return result.status === 0;
};

const run = (command, args) =>
  spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });

const semverMajor = (version) => {
  const match = String(version).match(/v?(\d+)/);
  return match ? Number(match[1]) : 0;
};

const installHints = {
  node: isMac
    ? "Install Node.js 20+ from https://nodejs.org, or with Homebrew: brew install node"
    : isWindows
      ? "Install Node.js 20+ from https://nodejs.org, then reopen Codex or your terminal."
      : "Install Node.js 20+ with your package manager, nvm, or https://nodejs.org.",
  ffmpeg: isMac
    ? "Install ffmpeg with Homebrew: brew install ffmpeg"
    : isWindows
      ? "Install ffmpeg with winget: winget install Gyan.FFmpeg, then reopen Codex or your terminal."
      : "Install ffmpeg with your package manager, for example: sudo apt install ffmpeg",
  codex:
    "Install Codex first, then open this project folder in Codex. See the README for the first-start flow.",
};

console.log("");
console.log("Fantasie Editor doctor");
console.log("======================");
console.log("");
console.log(`Project: ${root}`);
console.log(`System:  ${process.platform} ${process.arch}`);
console.log("");

if (!existsSync(join(root, "package.json"))) {
  add("fail", "Project folder", "package.json was not found here.", "Open Codex in the Fantasie Editor project folder.");
} else {
  add("pass", "Project folder", "package.json found.");
}

const nodeVersion = process.version;
if (semverMajor(nodeVersion) >= 18) {
  add("pass", "Node.js", nodeVersion);
} else {
  add("fail", "Node.js", `${nodeVersion} is too old. Node.js 18+ is required.`, installHints.node);
}

if (commandExists("npm")) {
  const npm = run("npm", ["--version"]);
  add("pass", "npm", npm.stdout.trim() || "found");
} else {
  add("fail", "npm", "npm was not found.", installHints.node);
}

if (commandExists("codex")) {
  const codex = run("codex", ["--version"]);
  add("pass", "Codex", codex.stdout.trim() || "found");
} else {
  add("warn", "Codex", "The codex command was not found in this shell.", installHints.codex);
}

if (commandExists("ffmpeg")) {
  const ffmpeg = run("ffmpeg", ["-version"]);
  const firstLine = (ffmpeg.stdout || ffmpeg.stderr).split("\n")[0]?.trim() || "found";
  add("pass", "ffmpeg", firstLine);
} else {
  add("fail", "ffmpeg", "ffmpeg was not found.", installHints.ffmpeg);
}

if (existsSync(join(root, "node_modules"))) {
  add("pass", "Dependencies", "node_modules found.");
} else {
  add("fail", "Dependencies", "node_modules is missing.", "Run: npm install");
}

const remotionBin = isWindows
  ? join(root, "node_modules", ".bin", "remotion.cmd")
  : join(root, "node_modules", ".bin", "remotion");
if (existsSync(remotionBin)) {
  add("pass", "Remotion", "local Remotion binary found.");
} else {
  add("fail", "Remotion", "Remotion is not installed yet.", "Run: npm install");
}

for (const dir of ["public", "public/assets", "data", "review-frames", "out"]) {
  const fullPath = join(root, dir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, {recursive: true});
    add("pass", dir, "created.");
  } else {
    add("pass", dir, "found.");
  }
}

if (existsSync(join(root, "public", "video.mp4"))) {
  add("pass", "Source video", "public/video.mp4 found.");
} else {
  add("warn", "Source video", "No video has been imported yet.", "Drag a video into Codex or paste its file path when you are ready to edit.");
}

if (existsSync(join(root, ".codex", "skills", "documentary-project-runner", "SKILL.md"))) {
  add("pass", "Documentary skill", "found.");
} else {
  add("fail", "Documentary skill", "The Fantasie Editor Codex skill is missing.", "Re-download the full Fantasie Editor folder or clone the repository again.");
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
for (const script of ["doctor", "project:new", "prepare:review", "review", "render"]) {
  if (packageJson.scripts?.[script]) {
    add("pass", `npm script: ${script}`, packageJson.scripts[script]);
  } else {
    add("fail", `npm script: ${script}`, "missing from package.json", "Re-download the full Fantasie Editor folder or restore package.json.");
  }
}

const icon = {
  pass: "[OK]",
  warn: "[!]",
  fail: "[X]",
};

for (const check of checks) {
  console.log(`${icon[check.status]} ${check.label}`);
  if (check.detail) console.log(`     ${check.detail}`);
  if (check.fix) console.log(`     Fix: ${check.fix}`);
}

const failures = checks.filter((check) => check.status === "fail");
const warnings = checks.filter((check) => check.status === "warn");

console.log("");
if (failures.length === 0) {
  console.log("Ready: Fantasie Editor can run on this computer.");
  if (warnings.length > 0) {
    console.log("There are warnings, but they do not block editing.");
  }
  console.log("");
  console.log("Next:");
  console.log("  1. Paste or drag a video path into Codex.");
  console.log("  2. Ask: Edit this video with Fantasie Editor.");
  console.log("");
  process.exit(0);
}

console.log("Not ready yet.");
console.log("Ask Codex: Help me install Fantasie Editor until npm run doctor passes.");
console.log("");
process.exit(1);
