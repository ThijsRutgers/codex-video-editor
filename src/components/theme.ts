export const DOC_COLORS = {
  background: "#0A0A0F",
  card: "rgba(10, 10, 15, 0.80)",
  accent: "#D4A853",
  accentAlt: "#6B8ACA",
  textPrimary: "#F0EDE6",
  textSecondary: "#8A8A8F",
  divider: "rgba(212, 168, 83, 0.4)",
};

export const DOC_FONTS = {
  serif: '"Playfair Display", Georgia, serif',
  sans: 'Inter, Arial, sans-serif',
  mono: '"JetBrains Mono", monospace',
};

export const DOC_SHADOW = "0 2px 12px rgba(0,0,0,0.8)";

export const clamp01 = (value: number): number => {
  return Math.max(0, Math.min(1, value));
};
