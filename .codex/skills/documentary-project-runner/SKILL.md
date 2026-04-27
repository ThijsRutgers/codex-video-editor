---
name: documentary-project-runner
description: "Start and creatively edit a new documentary video project from a user-provided local video path. Use when the user asks to start a new project/new video, says 'Edit & use documentary skill, path is ...', mentions an input video path (for example /Users/.../video.mp4), and wants the full workflow handled by the agent: ingest video, run the preparation flow, then perform an AI director pass that improves the generated storyboard with custom Remotion animations, explanatory overlays, counters, timelines, labels, subtitles, and review stills. Stop at browser review unless the user explicitly asks to render."
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
- This must produce/update `data/transcript.json`, `data/storyboard.json`, overlays, and person cutouts.
4. Perform an AI director pass:
- Treat the generated storyboard as a scaffold, not the final edit.
- Read `data/transcript.json`, inspect `data/storyboard.json`, and sample the video with still frames around important transcript moments.
- Choose the edit that best explains the subject, even if that means replacing most generated overlays.
- Keep subtitles unless the user asks to remove them.
- Remove weak generic titles, chapter cards, or outro text when they do not add meaning.
- Add intentional explanatory overlays for moments that need a name, timeline, count, contrast, map, process, or visual metaphor.
- Prefer compact top-left/top-right cards when subtitles are active; avoid covering the speaker/action or lower subtitles.
- Use varied documentary devices where useful: concept/name cards, year or count stamps, counters, timeline beats, process chains, quote cards, location labels, person cutouts, compare/versus labels, and simple diagrams.
- Keep pacing restrained: for a 1-2 minute video, aim for about 4-8 strong visual explanation moments, spaced so the viewer can read them.
- If the repo lacks a needed overlay component, add a small reusable component rather than forcing the wrong existing overlay type.
5. Perform a custom Remotion animation pass when it would improve the edit:
- Use Remotion as a motion graphics system, not only an overlay renderer.
- Create or modify reusable React components in `src/components` and wire them into `src/compositions/MainComposition.tsx`.
- Build custom animation for ideas that deserve visual explanation: processes, cause/effect, scale, speed, timelines, comparisons, transformations, geography, people, events, and abstract forces.
- Use Remotion primitives intentionally: `Sequence` for timing, `useCurrentFrame` for frame-aware animation, `spring` and `interpolate` for motion, and SVG/CSS shapes for diagrams.
- Good custom devices include animated process chains, counters, year stamps, pressure/balance meters, split comparisons, callout arrows, timeline ticks, map pins, animated labels, and simple diagram builds.
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
- What was edited and why (cards, counters, diagrams, custom animations, person cutouts, pacing).
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
