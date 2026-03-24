import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

interface LocationLabelProps {
  location: string;
  qualifier?: string;
}

export const LocationLabel: React.FC<LocationLabelProps> = ({ location, qualifier }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.85, stiffness: 130 },
  });

  const translateX = interpolate(enter, [0, 1], [-90, 0]);
  const opacityIn = interpolate(enter, [0, 1], [0, 1]);
  const opacityOut = interpolate(
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
          transform: `translateX(${translateX}px)`,
          opacity: Math.min(opacityIn, opacityOut),
          pointerEvents: "none",
          display: "flex",
          alignItems: "stretch",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 3,
            borderRadius: 2,
            backgroundColor: DOC_COLORS.accent,
            boxShadow: `0 0 12px ${DOC_COLORS.accent}66`,
          }}
        />

        <div
          style={{
            backgroundColor: DOC_COLORS.card,
            border: `1px solid ${DOC_COLORS.divider}`,
            borderRadius: 10,
            padding: "14px 20px",
            maxWidth: 640,
          }}
        >
          <div
            style={{
              fontFamily: DOC_FONTS.sans,
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: DOC_COLORS.textPrimary,
              textShadow: DOC_SHADOW,
              lineHeight: 1.16,
            }}
          >
            {location}
          </div>

          {qualifier ? (
            <div
              style={{
                marginTop: 6,
                fontFamily: DOC_FONTS.sans,
                fontWeight: 500,
                fontSize: 20,
                letterSpacing: 1.1,
                color: DOC_COLORS.textSecondary,
                textShadow: DOC_SHADOW,
                textTransform: "uppercase",
              }}
            >
              {qualifier}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
