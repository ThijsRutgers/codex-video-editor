import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

interface ExplainerCardProps {
  eyebrow?: string;
  title: string;
  detail: string;
  side?: "left" | "right";
  accentColor?: string;
}

export const ExplainerCard: React.FC<ExplainerCardProps> = ({
  eyebrow = "Name",
  title,
  detail,
  side = "left",
  accentColor = DOC_COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 17, mass: 0.85, stiffness: 130 },
  });

  const exitStart = Math.max(0, durationInFrames - 14);
  const opacityOut = interpolate(frame, [exitStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateX = interpolate(enter, [0, 1], [side === "left" ? -88 : 88, 0]);
  const opacityIn = interpolate(enter, [0, 1], [0, 1]);

  const positionStyle: React.CSSProperties =
    side === "left" ? { left: 78, top: 82 } : { right: 78, top: 82 };

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          ...positionStyle,
          width: 520,
          maxWidth: "42%",
          transform: `translateX(${translateX}px)`,
          opacity: Math.min(opacityIn, opacityOut),
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 14,
            filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.45))",
          }}
        >
          <div
            style={{
              width: 3,
              borderRadius: 2,
              backgroundColor: accentColor,
              boxShadow: `0 0 14px ${accentColor}88`,
            }}
          />

          <div
            style={{
              flex: 1,
              border: `1px solid ${DOC_COLORS.divider}`,
              borderRadius: 8,
              backgroundColor: "rgba(10, 10, 15, 0.74)",
              padding: "16px 20px 18px",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                fontFamily: DOC_FONTS.mono,
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 1.2,
                lineHeight: 1.1,
                textTransform: "uppercase",
                color: accentColor,
                textShadow: DOC_SHADOW,
              }}
            >
              {eyebrow}
            </div>

            <div
              style={{
                marginTop: 8,
                fontFamily: DOC_FONTS.serif,
                fontWeight: 700,
                fontSize: 34,
                lineHeight: 1.05,
                color: DOC_COLORS.textPrimary,
                textShadow: DOC_SHADOW,
              }}
            >
              {title}
            </div>

            <div
              style={{
                marginTop: 10,
                fontFamily: DOC_FONTS.sans,
                fontWeight: 500,
                fontSize: 22,
                lineHeight: 1.25,
                color: DOC_COLORS.textSecondary,
                textShadow: DOC_SHADOW,
              }}
            >
              {detail}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
