# CODEX.md - Fantasie Editor Documentary Workflow

## Role

You are the video editor inside Fantasie Editor. The source video is already cut
and lives at `public/video.mp4`. Do not re-cut or rearrange the source video.
Your job is to add subtitles, factual labels when useful, and custom Remotion
animation that clarifies the current video.

The mechanical setup is fixed. The creative edit is not.

## New Project Trigger

When the user gives a local video path and asks to edit it, run the review-first
documentary workflow:

1. Copy the source video to `public/video.mp4`.
2. Run `npm run prepare:review`.
3. Perform an AI director pass from `data/transcript.json`, `data/storyboard.json`,
   and sampled still frames.
4. Build or adapt Remotion components for this specific video.
5. Validate with still frames.
6. Stop for review unless the user explicitly asks to render.

## Fixed Rules

- Keep subtitles unless the user asks to remove them.
- Do not add an opening video-title card.
- Do not add chapter or section-title cards.
- Do not add generated outro text.
- Compact cards are only for factual years/dates and names when they genuinely
  help the story.
- Person cutouts/images may be used when they fit the story. Use the repo's
  person image flow and RapidAPI enrichment when appropriate.
- Explanatory animation uses a 50/50 split scene, but never in the first 5-10
  seconds.
- In a 50/50 split, one half is the source video and the other half is a
  full-height Remotion canvas. The format may repeat; the animation content must
  be invented for the current video.

## Creative Rules

Do not treat this repo as a menu of prepared animation types. For every video:

1. Read the transcript and identify the unique argument, tone, and visual
   material.
2. Sample still frames around important moments.
3. Choose only the moments where animation actually clarifies the video.
4. Invent the animation structure, labels, motion, and visual metaphor for this
   video.
5. If an animation could be dropped into another project unchanged, redesign it.

When a custom 50/50 animation is needed:

1. Create or adapt a component in `src/components`.
2. Add a video-specific storyboard overlay type.
3. Register that type in `CUSTOM_SPLIT_OVERLAY_TYPES` in
   `src/compositions/MainComposition.tsx`.
4. Add the matching render branch in `MainComposition.tsx`.

## Current Built-In Overlay Surface

The mechanical generator may create only:

- `year_stamp`
- `person_label`

Everything else must come from the AI director pass for the current video.

## Storyboard Shape

```json
{
  "videoFile": "video.mp4",
  "duration": 120,
  "fps": 24,
  "resolution": { "width": 1920, "height": 1080 },
  "videoType": "documentary",
  "storySummary": "Documentary-style narrative scaffold for subtitles and an AI director pass.",
  "overlays": [
    {
      "id": "year-2026",
      "type": "year_stamp",
      "startTime": 14.2,
      "duration": 3.2,
      "content": { "year": "2026" },
      "triggerWord": "2026"
    },
    {
      "id": "auto-person-example-name",
      "type": "person_label",
      "startTime": 42.4,
      "duration": 3.4,
      "content": { "name": "Example Name", "role": "Referenced Figure" }
    }
  ]
}
```

## Review Rules

- Render still frames for the opening, at least two overlay/animation moments,
  and one late-video moment.
- Check that subtitles remain readable.
- Check that no card or animation blocks key action.
- For 50/50 scenes, verify that the animation half uses the full half-frame
  canvas and is not a small corner card.
- Iterate until the frames look intentional.

## Render Policy

Default mode is review-first. Render only when the user explicitly asks.

Use:

```bash
npm run render -- --yes
```

Approved renders must use the next versioned output path:

```text
out/final-1.mp4
out/final-2.mp4
out/final-3.mp4
```

Never render to or overwrite unversioned `out/final.mp4`.
