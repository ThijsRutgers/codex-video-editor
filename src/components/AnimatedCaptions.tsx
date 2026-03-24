import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

export interface CaptionWord {
  word: string;
  startMs: number;
  endMs: number;
}

interface AnimatedCaptionsProps {
  words: CaptionWord[];
  highlightColor?: string;
  inactiveColor?: string;
  maxWordsPerPage?: number;
  fontSize?: number;
  bottom?: string;
}

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  words,
  highlightColor = DOC_COLORS.accent,
  inactiveColor = DOC_COLORS.textPrimary,
  maxWordsPerPage = 5,
  fontSize = 40,
  bottom = "15%",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  if (words.length === 0) {
    return null;
  }

  const pages: Array<{ words: CaptionWord[]; startMs: number; endMs: number }> = [];

  for (let i = 0; i < words.length; i += maxWordsPerPage) {
    const pageWords = words.slice(i, i + maxWordsPerPage);
    pages.push({
      words: pageWords,
      startMs: pageWords[0].startMs,
      endMs: pageWords[pageWords.length - 1].endMs,
    });
  }

  const currentPage = pages.find(
    (p) => currentTimeMs >= p.startMs && currentTimeMs <= p.endMs + 120
  );

  if (!currentPage) {
    return null;
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom,
          display: "flex",
          justifyContent: "center",
          padding: "0 10%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0 12px",
            maxWidth: "82%",
          }}
        >
          {currentPage.words.map((word, index) => {
            const isActive = currentTimeMs >= word.startMs && currentTimeMs <= word.endMs;

            return (
              <span
                key={`${word.startMs}-${index}`}
                style={{
                  fontFamily: DOC_FONTS.sans,
                  fontWeight: 700,
                  fontSize,
                  lineHeight: 1.28,
                  color: isActive ? highlightColor : inactiveColor,
                  textShadow: DOC_SHADOW,
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                  transition: "transform 100ms linear, color 100ms linear",
                }}
              >
                {word.word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
