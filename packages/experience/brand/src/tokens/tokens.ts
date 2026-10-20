/** Stackra brand — TypeScript token definitions. Mirrors the CSS custom properties in resources/heroui/web.css. */

export interface ColorToken {
  readonly light: string;
  readonly dark: string;
  readonly hexLight: string;
  readonly hexDark: string;
}

export interface TypographyToken {
  readonly font: string;
  readonly letterSpacing: string;
}

export interface SpacingToken {
  readonly value: string;
}

export interface RadiusToken {
  readonly value: string;
}

export interface ShadowToken {
  readonly light: string;
  readonly dark: string;
}

export interface MotionToken {
  readonly duration: string;
  readonly easing: string;
}

/* ------------------------------------------------------------------ */
/* Color tokens                                                        */
/* ------------------------------------------------------------------ */

export const colors = {
  // Figentra neutrals
  amber: {
    light: "oklch(0.83 0.15 82)",
    dark: "oklch(0.83 0.15 82)",
    hexLight: "#F8BD40",
    hexDark: "#F8BD40",
  },
  ink: {
    light: "oklch(0.158 0.005 248)",
    dark: "oklch(0.158 0.005 248)",
    hexLight: "#0B0D0F",
    hexDark: "#0B0D0F",
  },
  paper: {
    light: "oklch(0.972 0.004 122)",
    dark: "oklch(0.972 0.004 122)",
    hexLight: "#F5F6F3",
    hexDark: "#F5F6F3",
  },
  white: { light: "oklch(1 0 0)", dark: "oklch(1 0 0)", hexLight: "#FFFFFF", hexDark: "#FFFFFF" },

  // Surfaces
  surface: {
    light: "oklch(1 0 0)",
    dark: "oklch(0.195 0.006 250)",
    hexLight: "#FFFFFF",
    hexDark: "#25282B",
  },
  surfaceSecondary: {
    light: "oklch(0.955 0.004 110)",
    dark: "oklch(0.235 0.007 250)",
    hexLight: "#F1F1ED",
    hexDark: "#2F3236",
  },
  surfaceTertiary: {
    light: "oklch(0.935 0.004 110)",
    dark: "oklch(0.285 0.007 250)",
    hexLight: "#E8E8E4",
    hexDark: "#3B3E42",
  },
  overlay: {
    light: "oklch(1 0 0)",
    dark: "oklch(0.215 0.006 250)",
    hexLight: "#FFFFFF",
    hexDark: "#2B2E32",
  },
  muted: {
    light: "oklch(0.5 0.01 250)",
    dark: "oklch(0.72 0.008 250)",
    hexLight: "#5F6469",
    hexDark: "#A1A5A9",
  },
  default: {
    light: "oklch(0.935 0.004 110)",
    dark: "oklch(0.285 0.007 250)",
    hexLight: "#E8E8E4",
    hexDark: "#3B3E42",
  },

  // Semantic
  success: {
    light: "oklch(0.5 0.13 135)",
    dark: "oklch(0.72 0.15 135)",
    hexLight: "#1F7A3A",
    hexDark: "#4CAF6D",
  },
  successForeground: {
    light: "oklch(1 0 0)",
    dark: "oklch(0.158 0.005 248)",
    hexLight: "#FFFFFF",
    hexDark: "#0B0D0F",
  },
  warning: {
    light: "oklch(0.55 0.15 47)",
    dark: "oklch(0.72 0.17 47)",
    hexLight: "#B45309",
    hexDark: "#E8970C",
  },
  warningForeground: {
    light: "oklch(1 0 0)",
    dark: "oklch(0.158 0.005 248)",
    hexLight: "#FFFFFF",
    hexDark: "#0B0D0F",
  },
  danger: {
    light: "oklch(0.45 0.17 24)",
    dark: "oklch(0.66 0.2 22)",
    hexLight: "#991B1B",
    hexDark: "#EF4444",
  },
  dangerForeground: {
    light: "oklch(1 0 0)",
    dark: "oklch(0.158 0.005 248)",
    hexLight: "#FFFFFF",
    hexDark: "#0B0D0F",
  },

  // Fields
  fieldBackground: {
    light: "oklch(1 0 0)",
    dark: "oklch(0.235 0.007 250)",
    hexLight: "#FFFFFF",
    hexDark: "#2F3236",
  },
  fieldBorder: {
    light: "oklch(0.6 0.008 250)",
    dark: "oklch(0.56 0.008 250)",
    hexLight: "#7D8185",
    hexDark: "#717579",
  },
  border: {
    light: "oklch(0.885 0.005 110)",
    dark: "oklch(0.35 0.008 250)",
    hexLight: "#DFDFDA",
    hexDark: "#4A4D52",
  },
  separator: {
    light: "oklch(0.92 0.004 110)",
    dark: "oklch(0.27 0.007 250)",
    hexLight: "#E4E4E0",
    hexDark: "#3F4246",
  },
  backdrop: {
    light: "oklch(0.158 0.005 248 / 0.4)",
    dark: "oklch(0.08 0.004 248 / 0.6)",
    hexLight: "#0B0D0F66",
    hexDark: "#0B0D0F99",
  },

  // Stackra steel & graphite (artwork only, never a UI role)
  steel: {
    light: "oklch(0.931 0.012 248)",
    dark: "oklch(0.931 0.012 248)",
    hexLight: "#E2E9F0",
    hexDark: "#E2E9F0",
  },
  steelDeep: {
    light: "oklch(0.24 0.015 248.4)",
    dark: "oklch(0.24 0.015 248.4)",
    hexLight: "#1A2026",
    hexDark: "#1A2026",
  },
  stkTile: {
    light: "oklch(1 0 89.9)",
    dark: "oklch(0.234 0.007 258.4)",
    hexLight: "#FFFFFF",
    hexDark: "#1C1E21",
  },
  stkTileLine: {
    light: "oklch(0.839 0.007 124.5)",
    dark: "oklch(0.35 0.009 248.1)",
    hexLight: "#C9CBC6",
    hexDark: "#373B3F",
  },
  graphite100: {
    light: "oklch(0.925 0.006 248)",
    dark: "oklch(0.925 0.006 248)",
    hexLight: "#E3E7EA",
    hexDark: "#E3E7EA",
  },
  graphite200: {
    light: "oklch(0.87 0.007 248)",
    dark: "oklch(0.87 0.007 248)",
    hexLight: "#D1D5D9",
    hexDark: "#D1D5D9",
  },
  graphite300: {
    light: "oklch(0.8 0.008 248)",
    dark: "oklch(0.8 0.008 248)",
    hexLight: "#BABEC3",
    hexDark: "#BABEC3",
  },
  graphite700: {
    light: "oklch(0.38 0.009 248)",
    dark: "oklch(0.38 0.009 248)",
    hexLight: "#3F4347",
    hexDark: "#3F4347",
  },
  graphite800: {
    light: "oklch(0.3 0.009 248)",
    dark: "oklch(0.3 0.009 248)",
    hexLight: "#2A2E32",
    hexDark: "#2A2E32",
  },
  graphite900: {
    light: "oklch(0.265 0.008 248)",
    dark: "oklch(0.265 0.008 248)",
    hexLight: "#222629",
    hexDark: "#222629",
  },

  // Role aliases (resolved)
  background: {
    light: "oklch(0.972 0.004 122)",
    dark: "oklch(0.158 0.005 248)",
    hexLight: "#F5F6F3",
    hexDark: "#0B0D0F",
  },
  foreground: {
    light: "oklch(0.158 0.005 248)",
    dark: "oklch(0.972 0.004 122)",
    hexLight: "#0B0D0F",
    hexDark: "#F5F6F3",
  },
  accent: {
    light: "oklch(0.158 0.005 248)",
    dark: "oklch(0.972 0.004 122)",
    hexLight: "#0B0D0F",
    hexDark: "#F5F6F3",
  },
  accentForeground: {
    light: "oklch(0.972 0.004 122)",
    dark: "oklch(0.158 0.005 248)",
    hexLight: "#F5F6F3",
    hexDark: "#0B0D0F",
  },
  accentHover: {
    light: "oklch(0.3 0.009 248)",
    dark: "oklch(0.87 0.007 248)",
    hexLight: "#2A2E32",
    hexDark: "#D1D5D9",
  },
  accentPressed: {
    light: "oklch(0.38 0.009 248)",
    dark: "oklch(0.8 0.008 248)",
    hexLight: "#3F4347",
    hexDark: "#BABEC3",
  },
  accentSoft: {
    light: "oklch(0.925 0.006 248)",
    dark: "oklch(0.265 0.008 248)",
    hexLight: "#E3E7EA",
    hexDark: "#222629",
  },
  accentSoftForeground: {
    light: "oklch(0.158 0.005 248)",
    dark: "oklch(0.972 0.004 122)",
    hexLight: "#0B0D0F",
    hexDark: "#F5F6F3",
  },
  focus: {
    light: "oklch(0.158 0.005 248)",
    dark: "oklch(0.972 0.004 122)",
    hexLight: "#0B0D0F",
    hexDark: "#F5F6F3",
  },
  link: {
    light: "oklch(0.158 0.005 248)",
    dark: "oklch(0.972 0.004 122)",
    hexLight: "#0B0D0F",
    hexDark: "#F5F6F3",
  },
  signal: {
    light: "oklch(0.158 0.005 248)",
    dark: "oklch(0.972 0.004 122)",
    hexLight: "#0B0D0F",
    hexDark: "#F5F6F3",
  },
  signalForeground: {
    light: "oklch(0.972 0.004 122)",
    dark: "oklch(0.158 0.005 248)",
    hexLight: "#F5F6F3",
    hexDark: "#0B0D0F",
  },
  cursor: {
    light: "oklch(0.47 0.095 75)",
    dark: "oklch(0.83 0.15 82)",
    hexLight: "#79520A",
    hexDark: "#F8BD40",
  },
  stkInk: {
    light: "oklch(0.24 0.015 248.4)",
    dark: "oklch(0.931 0.012 248)",
    hexLight: "#1A2026",
    hexDark: "#E2E9F0",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Typography tokens                                                   */
/* ------------------------------------------------------------------ */

export const fontFamily = {
  sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, "SFMono-Regular", "Menlo", monospace',
  arabic: '"IBM Plex Sans Arabic", "Geist", system-ui, "Segoe UI", "Tahoma", sans-serif',
} as const;

export const typography = {
  display: { font: `600 56px/1.05 ${fontFamily.sans}`, letterSpacing: "-0.035em" },
  h1: { font: `600 40px/1.1 ${fontFamily.sans}`, letterSpacing: "-0.03em" },
  h2: { font: `600 28px/1.2 ${fontFamily.sans}`, letterSpacing: "-0.02em" },
  h3: { font: `600 20px/1.3 ${fontFamily.sans}`, letterSpacing: "-0.015em" },
  body: { font: `400 16px/1.6 ${fontFamily.sans}`, letterSpacing: "0em" },
  small: { font: `400 14px/1.5 ${fontFamily.sans}`, letterSpacing: "0em" },
  caption: { font: `500 12px/1.4 ${fontFamily.sans}`, letterSpacing: "0em" },
  mono: { font: `400 14px/1.7 ${fontFamily.mono}`, letterSpacing: "0em" },
  label: { font: `500 11px/1.4 ${fontFamily.mono}`, letterSpacing: "0.06em" },
  displayAr: { font: `600 52px/1.3 ${fontFamily.arabic}`, letterSpacing: "0em" },
  h1Ar: { font: `600 38px/1.35 ${fontFamily.arabic}`, letterSpacing: "0em" },
  h2Ar: { font: `600 30px/1.4 ${fontFamily.arabic}`, letterSpacing: "0em" },
  h3Ar: { font: `600 21px/1.5 ${fontFamily.arabic}`, letterSpacing: "0em" },
  bodyAr: { font: `400 17px/1.8 ${fontFamily.arabic}`, letterSpacing: "0em" },
  smallAr: { font: `400 15px/1.7 ${fontFamily.arabic}`, letterSpacing: "0em" },
  captionAr: { font: `500 13px/1.6 ${fontFamily.arabic}`, letterSpacing: "0em" },
} as const;

/* ------------------------------------------------------------------ */
/* Spacing tokens                                                      */
/* ------------------------------------------------------------------ */

export const spacing = {
  "space-1": { value: "4px" },
  "space-2": { value: "8px" },
  "space-3": { value: "12px" },
  "space-4": { value: "16px" },
  "space-5": { value: "20px" },
  "space-6": { value: "24px" },
  "space-8": { value: "32px" },
  "space-10": { value: "40px" },
  "space-12": { value: "48px" },
  "space-16": { value: "64px" },
  "space-18": { value: "72px" },
  "space-20": { value: "80px" },
} as const;

/* ------------------------------------------------------------------ */
/* Radius tokens                                                       */
/* ------------------------------------------------------------------ */

export const radius = {
  radius: { value: "0.25rem" },
  "radius-sm": { value: "2px" },
  "radius-lg": { value: "6px" },
  "radius-full": { value: "9999px" },
  "radius-app-tile": { value: "21.875%" },
} as const;

/* ------------------------------------------------------------------ */
/* Shadow tokens                                                       */
/* ------------------------------------------------------------------ */

export const shadows = {
  surface: {
    light:
      "0px 0px 0px 1px oklch(0.158 0.005 248 / 0.06), 0px 1px 2px 0px oklch(0.158 0.005 248 / 0.06)",
    dark: "0px 0px 0px 1px oklch(0.27 0.007 250), 0px 1px 0px 0px oklch(1 0 0 / 0.02) inset",
  },
  overlay: {
    light:
      "0px 0px 0px 1px oklch(0.158 0.005 248 / 0.08), 0px 8px 24px -4px oklch(0.158 0.005 248 / 0.14)",
    dark: "0px 0px 0px 1px oklch(0.35 0.008 250), 0px 16px 32px -8px oklch(0 0 0 / 0.55)",
  },
  field: {
    light: "0px 1px 0px 0px oklch(0.158 0.005 248 / 0.04)",
    dark: "0px 1px 0px 0px oklch(0 0 0 / 0.2)",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Motion tokens                                                       */
/* ------------------------------------------------------------------ */

export const motion = {
  fast: { duration: "150ms", easing: "ease-out" },
  base: { duration: "250ms", easing: "ease-in-out" },
  blink: { duration: "1000ms", easing: "steps(1)" },
} as const;

/* ------------------------------------------------------------------ */
/* Convenience: all token groups                                       */
/* ------------------------------------------------------------------ */

export const tokens = {
  colors,
  fontFamily,
  typography,
  spacing,
  radius,
  shadows,
  motion,
} as const;
