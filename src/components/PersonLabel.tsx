import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

interface PersonLabelProps {
  name: string;
  role: string;
}

export const PersonLabel: React.FC<PersonLabelProps> = ({ name, role }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const lineProgress = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8, stiffness: 140 },
  });

  const textProgress = spring({
    frame: frame - 6,
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 120 },
  });

  const outOpacity = interpolate(
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
          bottom: 128,
          display: "flex",
          alignItems: "stretch",
          opacity: outOpacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: interpolate(lineProgress, [0, 1], [0, 4]),
            backgroundColor: DOC_COLORS.accent,
            borderRadius: 2,
            marginRight: 16,
            boxShadow: `0 0 12px ${DOC_COLORS.accent}66`,
          }}
        />

        <div
          style={{
            transform: `translateX(${interpolate(textProgress, [0, 1], [-24, 0])}px)`,
            opacity: interpolate(textProgress, [0, 1], [0, 1]),
            backgroundColor: DOC_COLORS.card,
            border: `1px solid ${DOC_COLORS.divider}`,
            borderRadius: 10,
            padding: "14px 20px",
            maxWidth: 700,
          }}
        >
          <div
            style={{
              fontFamily: DOC_FONTS.sans,
              fontWeight: 600,
              fontSize: 36,
              lineHeight: 1.15,
              color: DOC_COLORS.textPrimary,
              textShadow: DOC_SHADOW,
            }}
          >
            {name}
          </div>

          <div
            style={{
              marginTop: 6,
              fontFamily: DOC_FONTS.sans,
              fontWeight: 500,
              fontSize: 26,
              lineHeight: 1.2,
              color: DOC_COLORS.textSecondary,
              textShadow: DOC_SHADOW,
            }}
          >
            {role}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
