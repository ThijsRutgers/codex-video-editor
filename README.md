# Fantasie Editor

Fantasie Editor is an open-source video editing workspace powered by Codex and
Remotion. You do not edit with a complicated timeline. You talk to Codex, and
Codex prepares captions, documentary overlays, preview frames, and final renders.

The idea is simple:

```text
Install Codex once.
Download Fantasie Editor.
Open the project.
Ask Codex to install it and help until it works.
Then edit by talking.
```

## Start Here

### 1. Install Codex

Install Codex first. After Codex works on your laptop, continue below.

### 2. Download Fantasie Editor

Download this repository or clone it with Git.

If you are non-technical, downloading the ZIP from GitHub is fine.

### 3. Open Fantasie Editor

On macOS, double-click:

```text
Start Fantasie Editor.command
```

On Windows, double-click:

```text
Start Fantasie Editor.bat
```

If double-clicking does not work, open the folder in Codex and say:

```text
Install Fantasie Editor and help me until it works.
```

Codex will check your computer and help you install anything that is missing.

## First Chat

The first chat should feel like this:

```text
Welcome to Fantasie Editor.

I will first check if this computer is ready.
Then you can drag a video into the chat or paste its file path.
```

Codex runs:

```bash
npm run doctor
```

The doctor checks:

- Node.js
- npm
- Codex command
- ffmpeg
- project dependencies
- Remotion
- required folders
- Fantasie Editor skill files

If something is missing, Codex explains it and helps you fix one thing at a time.

## Editing A Video

After the doctor passes, paste a video path into Codex:

```text
Edit this video with Fantasie Editor: /Users/me/Downloads/my-video.mp4
```

Or use the direct documentary workflow:

```text
Edit & use documentary skill, path is /Users/me/Downloads/my-video.mp4
```

Codex will:

1. Import the video.
2. Transcribe the voiceover.
3. Create a storyboard.
4. Add captions and restrained documentary overlays.
5. Use larger 50/50 split animations when helpful.
6. Validate with still frames.
7. Stop for review.

Final rendering only happens when you explicitly ask for it.

## Render Safety

Fantasie Editor never writes to an unversioned `out/final.mp4`.

Approved exports are versioned:

```text
out/final-1.mp4
out/final-2.mp4
out/final-3.mp4
```

## Useful Commands

You usually do not need these manually. Codex can run them for you.

```bash
npm run doctor          # check whether the computer is ready
npm install             # install project dependencies
npm run prepare:review  # transcript + storyboard + overlays
npm run review          # open Remotion Studio
npm run render -- --yes # render a versioned final video
```

## If Setup Fails

That is okay. Fantasie Editor is designed for Codex to help.

Open the folder in Codex and say:

```text
Help me install Fantasie Editor until npm run doctor passes.
```

Codex should diagnose the laptop, explain the issue in plain language, and keep
going until the editor is ready.

## What This Is

Fantasie Editor is not a traditional one-click app yet. It is a Codex-native
creative workspace:

- Codex is the assistant and installer.
- Remotion is the video engine.
- This repository contains the editing workflow, components, and project rules.

That makes it open, hackable, and teachable while still being usable by people
who do not want to live in the terminal.

## License Notes

This project can be open source, but Remotion has its own license terms.
Check the Remotion license before using this commercially or inside a larger
company.
