# Codex Video Editor Instructions

This repository is also distributed as **Fantasie Editor**, a Codex-native
open-source video editing workspace for non-technical users.

## First-run onboarding

When the user says any of the following:
- `Install Fantasie Editor`
- `Installeer Fantasie Editor`
- `Help me install Fantasie Editor`
- `Start Fantasie Editor`
- or opens the project via `Start Fantasie Editor.command` / `Start Fantasie Editor.bat`

act as the installation assistant. Your job is to help the user until the
editor works on their computer.

First run:

```bash
npm run doctor
```

If `npm run doctor` fails:
- Detect the operating system from the shell/environment.
- Explain the problem in simple non-technical language.
- Fix one issue at a time.
- Prefer safe, standard install paths:
  - macOS: Node.js installer or Homebrew, ffmpeg via `brew install ffmpeg`.
  - Windows: Node.js installer, ffmpeg via `winget install Gyan.FFmpeg`.
- Re-run `npm run doctor` after each fix.
- Do not assume `setup.sh` always works. Treat it as a shortcut, not the only path.
- Continue until `npm run doctor` passes or the user chooses to stop.

When `npm run doctor` passes, tell the user they can drag a video into the chat
or paste the local file path, then use the documentary editing workflow below.

Keep onboarding calm and simple. The user may be non-technical; translate errors
into concrete next steps.

## Editing workflow

When the user says `Edit & use documentary skill, path is ...` or asks to use the documentary skill for a local video path, use the repository skill at `.codex/skills/documentary-project-runner/SKILL.md`.

That workflow means:
- Ingest the video and run the mechanical prep flow.
- Treat the generated storyboard as a scaffold, not the final edit.
- Perform the AI director pass and custom Remotion animation pass.
- Do not add or keep an opening video-title card. Do not add chapter or section
  title cards. Remove generated title, chapter, section, or outro text unless
  the user explicitly asks for it.
- The setup flow is fixed; the creative edit is not. Animations must be chosen
  from the transcript and sampled frames for the current video, not copied as a
  standard sequence from the skill or from a previous project.
- The reusable side rules are: keep subtitles unless asked otherwise; use 50/50
  split scenes for explanatory animation, but not in the first 5-10 seconds; use
  the non-video half as a full-height Remotion canvas; reserve compact cards for
  factual years/dates and names; use person cutouts/images only when they fit.
  The content of each animation must be invented for the current video.
- For custom 50/50 animation, add a video-specific storyboard type, register it
  in `CUSTOM_SPLIT_OVERLAY_TYPES`, and wire its render branch in
  `src/compositions/MainComposition.tsx`.
- Keep subtitles unless the user asks otherwise.
- Validate with still frames.
- Stop at review unless the user explicitly asks to render/export.
- When rendering/exporting, use safe versioned outputs only:
  `out/final-1.mp4`, `out/final-2.mp4`, etc. Never target or overwrite
  unversioned `out/final.mp4`.
