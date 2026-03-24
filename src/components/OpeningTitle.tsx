import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

interface OpeningTitleProps {
  title: string;
  subtitle?: string;
}

export const OpeningTitle: React.FC<OpeningTitleProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 90 },
  });

  const titleOpacity = interpolate(enter, [0, 1], [0, 1]);
  const titleScale = interpolate(enter, [0, 1], [0.95, 1]);
  const titleY = interpolate(enter, [0, 1], [24, 0]);

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const lineGrow = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  const subtitleFade = spring({
    frame: frame - 16,
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 110 },
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: "34%" }}>
      <div style={{ textAlign: "center", maxWidth: "84%", opacity: exitOpacity }}>
        <div
          style={{
            fontFamily: DOC_FONTS.serif,
            fontWeight: 700,
            fontSize: 78,
            letterSpacing: 1,
            color: DOC_COLORS.textPrimary,
            textShadow: DOC_SHADOW,
            lineHeight: 1.12,
            transform: `translateY(${titleY}px) scale(${titleScale})`,
            opacity: titleOpacity,
          }}
        >
          {title}
        </div>

        <div
          style={{
            width: interpolate(lineGrow, [0, 1], [0, 320]),
            height: 2,
            backgroundColor: DOC_COLORS.accent,
            margin: "20px auto 18px auto",
            borderRadius: 999,
          }}
        />

        {subtitle ? (
          <div
            style={{
              fontFamily: DOC_FONTS.sans,
              fontWeight: 500,
              fontSize: 30,
              letterSpacing: 1.4,
              color: DOC_COLORS.textSecondary,
              textShadow: DOC_SHADOW,
              opacity: interpolate(subtitleFade, [0, 1], [0, 1]),
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
