import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DOC_COLORS, DOC_FONTS, DOC_SHADOW } from "./theme";

type Side = "left" | "right";
type LayoutMode = "overlay" | "split";

const GRAPHIC_DETAIL = "#D9D2C4";

interface GraphicShellProps {
  eyebrow: string;
  title: string;
  side?: Side;
  layout?: LayoutMode;
  accentColor?: string;
  durationFrames: number;
  width?: number;
  splitMinHeight?: number;
  children: React.ReactNode;
}

const fade = (frame: number, durationFrames: number): number => {
  const exitStart = Math.max(1, durationFrames - 16);
  return interpolate(frame, [0, 12, exitStart, durationFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

const GraphicShell: React.FC<GraphicShellProps> = ({
  eyebrow,
  title,
  side = "left",
  layout = "overlay",
  accentColor = DOC_COLORS.accent,
  durationFrames,
  width = 520,
  splitMinHeight,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.9, stiffness: 125 },
  });
  const slide = interpolate(enter, [0, 1], [side === "left" ? -54 : 54, 0]);
  const scale = interpolate(enter, [0, 1], [0.98, 1]);
  const opacity = fade(frame, durationFrames);
  const isSplit = layout === "split";
  const splitWidth = Math.min(Math.round(width * 1.5), 840);

  const positionStyle: React.CSSProperties = isSplit
    ? side === "left"
      ? { left: 0, top: 0, bottom: 0 }
      : { right: 0, top: 0, bottom: 0 }
    : side === "left"
      ? { left: 72, top: 70 }
      : { right: 72, top: 70 };

  if (isSplit) {
    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            ...positionStyle,
            width: "50%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 54px",
            boxSizing: "border-box",
            opacity,
            transform: `translateX(${slide * 0.45}px) scale(${scale})`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: splitWidth,
              maxWidth: "100%",
              minHeight: splitMinHeight,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              filter: "drop-shadow(0 20px 34px rgba(0,0,0,0.34))",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 13,
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  marginTop: 12,
                  flex: "0 0 auto",
                  backgroundColor: accentColor,
                  boxShadow: `0 0 18px ${accentColor}CC`,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: DOC_FONTS.mono,
                    fontWeight: 700,
                    fontSize: 15,
                    lineHeight: 1,
                    textTransform: "uppercase",
                    letterSpacing: 1.3,
                    color: accentColor,
                    textShadow: DOC_SHADOW,
                  }}
                >
                  {eyebrow}
                </div>
                <div
                  style={{
                    marginTop: 9,
                    fontFamily: DOC_FONTS.sans,
                    fontWeight: 800,
                    fontSize: 38,
                    lineHeight: 1.04,
                    color: DOC_COLORS.textPrimary,
                    textShadow: "0 3px 18px rgba(0,0,0,0.86)",
                  }}
                >
                  {title}
                </div>
              </div>
            </div>

            <div>{children}</div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          ...positionStyle,
          width: isSplit ? "50%" : width,
          maxWidth: isSplit ? "none" : "43%",
          height: isSplit ? "100%" : undefined,
          display: isSplit ? "flex" : undefined,
          alignItems: isSplit ? "center" : undefined,
          justifyContent: isSplit ? "center" : undefined,
          padding: isSplit ? "46px 54px" : undefined,
          boxSizing: "border-box",
          opacity,
          transform: `translateX(${isSplit ? slide * 0.45 : slide}px) scale(${scale})`,
          pointerEvents: "none",
          filter: "drop-shadow(0 18px 32px rgba(0,0,0,0.36))",
        }}
      >
        <div
          style={{
            width: isSplit ? splitWidth : "100%",
            maxWidth: "100%",
            minHeight: isSplit ? splitMinHeight : undefined,
            border: `1px solid ${DOC_COLORS.divider}`,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: isSplit ? "rgba(8, 10, 15, 0.62)" : "rgba(8, 10, 15, 0.84)",
            backdropFilter: isSplit ? "blur(14px) saturate(1.08)" : "blur(10px)",
            boxShadow: isSplit
              ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 26px 62px rgba(0,0,0,0.34)"
              : undefined,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: isSplit ? "20px 26px 16px" : "14px 18px 10px",
              borderBottom: "1px solid rgba(240,237,230,0.12)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: accentColor,
                boxShadow: `0 0 16px ${accentColor}AA`,
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: DOC_FONTS.mono,
                  fontWeight: 700,
                  fontSize: isSplit ? 15 : 14,
                  lineHeight: 1,
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                  color: accentColor,
                  textShadow: DOC_SHADOW,
                }}
              >
                {eyebrow}
              </div>
              <div
                style={{
                  marginTop: isSplit ? 8 : 5,
                  fontFamily: DOC_FONTS.sans,
                  fontWeight: 700,
                  fontSize: isSplit ? 34 : 27,
                  lineHeight: 1.08,
                  color: DOC_COLORS.textPrimary,
                  textShadow: DOC_SHADOW,
                }}
              >
                {title}
              </div>
            </div>
          </div>

          <div style={{ padding: isSplit ? 28 : 18 }}>{children}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const chipStyle = (
  color: string,
  extra?: React.CSSProperties
): React.CSSProperties => ({
  border: `1px solid ${color}88`,
  backgroundColor: `${color}1F`,
  borderRadius: 999,
  padding: "8px 12px",
  fontFamily: DOC_FONTS.sans,
  fontWeight: 700,
  fontSize: 20,
  lineHeight: 1.05,
  color: DOC_COLORS.textPrimary,
  textShadow: DOC_SHADOW,
  ...extra,
});

interface MotivationMapProps {
  center: string;
  items: string[];
  side?: Side;
  layout?: LayoutMode;
  accentColor?: string;
  durationFrames: number;
}

export const MotivationMap: React.FC<MotivationMapProps> = ({
  center,
  items,
  side = "right",
  layout = "overlay",
  accentColor = "#F97316",
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const palette = ["#F97316", "#7DD3FC", "#86EFAC"];

  return (
    <GraphicShell
      eyebrow="Behavior map"
      title="Not spite. Signals."
      side={side}
      layout={layout}
      accentColor={accentColor}
      durationFrames={durationFrames}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 13 }}>
        <div
          style={{
            justifySelf: "center",
            borderRadius: 999,
            border: `1px solid ${accentColor}`,
            backgroundColor: `${accentColor}24`,
            color: DOC_COLORS.textPrimary,
            fontFamily: DOC_FONTS.serif,
            fontWeight: 700,
            fontSize: 33,
            lineHeight: 1,
            padding: "13px 22px 15px",
            textShadow: DOC_SHADOW,
          }}
        >
          {center}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {items.map((item, index) => {
            const local = spring({
              frame: frame - index * 7,
              fps: 24,
              config: { damping: 15, mass: 0.8, stiffness: 130 },
            });
            return (
              <div
                key={item}
                style={{
                  ...chipStyle(palette[index % palette.length], {
                    textAlign: "center",
                    borderRadius: 8,
                    minHeight: 68,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `translateY(${interpolate(local, [0, 1], [14, 0])}px)`,
                    opacity: interpolate(local, [0, 1], [0, 1]),
                  }),
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </GraphicShell>
  );
};

interface ScentBridgeProps {
  source: string;
  target: string;
  detail: string;
  side?: Side;
  layout?: LayoutMode;
  accentColor?: string;
  durationFrames: number;
}

export const ScentBridge: React.FC<ScentBridgeProps> = ({
  source,
  target,
  detail,
  side = "left",
  layout = "overlay",
  accentColor = "#7DD3FC",
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const isSplit = layout === "split";
  const dash = interpolate(frame, [0, durationFrames], [68, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = interpolate(Math.sin(frame / 4), [-1, 1], [0.72, 1]);
  const bridgeHeight = isSplit ? 420 : 152;
  const viewBox = isSplit ? "0 0 780 420" : "0 0 470 152";
  const bridgePath = isSplit
    ? "M120 232 C238 86, 424 326, 660 126"
    : "M92 78 C160 16, 285 134, 378 54";
  const pulseCenter = isSplit ? { x: 390, y: 210 } : { x: 235, y: 78 };

  return (
    <GraphicShell
      eyebrow="Scent cue"
      title="Your smell matters"
      side={side}
      layout={layout}
      accentColor={accentColor}
      durationFrames={durationFrames}
      width={isSplit ? 620 : 520}
      splitMinHeight={560}
    >
      <div style={{ position: "relative", height: bridgeHeight }}>
        <svg
          width="100%"
          height="100%"
          viewBox={viewBox}
          style={{ position: "absolute", inset: 0 }}
        >
          <path
            d={bridgePath}
            fill="none"
            stroke={accentColor}
            strokeWidth={isSplit ? 7 : 5}
            strokeLinecap="round"
            strokeDasharray={isSplit ? "12 22" : "8 16"}
            strokeDashoffset={dash}
            opacity="0.92"
          />
          <circle
            cx={pulseCenter.x}
            cy={pulseCenter.y}
            r={(isSplit ? 12 : 8) + pulse * (isSplit ? 5 : 4)}
            fill={`${accentColor}66`}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: isSplit ? 208 : 42,
            ...chipStyle("#F97316", {
              minWidth: isSplit ? 142 : 118,
              textAlign: "center",
              fontSize: isSplit ? 24 : 20,
              padding: isSplit ? "10px 16px" : "8px 12px",
            }),
          }}
        >
          {source}
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: isSplit ? 118 : 18,
            ...chipStyle("#86EFAC", {
              minWidth: isSplit ? 150 : 126,
              textAlign: "center",
              fontSize: isSplit ? 24 : 20,
              padding: isSplit ? "10px 16px" : "8px 12px",
            }),
          }}
        >
          {target}
        </div>
        <div
          style={{
            position: "absolute",
            left: isSplit ? 76 : 128,
            right: isSplit ? 76 : 128,
            bottom: isSplit ? 34 : 0,
            fontFamily: DOC_FONTS.sans,
            fontWeight: 600,
            fontSize: isSplit ? 26 : 21,
            lineHeight: 1.2,
            textAlign: "center",
            color: GRAPHIC_DETAIL,
            textShadow: DOC_SHADOW,
          }}
        >
          {detail}
        </div>
      </div>
    </GraphicShell>
  );
};

interface RewardLoopProps {
  steps: string[];
  detail: string;
  side?: Side;
  layout?: LayoutMode;
  accentColor?: string;
  durationFrames: number;
}

export const RewardLoop: React.FC<RewardLoopProps> = ({
  steps,
  detail,
  side = "left",
  layout = "overlay",
  accentColor = "#F472B6",
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const spin = (frame * 2.4) % 360;
  const isSplit = layout === "split";
  const loopHeight = isSplit ? 430 : 238;
  const centerY = isSplit ? 202 : 106;
  const radiusX = isSplit ? 184 : 162;
  const radiusY = isSplit ? 128 : 72;
  const nodePositions = isSplit
    ? [
        { left: 12, top: 180 },
        { left: 260, top: 38 },
        { right: 12, top: 180 },
      ]
    : [
        { left: 0, top: 74 },
        { left: 178, top: 0 },
        { right: 0, top: 74 },
      ];

  return (
    <GraphicShell
      eyebrow="Learned loop"
      title="Reaction becomes reward"
      side={side}
      layout={layout}
      accentColor={accentColor}
      durationFrames={durationFrames}
      width={548}
      splitMinHeight={630}
    >
      <div style={{ position: "relative", height: loopHeight }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 510 ${loopHeight}`}
          style={{ position: "absolute", inset: 0 }}
        >
          <ellipse
            cx="255"
            cy={centerY}
            rx={radiusX}
            ry={radiusY}
            fill="none"
            stroke={`${accentColor}80`}
            strokeWidth={isSplit ? 5 : 4}
            strokeDasharray={isSplit ? "14 13" : "12 12"}
          />
          <circle
            cx={255 + Math.cos((spin * Math.PI) / 180) * radiusX}
            cy={centerY + Math.sin((spin * Math.PI) / 180) * radiusY}
            r={isSplit ? 10 : 8}
            fill={accentColor}
          />
        </svg>

        {steps.slice(0, 3).map((step, index) => {
          return (
            <div
              key={step}
              style={{
                position: "absolute",
                ...nodePositions[index],
                ...chipStyle(index === 1 ? "#7DD3FC" : accentColor, {
                  borderRadius: 8,
                  minWidth: isSplit ? 154 : 132,
                  textAlign: "center",
                  fontSize: isSplit ? 24 : 20,
                  padding: isSplit ? "11px 16px" : "8px 12px",
                }),
              }}
            >
              {step}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: isSplit ? 34 : 54,
            right: isSplit ? 34 : 54,
            bottom: isSplit ? 18 : 8,
            fontFamily: DOC_FONTS.sans,
            fontWeight: 600,
            fontSize: isSplit ? 25 : 22,
            lineHeight: 1.22,
            textAlign: "center",
            color: GRAPHIC_DETAIL,
            textShadow: DOC_SHADOW,
          }}
        >
          {detail}
        </div>
      </div>
    </GraphicShell>
  );
};

interface StimulationMeterProps {
  meters: Array<{ label: string; value: number }>;
  detail: string;
  side?: Side;
  layout?: LayoutMode;
  accentColor?: string;
  durationFrames: number;
}

export const StimulationMeter: React.FC<StimulationMeterProps> = ({
  meters,
  detail,
  side = "right",
  layout = "overlay",
  accentColor = "#86EFAC",
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.9, stiffness: 120 },
  });

  return (
    <GraphicShell
      eyebrow="Need state"
      title="Low input, high mischief"
      side={side}
      layout={layout}
      accentColor={accentColor}
      durationFrames={durationFrames}
    >
      <div style={{ display: "grid", gap: 16 }}>
        {meters.map((meter, index) => {
          const color = index === 0 ? "#7DD3FC" : "#86EFAC";
          const width = Math.max(8, Math.min(100, meter.value)) * reveal;
          return (
            <div key={meter.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 7,
                  fontFamily: DOC_FONTS.mono,
                  fontWeight: 700,
                  fontSize: 16,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: GRAPHIC_DETAIL,
                }}
              >
                <span>{meter.label}</span>
                <span>{meter.value}%</span>
              </div>
              <div
                style={{
                  height: 16,
                  borderRadius: 999,
                  backgroundColor: "rgba(240,237,230,0.14)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${width}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: color,
                    boxShadow: `0 0 16px ${color}66`,
                  }}
                />
              </div>
            </div>
          );
        })}

        <div
          style={{
            ...chipStyle("#F97316", {
              borderRadius: 8,
              textAlign: "center",
              fontSize: 22,
              lineHeight: 1.18,
            }),
          }}
        >
          {detail}
        </div>
      </div>
    </GraphicShell>
  );
};

interface KeepAwayChainProps {
  steps: string[];
  side?: Side;
  layout?: LayoutMode;
  accentColor?: string;
  durationFrames: number;
}

export const KeepAwayChain: React.FC<KeepAwayChainProps> = ({
  steps,
  side = "left",
  layout = "overlay",
  accentColor = "#A78BFA",
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <GraphicShell
      eyebrow="Play pattern"
      title="The keep-away invite"
      side={side}
      layout={layout}
      accentColor={accentColor}
      durationFrames={durationFrames}
    >
      <div style={{ display: "grid", gap: 12 }}>
        {steps.map((step, index) => {
          const lit = progress > index / Math.max(1, steps.length - 1);
          return (
            <div
              key={step}
              style={{
                display: "grid",
                gridTemplateColumns: "42px 1fr",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  border: `2px solid ${lit ? accentColor : "rgba(240,237,230,0.24)"}`,
                  backgroundColor: lit ? `${accentColor}33` : "rgba(240,237,230,0.08)",
                  color: DOC_COLORS.textPrimary,
                  fontFamily: DOC_FONTS.mono,
                  fontWeight: 700,
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  ...chipStyle(lit ? accentColor : "#8A8A8F", {
                    borderRadius: 8,
                    fontSize: 23,
                    opacity: lit ? 1 : 0.68,
                  }),
                }}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </GraphicShell>
  );
};

interface ResponseReframeProps {
  bad: string;
  good: string;
  detail: string;
  side?: Side;
  layout?: LayoutMode;
  accentColor?: string;
  durationFrames: number;
}

export const ResponseReframe: React.FC<ResponseReframeProps> = ({
  bad,
  good,
  detail,
  side = "right",
  layout = "overlay",
  accentColor = DOC_COLORS.accent,
  durationFrames,
}) => {
  return (
    <GraphicShell
      eyebrow="Reframe"
      title="Read the signal"
      side={side}
      layout={layout}
      accentColor={accentColor}
      durationFrames={durationFrames}
      width={560}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div
          style={{
            ...chipStyle("#F97316", {
              borderRadius: 8,
              minHeight: 92,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: 22,
            }),
          }}
        >
          Not just {bad}
        </div>
        <div
          style={{
            ...chipStyle("#86EFAC", {
              borderRadius: 8,
              minHeight: 92,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: 22,
            }),
          }}
        >
          Often {good}
        </div>
        <div
          style={{
            gridColumn: "1 / -1",
            fontFamily: DOC_FONTS.sans,
            fontWeight: 600,
            fontSize: 23,
            lineHeight: 1.24,
            color: GRAPHIC_DETAIL,
            textAlign: "center",
            textShadow: DOC_SHADOW,
            paddingTop: 4,
          }}
        >
          {detail}
        </div>
      </div>
    </GraphicShell>
  );
};
