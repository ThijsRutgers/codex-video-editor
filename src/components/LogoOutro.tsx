import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

interface LogoOutroProps {
  logoSrc?: string;
  websiteUrl?: string;
}

export const LogoOutro: React.FC<LogoOutroProps> = ({ logoSrc, websiteUrl }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.9, stiffness: 110 },
  });

  const contentOpacity = interpolate(enter, [0, 1], [0, 1]);
  const contentScale = interpolate(enter, [0, 1], [0.96, 1]);

  const fadeBlack = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "rgba(10, 10, 15, 0.74)" }} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            opacity: contentOpacity,
            transform: `scale(${contentScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
          }}
        >
          {logoSrc ? (
            <Img
              src={staticFile(logoSrc)}
              style={{ maxWidth: 280, maxHeight: 120, objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                fontFamily: DOC_FONTS.serif,
                fontWeight: 700,
                fontSize: 56,
                color: DOC_COLORS.textPrimary,
                textShadow: DOC_SHADOW,
              }}
            >
              End of File
            </div>
          )}

          {websiteUrl ? (
            <div
              style={{
                fontFamily: DOC_FONTS.sans,
                fontWeight: 500,
                fontSize: 30,
                letterSpacing: 1.2,
                color: DOC_COLORS.accent,
                textShadow: DOC_SHADOW,
              }}
            >
              {websiteUrl}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeBlack }} />
    </AbsoluteFill>
  );
};
