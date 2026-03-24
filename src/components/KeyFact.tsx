import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

interface KeyFactProps {
  value: string;
  context: string;
}

export const KeyFact: React.FC<KeyFactProps> = ({ value, context }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 130 },
  });

  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  const opacityIn = interpolate(enter, [0, 1], [0, 1]);
  const opacityOut = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const emphasisGlow = interpolate(enter, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: "33%" }}>
      <div
        style={{
          minWidth: 520,
          maxWidth: "72%",
          textAlign: "center",
          padding: "24px 36px",
          borderRadius: 14,
          border: `1px solid ${DOC_COLORS.divider}`,
          backgroundColor: DOC_COLORS.card,
          transform: `scale(${scale})`,
          opacity: Math.min(opacityIn, opacityOut),
          boxShadow: `0 0 ${Math.round(18 * emphasisGlow)}px rgba(212,168,83,0.2)`,
        }}
      >
        <div
          style={{
            fontFamily: DOC_FONTS.mono,
            fontWeight: 700,
            fontSize: 64,
            letterSpacing: 1,
            lineHeight: 1.02,
            color: DOC_COLORS.accent,
            textShadow: DOC_SHADOW,
          }}
        >
          {value}
        </div>

        <div
          style={{
            marginTop: 10,
            fontFamily: DOC_FONTS.sans,
            fontWeight: 500,
            fontSize: 28,
            lineHeight: 1.25,
            color: DOC_COLORS.textPrimary,
            textShadow: DOC_SHADOW,
          }}
        >
          {context}
        </div>
      </div>
    </AbsoluteFill>
  );
};
