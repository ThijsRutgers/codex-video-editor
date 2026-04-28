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
import { loadFont as loadJetBrainsMonoFont } from "@remotion/google-fonts/JetBrainsMono";
import {
  AnimatedCaptions,
  PersonLabel,
  YearStamp,
  type CaptionWord,
} from "../components";
import storyboardData from "../../data/storyboard.json";
import transcriptData from "../../data/transcript.json";

loadInterFont("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });
loadJetBrainsMonoFont("normal", { weights: ["700"], subsets: ["latin"] });

type StoryboardOverlay = {
  id: string;
  type: string;
  startTime: number;
  duration: number;
  content: Record<string, unknown>;
};

const toFrame = (seconds: number, fps: number): number => {
  return Math.max(0, Math.round(seconds * fps));
};

const SPLIT_TRANSITION_FRAMES = 18;
const SPLIT_BACKDROP_BLUR = 34;
const CUSTOM_SPLIT_OVERLAY_TYPES = new Set<string>();

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

const isSplitOverlay = (overlay: StoryboardOverlay): boolean => {
  return (
    overlay.content.layout === "split" &&
    overlay.type !== "year_stamp" &&
    overlay.type !== "person_label" &&
    CUSTOM_SPLIT_OVERLAY_TYPES.has(overlay.type)
  );
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
      if (overlay.type !== "person_label") {
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
            {overlay.type === "year_stamp" ? (
              <YearStamp
                year={String(overlay.content.year ?? "")}
                detail={String(overlay.content.detail ?? "") || undefined}
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
