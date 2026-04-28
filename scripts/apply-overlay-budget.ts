import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

type OverlayType = "year_stamp" | "person_label";

type Overlay = {
  id: string;
  type: string;
  startTime: number;
  duration: number;
  content: Record<string, unknown>;
  triggerWord?: string;
};

type Storyboard = {
  duration?: number;
  overlays: Overlay[];
  [key: string]: unknown;
};

type BudgetProfile = {
  minSpacingSec: number;
  sameTypeCooldownSec: number;
  maxFactualMoments: number;
  maxYears: number;
  maxPersons: number;
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const STORYBOARD_PATH = path.join(PROJECT_ROOT, "data", "storyboard.json");

const profileForDuration = (durationSec: number): BudgetProfile => {
  const minutes = durationSec / 60;

  if (minutes >= 15) {
    return {
      minSpacingSec: 24,
      sameTypeCooldownSec: 70,
      maxFactualMoments: 15,
      maxYears: 10,
      maxPersons: 5,
    };
  }

  if (minutes >= 10) {
    return {
      minSpacingSec: 34,
      sameTypeCooldownSec: 70,
      maxFactualMoments: 10,
      maxYears: 7,
      maxPersons: 3,
    };
  }

  if (minutes >= 5) {
    return {
      minSpacingSec: 24,
      sameTypeCooldownSec: 50,
      maxFactualMoments: 7,
      maxYears: 5,
      maxPersons: 2,
    };
  }

  return {
    minSpacingSec: 14,
    sameTypeCooldownSec: 25,
    maxFactualMoments: 4,
    maxYears: 3,
    maxPersons: 2,
  };
};

const isBudgetedOverlay = (overlay: Overlay): overlay is Overlay & { type: OverlayType } => {
  return overlay.type === "year_stamp" || overlay.type === "person_label";
};

const classify = (overlay: Overlay & { type: OverlayType }): "year" | "person" => {
  return overlay.type === "person_label" ? "person" : "year";
};

const overlaps = (a: Overlay, b: Overlay): boolean => {
  const aEnd = a.startTime + a.duration;
  const bEnd = b.startTime + b.duration;
  return a.startTime < bEnd && aEnd > b.startTime;
};

const main = () => {
  if (!existsSync(STORYBOARD_PATH)) {
    throw new Error("Missing data/storyboard.json");
  }

  const storyboard = JSON.parse(readFileSync(STORYBOARD_PATH, "utf8")) as Storyboard;
  const overlays = [...(storyboard.overlays ?? [])].sort((a, b) => a.startTime - b.startTime);
  const duration = Number(storyboard.duration ?? 0);
  const profile = profileForDuration(duration);

  const candidates = overlays
    .filter(isBudgetedOverlay)
    .map((overlay) => ({
      ...overlay,
      duration: Math.max(overlay.type === "person_label" ? 3.2 : 2.5, overlay.duration),
    }));
  const droppedNonFactual = overlays.length - candidates.length;

  const selected: Array<Overlay & { type: OverlayType }> = [];
  const lastTypeStart = new Map<OverlayType, number>();
  const counts = { year: 0, person: 0 };

  const canPlace = (overlay: Overlay & { type: OverlayType }, spacingSec: number): boolean => {
    if (selected.some((existing) => Math.abs(existing.startTime - overlay.startTime) < spacingSec)) {
      return false;
    }

    const lastSameType = lastTypeStart.get(overlay.type);
    if (
      lastSameType !== undefined &&
      overlay.startTime - lastSameType < profile.sameTypeCooldownSec
    ) {
      return false;
    }

    if (selected.some((existing) => overlaps(existing, overlay))) {
      return false;
    }

    return true;
  };

  const place = (overlay: Overlay & { type: OverlayType }, bucket: "year" | "person") => {
    selected.push(overlay);
    selected.sort((a, b) => a.startTime - b.startTime);
    lastTypeStart.set(overlay.type, overlay.startTime);
    counts[bucket] += 1;
  };

  const pickBucket = (bucket: "year" | "person", limit: number, spacingSec: number) => {
    const bucketOverlays = candidates.filter((overlay) => classify(overlay) === bucket);
    for (const overlay of bucketOverlays) {
      if (counts[bucket] >= limit || selected.length >= profile.maxFactualMoments) {
        return;
      }

      if (canPlace(overlay, spacingSec)) {
        place(overlay, bucket);
      }
    }
  };

  const personSpacing = Math.max(profile.minSpacingSec + 12, 54);

  pickBucket("person", profile.maxPersons, personSpacing);
  pickBucket("year", profile.maxYears, profile.minSpacingSec);

  for (const overlay of candidates) {
    if (selected.length >= profile.maxFactualMoments) {
      break;
    }

    const bucket = classify(overlay);

    if (selected.some((s) => s.id === overlay.id)) {
      continue;
    }

    if (bucket === "person" && counts.person >= profile.maxPersons) {
      continue;
    }
    if (bucket === "year" && counts.year >= profile.maxYears) {
      continue;
    }

    if (canPlace(overlay, profile.minSpacingSec)) {
      place(overlay, bucket);
    }
  }

  const nextOverlays = [...selected].sort((a, b) => a.startTime - b.startTime);
  storyboard.overlays = nextOverlays;
  (storyboard as Record<string, unknown>).editorialBudget = {
    appliedAt: new Date().toISOString(),
    profile,
    kept: {
      factualMoments: selected.length,
      years: counts.year,
      people: counts.person,
      droppedNonFactual,
    },
  };

  writeFileSync(STORYBOARD_PATH, `${JSON.stringify(storyboard, null, 2)}\n`);
  console.log(
    [
      `Applied overlay budget profile for ${(duration / 60).toFixed(1)} min video.`,
      `Overlays: ${overlays.length} -> ${nextOverlays.length}`,
      `Kept moments: year=${counts.year}, person=${counts.person}`,
      droppedNonFactual > 0 ? `Dropped non-factual prep overlays: ${droppedNonFactual}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  );
};

try {
  main();
} catch (error) {
  console.error(`❌ ${(error as Error).message}`);
  process.exit(1);
}
