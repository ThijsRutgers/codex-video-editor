import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

interface YearStampProps {
  year: string;
  detail?: string;
}

export const YearStamp: React.FC<YearStampProps> = ({ year, detail }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const reveal = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exit = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 80,
          opacity: exit,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "10px 16px 8px 16px",
            borderLeft: `3px solid ${DOC_COLORS.accent}`,
            backgroundColor: DOC_COLORS.card,
            clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
          }}
        >
          <div
            style={{
              fontFamily: DOC_FONTS.mono,
              fontWeight: 700,
              fontSize: 72,
              lineHeight: 1,
              color: DOC_COLORS.textPrimary,
              textShadow: DOC_SHADOW,
              letterSpacing: 1,
            }}
          >
            {year}
          </div>

          {detail ? (
            <div
              style={{
                marginTop: 6,
                fontFamily: DOC_FONTS.sans,
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: DOC_COLORS.textSecondary,
                textShadow: DOC_SHADOW,
              }}
            >
              {detail}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
