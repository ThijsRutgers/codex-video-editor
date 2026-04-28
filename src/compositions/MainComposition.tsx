import React, { useMemo } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInterFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlayfairFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadJetBrainsMonoFont } from "@remotion/google-fonts/JetBrainsMono";
import {
  AnimatedCaptions,
  ExplainerCard,
  KeyFact,
  KeepAwayChain,
  LocationLabel,
  LogoOutro,
  MotivationMap,
  OpeningTitle,
  PersonLabel,
  QuoteCard,
  ResponseReframe,
  RewardLoop,
  ScentBridge,
  SectionTitle,
  StimulationMeter,
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
  | "explainer_card"
  | "person_label"
  | "outro"
  | "motivation_map"
  | "scent_bridge"
  | "reward_loop"
  | "stimulation_meter"
  | "keepaway_chain"
  | "response_reframe";

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

const SPLIT_TRANSITION_FRAMES = 18;
const SPLIT_BACKDROP_BLUR = 34;

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

const asStringList = (value: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const result = value.map((item) => String(item)).filter(Boolean);
  return result.length > 0 ? result : fallback;
};

const asMeters = (
  value: unknown,
  fallback: Array<{ label: string; value: number }>
): Array<{ label: string; value: number }> => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const result = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      return {
        label: String(record.label ?? ""),
        value: Number(record.value ?? 0),
      };
    })
    .filter((item): item is { label: string; value: number } => {
      return !!item && !!item.label && Number.isFinite(item.value);
    });

  return result.length > 0 ? result : fallback;
};

const isSplitOverlay = (overlay: StoryboardOverlay): boolean => {
  return overlay.content.layout === "split";
};

const getGraphicSide = (overlay: StoryboardOverlay): "left" | "right" => {
  return overlay.content.side === "left" ? "left" : "right";
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

  const activeSplit = useMemo(() => {
    return overlays.find((overlay) => {
      if (!isSplitOverlay(overlay)) {
        return false;
      }

      const from = toFrame(overlay.startTime, fps);
      const to = from + toFrame(overlay.duration, fps);
      return frame >= from && frame < to;
    });
  }, [fps, frame, overlays]);

  const splitProgress = useMemo(() => {
    if (!activeSplit) {
      return 0;
    }

    const from = toFrame(activeSplit.startTime, fps);
    const to = from + toFrame(activeSplit.duration, fps);

    return interpolate(
      frame,
      [
        from,
        from + SPLIT_TRANSITION_FRAMES,
        Math.max(from + SPLIT_TRANSITION_FRAMES + 1, to - SPLIT_TRANSITION_FRAMES),
        to,
      ],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }, [activeSplit, fps, frame]);

  const graphicSide = activeSplit ? getGraphicSide(activeSplit) : "right";
  const videoSide = graphicSide === "left" ? "right" : "left";
  const videoLeft = splitProgress * (videoSide === "right" ? width / 2 : 0);
  const videoWidth = width - splitProgress * (width / 2);
  const graphicBackdropLeft = graphicSide === "right" ? width / 2 : 0;

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
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(135deg, #050609 0%, #0d1016 54%, #050609 100%)",
        }}
      />

      {splitProgress > 0 ? (
        <div
          style={{
            position: "absolute",
            left: graphicBackdropLeft,
            top: 0,
            width: width / 2,
            height,
            overflow: "hidden",
            opacity: splitProgress,
          }}
        >
          <OffthreadVideo
            src={staticFile("video.mp4")}
            muted
            style={{
              position: "absolute",
              left: graphicSide === "right" ? -width / 2 : 0,
              top: 0,
              width,
              height,
              objectFit: "cover",
              objectPosition: "center center",
              filter: `blur(${SPLIT_BACKDROP_BLUR}px) saturate(1.24) brightness(0.78)`,
              transform: "scale(1.1)",
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(circle at 50% 42%, rgba(212,168,83,0.12), rgba(5,6,9,0.24) 44%, rgba(5,6,9,0.58) 100%)",
            }}
          />
          <AbsoluteFill
            style={{
              background:
                graphicSide === "right"
                  ? "linear-gradient(90deg, rgba(5,6,9,0.54), rgba(5,6,9,0.10) 24%, rgba(5,6,9,0.26))"
                  : "linear-gradient(270deg, rgba(5,6,9,0.54), rgba(5,6,9,0.10) 24%, rgba(5,6,9,0.26))",
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: videoLeft,
          top: 0,
          width: videoWidth,
          height,
          overflow: "hidden",
          boxShadow:
            splitProgress > 0
              ? "0 0 0 1px rgba(240,237,230,0.10), 0 22px 48px rgba(0,0,0,0.36)"
              : "none",
        }}
      >
        <OffthreadVideo
          src={staticFile("video.mp4")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
          }}
        />
      </div>

      {splitProgress > 0.02 ? (
        <div
          style={{
            position: "absolute",
            left: width / 2 - 1,
            top: 0,
            width: 2,
            height,
            opacity: splitProgress,
            background:
              "linear-gradient(180deg, transparent, rgba(240,237,230,0.24), transparent)",
          }}
        />
      ) : null}

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

            {overlay.type === "explainer_card" ? (
              <ExplainerCard
                eyebrow={String(overlay.content.eyebrow ?? "Name")}
                title={String(overlay.content.title ?? "")}
                detail={String(overlay.content.detail ?? "")}
                side={overlay.content.side === "right" ? "right" : "left"}
                layout={overlay.content.layout === "split" ? "split" : "overlay"}
                accentColor={
                  overlay.content.accentColor
                    ? String(overlay.content.accentColor)
                    : undefined
                }
              />
            ) : null}

            {overlay.type === "person_label" ? (
              <PersonLabel
                name={String(overlay.content.name ?? "")}
                role={String(overlay.content.role ?? "")}
                imageSrc={
                  overlay.content.imageSrc
                    ? String(overlay.content.imageSrc)
                    : undefined
                }
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

            {overlay.type === "motivation_map" ? (
              <MotivationMap
                center={String(overlay.content.center ?? "Not spite")}
                items={asStringList(overlay.content.items, [
                  "Instinct",
                  "Attention",
                  "Bonding",
                ])}
                side={overlay.content.side === "left" ? "left" : "right"}
                layout={overlay.content.layout === "split" ? "split" : "overlay"}
                accentColor={String(overlay.content.accentColor ?? "#F97316")}
                durationFrames={durationInFrames}
              />
            ) : null}

            {overlay.type === "scent_bridge" ? (
              <ScentBridge
                source={String(overlay.content.source ?? "Your item")}
                target={String(overlay.content.target ?? "Comfort")}
                detail={String(overlay.content.detail ?? "Familiar smell becomes a cue.")}
                side={overlay.content.side === "right" ? "right" : "left"}
                layout={overlay.content.layout === "split" ? "split" : "overlay"}
                accentColor={String(overlay.content.accentColor ?? "#7DD3FC")}
                durationFrames={durationInFrames}
              />
            ) : null}

            {overlay.type === "reward_loop" ? (
              <RewardLoop
                steps={asStringList(overlay.content.steps, [
                  "Grab",
                  "You react",
                  "Reward",
                ])}
                detail={String(overlay.content.detail ?? "The chase can train the pattern.")}
                side={overlay.content.side === "right" ? "right" : "left"}
                layout={overlay.content.layout === "split" ? "split" : "overlay"}
                accentColor={String(overlay.content.accentColor ?? "#F472B6")}
                durationFrames={durationInFrames}
              />
            ) : null}

            {overlay.type === "stimulation_meter" ? (
              <StimulationMeter
                meters={asMeters(overlay.content.meters, [
                  { label: "Mental work", value: 32 },
                  { label: "Physical play", value: 38 },
                ])}
                detail={String(overlay.content.detail ?? "Belongings become the game.")}
                side={overlay.content.side === "left" ? "left" : "right"}
                layout={overlay.content.layout === "split" ? "split" : "overlay"}
                accentColor={String(overlay.content.accentColor ?? "#86EFAC")}
                durationFrames={durationInFrames}
              />
            ) : null}

            {overlay.type === "keepaway_chain" ? (
              <KeepAwayChain
                steps={asStringList(overlay.content.steps, [
                  "Take object",
                  "Run off",
                  "Invite play",
                ])}
                side={overlay.content.side === "right" ? "right" : "left"}
                layout={overlay.content.layout === "split" ? "split" : "overlay"}
                accentColor={String(overlay.content.accentColor ?? "#A78BFA")}
                durationFrames={durationInFrames}
              />
            ) : null}

            {overlay.type === "response_reframe" ? (
              <ResponseReframe
                bad={String(overlay.content.bad ?? "disobedience")}
                good={String(overlay.content.good ?? "communication")}
                detail={String(
                  overlay.content.detail ??
                    "Respond to the need instead of only the stolen object."
                )}
                side={overlay.content.side === "left" ? "left" : "right"}
                layout={overlay.content.layout === "split" ? "split" : "overlay"}
                accentColor={String(overlay.content.accentColor ?? "#D4A853")}
                durationFrames={durationInFrames}
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
        areaStyle={
          splitProgress > 0.08
            ? {
                left: videoSide === "right" ? "50%" : 0,
                right: videoSide === "left" ? "50%" : 0,
                padding: "0 5%",
              }
            : undefined
        }
      />
    </AbsoluteFill>
  );
};
