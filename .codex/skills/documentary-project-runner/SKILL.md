---
name: documentary-project-runner
description: "Start and creatively edit a new documentary video project from a user-provided local video path. Use when the user asks to start a new project/new video, says 'Edit & use documentary skill, path is ...', mentions an input video path (for example /Users/.../video.mp4), and wants the full workflow handled by the agent: ingest video, run the preparation flow, then perform an AI director pass with custom Remotion animation, subtitles, and review stills. Stop at browser review unless the user explicitly asks to render."
---

# Documentary Project Runner

Execute this workflow when the user asks to start or edit a documentary project from an input video path.

## Trigger Phrases

Treat messages like these as triggers:
- `start new project with /absolute/path/video.mp4`
- `nieuw project met: /absolute/path/video.mp4`
- `edit this documentary: /absolute/path/video.mp4`
- `Edit & use documentary skill, path is /absolute/path/video.mp4`
- `Edit and use documentary skill, path is /absolute/path/video.mp4`

If multiple paths are present, use the first valid local video path unless the user specifies otherwise.

## Workflow

1. Validate input path exists and is readable.
2. Set project input video:
- Copy input video to `public/video.mp4`.
- Run `ffprobe` to confirm duration/fps/resolution.
3. Run the mechanical prep flow:
- Run `npm run prepare:review`.
- This must produce/update `data/transcript.json`, `data/storyboard.json`, subtitle timing, and any factual year/name or person-cutout hints that the scripts can safely infer.
4. Perform an AI director pass:
- Treat the generated storyboard as a scaffold, not the final edit.
- Read `data/transcript.json`, inspect `data/storyboard.json`, and sample the video with still frames around important transcript moments.
- Choose the edit that best explains the subject, even if that means replacing most generated overlays.
- Keep subtitles unless the user asks to remove them.
- Do not add or keep an opening video-title card. Do not add chapter or section-title cards. Remove any generated title, chapter, section, or outro text unless the user explicitly asks for it.
- The mechanical setup is fixed, but the creative edit is not. Before choosing animations, make a video-specific director pass from the transcript and sampled frames: identify the unique argument, tone, visual material, and the few moments where animation actually clarifies this specific video.
- The only reusable edit rules are:
  - Subtitles stay on unless the user asks to remove them.
  - Explanatory animation uses a 50/50 split scene, but never in the first 5-10 seconds. Let the opening breathe with the source video and subtitles.
  - In split scenes, one half is the source video and the other half is a full-height Remotion canvas. The format can repeat; the animation content, structure, labels, motion, and visual metaphor must be invented for the current video.
  - Compact cards are only for factual years/dates and names when they genuinely help. Do not use compact cards for abstract explanation.
  - Person cutouts and person images may be used when they fit the story, including fetched/enriched images through the repo's RapidAPI/person-image flow.
- Everything else is creatively open. Do not use the skill as a menu of prepared animation types. Pick timing, layout rhythm, graphic language, color accents, motion style, and visual metaphors from the current video.
- Keep pacing restrained and do not overdecorate the video. Remove generic or redundant overlays even if the generator created them.
- If the repo lacks a needed animation, add or adapt a component for this video rather than forcing an existing component to fit.
5. Perform a custom Remotion animation pass when it would improve the edit:
- Use Remotion as a motion graphics system, not only an overlay renderer.
- Create or modify reusable React components in `src/components` and wire them into `src/compositions/MainComposition.tsx`.
- For each custom 50/50 split, create a video-specific storyboard type, register that type in `CUSTOM_SPLIT_OVERLAY_TYPES`, and add the matching render branch in `MainComposition.tsx`.
- Build custom animation only for ideas that deserve visual explanation in this video.
- Existing components may be reused only as raw building blocks when they genuinely fit; otherwise adapt them or create a new component with timing, labels, spatial design, and motion specific to this video.
- Avoid repeating the same visual sequence across projects. If a proposed animation could be dropped into a different video unchanged, redesign it.
- Use Remotion primitives intentionally: `Sequence` for timing, `useCurrentFrame` for frame-aware animation, `spring` and `interpolate` for motion, and SVG/CSS shapes for diagrams.
- Do not accept generic overlays when a custom animation would materially explain the idea better.
- Keep custom animations readable and purposeful; every motion element should clarify the script or heighten a key beat.
6. Validate the edit:
- Render still frames for the opening, at least two overlay moments, and one late-video moment.
- Check that subtitles remain visible, overlay text is readable, and no card/title blocks key action.
- Iterate on `data/storyboard.json` and components until the review frames look intentional.
7. Keep review-first behavior:
- Do not auto-render final video.
- Start or keep the review server available when useful.
8. Report completion with:
- What was edited and why (timing, split scenes, custom animation choices, factual cards or person cutouts if used, pacing).
- Where outputs are (`data/storyboard.json`, `public/assets/people`, optional review frames).
- Exact review command and URL (`npm run dev`, `http://localhost:3000/MainComposition`).

## Render Policy

Only render when the user explicitly asks to render.
- Use: `npm run render -- --yes`
- Or: `npm run render:approved`
- Approved renders must use safe versioned output names.
- Never render to or overwrite unversioned `out/final.mp4`.
- The render script should export to the next available `out/final-N.mp4`
  path, such as `out/final-1.mp4`, `out/final-2.mp4`, and so on.

## Fallback

If `npm run project:new -- "<path>"` exists in the repository, prefer that one-command entrypoint.
If not, run the steps manually from this skill.
