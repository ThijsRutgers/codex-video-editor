# Codex Video Editor Instructions

When the user says `Edit & use documentary skill, path is ...` or asks to use the documentary skill for a local video path, use the repository skill at `.codex/skills/documentary-project-runner/SKILL.md`.

That workflow means:
- Ingest the video and run the mechanical prep flow.
- Treat the generated storyboard as a scaffold, not the final edit.
- Perform the AI director pass and custom Remotion animation pass.
- Keep subtitles unless the user asks otherwise.
- Validate with still frames.
- Stop at review unless the user explicitly asks to render/export.
- When rendering/exporting, use safe versioned outputs only:
  `out/final-1.mp4`, `out/final-2.mp4`, etc. Never target or overwrite
  unversioned `out/final.mp4`.
