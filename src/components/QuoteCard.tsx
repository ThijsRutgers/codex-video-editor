import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

interface QuoteCardProps {
  quote: string;
  attribution: string;
  year?: string;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, attribution, year }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.95, stiffness: 110 },
  });

  const quoteOpacity = interpolate(enter, [0, 1], [0, 1]);
  const quoteY = interpolate(enter, [0, 1], [20, 0]);

  const byline = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 110 },
  });

  const outOpacity = interpolate(
    frame,
    [durationInFrames - 16, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: "28%" }}>
      <div
        style={{
          width: "70%",
          textAlign: "center",
          backgroundColor: DOC_COLORS.card,
          border: `1px solid ${DOC_COLORS.divider}`,
          borderRadius: 14,
          padding: "28px 36px",
          opacity: outOpacity,
        }}
      >
        <div
          style={{
            fontFamily: DOC_FONTS.serif,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 40,
            lineHeight: 1.28,
            color: DOC_COLORS.textPrimary,
            textShadow: DOC_SHADOW,
            opacity: quoteOpacity,
            transform: `translateY(${quoteY}px)`,
          }}
        >
          "{quote}"
        </div>

        <div
          style={{
            marginTop: 18,
            fontFamily: DOC_FONTS.sans,
            fontWeight: 500,
            fontSize: 24,
            color: DOC_COLORS.textSecondary,
            textShadow: DOC_SHADOW,
            opacity: interpolate(byline, [0, 1], [0, 1]),
          }}
        >
          {year ? `${attribution} · ${year}` : attribution}
        </div>
      </div>
    </AbsoluteFill>
  );
};
