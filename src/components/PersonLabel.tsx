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

interface PersonLabelProps {
  name: string;
  role: string;
  imageSrc?: string;
}

export const PersonLabel: React.FC<PersonLabelProps> = ({ name, role, imageSrc }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const hasImage = !!imageSrc;

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

  const imageProgress = spring({
    frame: frame - 2,
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 120 },
  });

  const outOpacity = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const portraitWidth = Math.round(Math.min(width * 0.5, 980));
  const portraitHeight = Math.round(Math.min(height * 0.96, 1040));
  const portraitLeft = Math.round(width * 0.02) - 32;
  const portraitBottom = Math.round(height * 0.02) - 16;
  const cardLeft = hasImage
    ? Math.max(72, Math.round(Math.min(width * 0.44, width - 760)))
    : 80;
  const cardBottom = hasImage ? 108 : 128;
  const cardMaxWidth = hasImage ? 640 : 700;

  return (
    <AbsoluteFill>
      {imageSrc ? (
        <div
          style={{
            position: "absolute",
            left: portraitLeft,
            bottom: portraitBottom,
            width: portraitWidth,
            height: portraitHeight,
            transform: `translateX(${interpolate(imageProgress, [0, 1], [-320, 0])}px)`,
            opacity: interpolate(imageProgress, [0, 1], [0, 1]),
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Img
            src={staticFile(imageSrc)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter:
                "drop-shadow(0 24px 32px rgba(0,0,0,0.58)) drop-shadow(0 3px 14px rgba(0,0,0,0.50))",
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: cardLeft,
          bottom: cardBottom,
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
            padding: "16px 22px",
            maxWidth: cardMaxWidth,
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
