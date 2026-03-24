import React, { useMemo } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInterFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlayfairFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadJetBrainsMonoFont } from "@remotion/google-fonts/JetBrainsMono";
import {
  AnimatedCaptions,
  KeyFact,
  LocationLabel,
  LogoOutro,
  OpeningTitle,
  PersonLabel,
  QuoteCard,
  SectionTitle,
  YearStamp,
  type CaptionWord,
} from "../components";
import storyboardData from "../../data/storyboard.json";
import transcriptData from "../../data/transcript.json";

loadInterFont("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });
loadPlayfairFont("normal", { weights: ["700"], subsets: ["latin"] });
loadPlayfairFont("italic", { weights: ["500"], subsets: ["latin"] });
loadJetBrainsMonoFont("normal", { weights: ["700"], subsets: ["latin"] });

type OverlayType =
  | "opening_title"
  | "chapter_title"
  | "year_stamp"
  | "location_label"
  | "key_fact"
  | "quote_card"
  | "person_label"
  | "outro";

type StoryboardOverlay = {
  id: string;
  type: OverlayType;
  startTime: number;
  duration: number;
  content: Record<string, unknown>;
};

const toFrame = (seconds: number, fps: number): number => {
  return Math.max(0, Math.round(seconds * fps));
};

const cleanCaptions = (words: CaptionWord[]): CaptionWord[] => {
  return words
    .map((word) => ({
      word: (word.word ?? "").trim(),
      startMs: Number(word.startMs),
      endMs: Number(word.endMs),
    }))
    .filter((word) => {
      if (!word.word) {
        return false;
      }

      if (word.endMs <= word.startMs) {
        return false;
      }

      if (/^[,.;!?]$/.test(word.word)) {
        return false;
      }

      return true;
    });
};

export const MainComposition: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const overlays = useMemo(() => {
    return [...(storyboardData.overlays as StoryboardOverlay[])].sort(
      (a, b) => a.startTime - b.startTime
    );
  }, []);

  const captionWords = useMemo(() => {
    return cleanCaptions(transcriptData.words as CaptionWord[]);
  }, []);

  const isLowerThirdBusy = useMemo(() => {
    return overlays.some((overlay) => {
      if (overlay.type !== "location_label" && overlay.type !== "person_label") {
        return false;
      }

      const from = toFrame(overlay.startTime, fps);
      const to = from + toFrame(overlay.duration, fps);
      return frame >= from && frame < to;
    });
  }, [frame, fps, overlays]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile("video.mp4")}
        style={{
          width,
          height,
          objectFit: "cover",
        }}
      />

      {overlays.map((overlay) => {
        const from = toFrame(overlay.startTime, fps);
        const durationInFrames = Math.max(1, toFrame(overlay.duration, fps));

        return (
          <Sequence key={overlay.id} from={from} durationInFrames={durationInFrames}>
            {overlay.type === "opening_title" ? (
              <OpeningTitle
                title={String(overlay.content.title ?? "")}
                subtitle={String(overlay.content.subtitle ?? "") || undefined}
              />
            ) : null}

            {overlay.type === "chapter_title" ? (
              <SectionTitle title={String(overlay.content.title ?? "")} />
            ) : null}

            {overlay.type === "year_stamp" ? (
              <YearStamp
                year={String(overlay.content.year ?? "")}
                detail={String(overlay.content.detail ?? "") || undefined}
              />
            ) : null}

            {overlay.type === "location_label" ? (
              <LocationLabel
                location={String(overlay.content.location ?? "")}
                qualifier={String(overlay.content.qualifier ?? "") || undefined}
              />
            ) : null}

            {overlay.type === "key_fact" ? (
              <KeyFact
                value={String(overlay.content.value ?? "")}
                context={String(overlay.content.context ?? "")}
              />
            ) : null}

            {overlay.type === "quote_card" ? (
              <QuoteCard
                quote={String(overlay.content.quote ?? "")}
                attribution={String(overlay.content.attribution ?? "")}
                year={String(overlay.content.year ?? "") || undefined}
              />
            ) : null}

            {overlay.type === "person_label" ? (
              <PersonLabel
                name={String(overlay.content.name ?? "")}
                role={String(overlay.content.role ?? "")}
              />
            ) : null}

            {overlay.type === "outro" ? (
              <LogoOutro
                logoSrc={overlay.content.hasLogo ? "assets/logo.png" : undefined}
                websiteUrl={
                  overlay.content.websiteUrl
                    ? String(overlay.content.websiteUrl)
                    : undefined
                }
              />
            ) : null}
          </Sequence>
        );
      })}

      <AnimatedCaptions
        words={captionWords}
        highlightColor="#D4A853"
        inactiveColor="#F0EDE6"
        maxWordsPerPage={5}
        fontSize={40}
        bottom={isLowerThirdBusy ? "22%" : "15%"}
      />
    </AbsoluteFill>
  );
};
