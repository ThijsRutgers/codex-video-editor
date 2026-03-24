import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface NameCardProps {
  name: string;
  role: string;
  side?: "left" | "right";
  accentColor?: string;
}

export const NameCard: React.FC<NameCardProps> = ({
  name,
  role,
  side = "left",
  accentColor = "#3B82F6",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Enter animation: slide in from side
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  // Exit animation: fade out in last 12 frames
  const exitStart = durationInFrames - 12;
  const exitOpacity = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const slideOffset = side === "left" ? -300 : 300;
  const translateX = interpolate(enterProgress, [0, 1], [slideOffset, 0]);

  const positionStyle: React.CSSProperties =
    side === "left"
      ? { left: 80, bottom: 140 }
      : { right: 80, bottom: 140 };

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          ...positionStyle,
          transform: `translateX(${translateX}px)`,
          opacity: exitOpacity,
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: 3,
            backgroundColor: accentColor,
            borderRadius: 2,
            marginRight: 16,
          }}
        />

        {/* Card content */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            padding: "16px 32px",
            borderRadius: 12,
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: 40,
              color: "#FFFFFF",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              lineHeight: 1.2,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: 28,
              color: "#CBD5E1",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              marginTop: 4,
            }}
          >
            {role}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
