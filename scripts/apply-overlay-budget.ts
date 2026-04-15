import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

type OverlayType =
  | "opening_title"
  | "chapter_title"
  | "year_stamp"
  | "location_label"
  | "key_fact"
  | "quote_card"
  | "person_label"
  | "outro";

type Overlay = {
  id: string;
  type: OverlayType;
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
  maxTextMoments: number;
  minSpacingSec: number;
  sameTypeCooldownSec: number;
  maxSections: number;
  maxPersons: number;
  maxInfo: number;
  maxEmphasis: number;
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const STORYBOARD_PATH = path.join(PROJECT_ROOT, "data", "storyboard.json");

const profileForDuration = (durationSec: number): BudgetProfile => {
  const minutes = durationSec / 60;

  if (minutes >= 15) {
    return {
      maxTextMoments: 22,
      minSpacingSec: 24,
      sameTypeCooldownSec: 70,
      maxSections: 4,
      maxPersons: 5,
      maxInfo: 10,
      maxEmphasis: 3,
    };
  }

  if (minutes >= 10) {
    return {
      maxTextMoments: 16,
      minSpacingSec: 34,
      sameTypeCooldownSec: 70,
      maxSections: 4,
      maxPersons: 3,
      maxInfo: 7,
      maxEmphasis: 2,
    };
  }

  if (minutes >= 5) {
    return {
      maxTextMoments: 12,
      minSpacingSec: 24,
      sameTypeCooldownSec: 50,
      maxSections: 3,
      maxPersons: 2,
      maxInfo: 5,
      maxEmphasis: 1,
    };
  }

  return {
    maxTextMoments: 6,
    minSpacingSec: 14,
    sameTypeCooldownSec: 25,
    maxSections: 2,
    maxPersons: 2,
    maxInfo: 3,
    maxEmphasis: 1,
  };
};

const classify = (
  overlay: Overlay
): "fixed" | "section" | "person" | "info" | "emphasis" | "other" => {
  if (overlay.type === "opening_title" || overlay.type === "outro") {
    return "fixed";
  }
  if (overlay.type === "chapter_title") {
    return "section";
  }
  if (overlay.type === "person_label") {
    return "person";
  }
  if (overlay.type === "quote_card") {
    return "emphasis";
  }
  if (
    overlay.type === "year_stamp" ||
    overlay.type === "location_label" ||
    overlay.type === "key_fact"
  ) {
    return "info";
  }
  return "other";
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

  const fixed = overlays.filter((overlay) => classify(overlay) === "fixed");
  const candidates = overlays
    .filter((overlay) => classify(overlay) !== "fixed")
    .map((overlay) => {
      const bucket = classify(overlay);
      const minDuration = bucket === "info" || bucket === "emphasis" ? 2.5 : 1.8;
      return {
        ...overlay,
        duration: Math.max(minDuration, overlay.duration),
      };
    });

  const selected: Overlay[] = [];
  const lastTypeStart = new Map<OverlayType, number>();
  const counts = { section: 0, person: 0, info: 0, emphasis: 0 };

  const canPlace = (overlay: Overlay, spacingSec: number): boolean => {
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

    if (fixed.some((existing) => overlaps(existing, overlay))) {
      return false;
    }

    return true;
  };

  const place = (overlay: Overlay, bucket: "section" | "person" | "info" | "emphasis") => {
    selected.push(overlay);
    selected.sort((a, b) => a.startTime - b.startTime);
    lastTypeStart.set(overlay.type, overlay.startTime);
    counts[bucket] += 1;
  };

  const pickBucket = (
    bucket: "section" | "person" | "info" | "emphasis",
    limit: number,
    spacingSec: number
  ) => {
    const bucketOverlays = candidates.filter((overlay) => classify(overlay) === bucket);
    for (const overlay of bucketOverlays) {
      if (counts[bucket] >= limit || selected.length >= profile.maxTextMoments) {
        return;
      }

      if (canPlace(overlay, spacingSec)) {
        place(overlay, bucket);
      }
    }
  };

  const sectionSpacing = Math.max(profile.minSpacingSec, Math.min(170, duration / 9));
  const personSpacing = Math.max(profile.minSpacingSec + 12, 54);

  pickBucket("section", profile.maxSections, sectionSpacing);
  pickBucket("person", profile.maxPersons, personSpacing);
  pickBucket("emphasis", profile.maxEmphasis, profile.minSpacingSec);
  pickBucket("info", profile.maxInfo, profile.minSpacingSec);

  for (const overlay of candidates) {
    if (selected.length >= profile.maxTextMoments) {
      break;
    }

    const bucket = classify(overlay);
    if (bucket === "other") {
      continue;
    }

    if (selected.some((s) => s.id === overlay.id)) {
      continue;
    }

    if (bucket === "section" && counts.section >= profile.maxSections) {
      continue;
    }
    if (bucket === "person" && counts.person >= profile.maxPersons) {
      continue;
    }
    if (bucket === "info" && counts.info >= profile.maxInfo) {
      continue;
    }
    if (bucket === "emphasis" && counts.emphasis >= profile.maxEmphasis) {
      continue;
    }

    if (canPlace(overlay, profile.minSpacingSec)) {
      place(overlay, bucket);
    }
  }

  const nextOverlays = [...fixed, ...selected].sort((a, b) => a.startTime - b.startTime);
  storyboard.overlays = nextOverlays;
  (storyboard as Record<string, unknown>).editorialBudget = {
    appliedAt: new Date().toISOString(),
    profile,
    kept: {
      totalTextMoments: selected.length,
      sections: counts.section,
      people: counts.person,
      info: counts.info,
      emphasis: counts.emphasis,
    },
  };

  writeFileSync(STORYBOARD_PATH, `${JSON.stringify(storyboard, null, 2)}\n`);
  console.log(
    [
      `Applied overlay budget profile for ${(duration / 60).toFixed(1)} min video.`,
      `Overlays: ${overlays.length} -> ${nextOverlays.length}`,
      `Kept moments: section=${counts.section}, person=${counts.person}, info=${counts.info}, emphasis=${counts.emphasis}`,
    ].join("\n")
  );
};

try {
  main();
} catch (error) {
  console.error(`❌ ${(error as Error).message}`);
  process.exit(1);
}
