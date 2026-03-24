import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.9, stiffness: 110 },
  });

  const opacityIn = interpolate(enter, [0, 1], [0, 1]);
  const trackIn = interpolate(enter, [0, 1], [24, 0]);
  const scale = interpolate(enter, [0, 1], [0.96, 1]);

  const opacityOut = interpolate(
    frame,
    [durationInFrames - 16, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(opacityIn, opacityOut);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: "38%" }}>
      <div
        style={{
          width: "100%",
          maxWidth: "80%",
          textAlign: "center",
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            fontFamily: DOC_FONTS.serif,
            fontWeight: 700,
            fontSize: 58,
            letterSpacing: `${trackIn}px`,
            color: DOC_COLORS.textPrimary,
            textShadow: DOC_SHADOW,
            lineHeight: 1.18,
          }}
        >
          {title}
        </div>

        {subtitle ? (
          <div
            style={{
              marginTop: 12,
              fontFamily: DOC_FONTS.sans,
              fontWeight: 500,
              fontSize: 28,
              color: DOC_COLORS.textSecondary,
              textShadow: DOC_SHADOW,
            }}
          >
            {subtitle}
          </div>
        ) : null}

        <div
          style={{
            margin: "20px auto 0 auto",
            width: 140,
            height: 2,
            borderRadius: 999,
            backgroundColor: DOC_COLORS.divider,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
