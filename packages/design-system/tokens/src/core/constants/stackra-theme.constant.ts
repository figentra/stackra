/**
 * Stackra file contract:
 * Purpose: the stackra theme, the default theme of the Stackra Design System. Its oklch values come unchanged from
 *          the approved Stackra brand kit 0.1.0, which @stackra/brand vendored until it was retired; the kit's token
 *          reports sit in assets/data/stackra/ and the tests hold the values to them. One documented deviation: light
 *          `muted` is 0.49, not the kit's 0.5 (owner decision 2026-10-23). Each hex is derived from its oklch value
 *          (`oklchToHex`), never typed, so the two cannot disagree.
 * Boundary: data only. Stackra has no accent colour: every accent role is a neutral (ink on paper, paper on ink).
 *          Steel colours the wordmark and the st tile only, never a UI role; graphite carries the accent states and,
 *          as an alias, the dark `segment` role.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0024 (the brand assets stay all rights reserved).
 */
import type { ColorToken } from "#contracts/types/theme.type";
import { defineTheme } from "#core/functions/define-theme.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

const color = (light: string, dark: string): ColorToken => ({
  light,
  dark,
  hexLight: oklchToHex(light),
  hexDark: oklchToHex(dark),
});

const WHITE = "oklch(1 0 0)";
const GRAPHITE_700 = "oklch(0.38 0.009 248)";

const INK = color("oklch(0.158 0.005 248)", "oklch(0.158 0.005 248)");
const PAPER = color("oklch(0.972 0.004 122)", "oklch(0.972 0.004 122)");
const FOREGROUND = color("oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)");
const INVERSE = color("oklch(0.972 0.004 122)", "oklch(0.158 0.005 248)");
const MUTED = color("oklch(0.49 0.01 250)", "oklch(0.72 0.008 250)");
const ON_STATUS = color("oklch(1 0 0)", "oklch(0.158 0.005 248)");

/** The stackra theme: neutral accents, Geist and IBM Plex Sans Arabic, a 4px spacing step and a 0.25rem radius. */
export const STACKRA_THEME = defineTheme({
  name: "stackra",
  colors: {
    background: INVERSE,
    foreground: FOREGROUND,
    surface: color("oklch(1 0 0)", "oklch(0.195 0.006 250)"),
    "surface-foreground": FOREGROUND,
    "surface-secondary": color("oklch(0.955 0.004 110)", "oklch(0.235 0.007 250)"),
    "surface-secondary-foreground": FOREGROUND,
    "surface-tertiary": color("oklch(0.935 0.004 110)", "oklch(0.285 0.007 250)"),
    "surface-tertiary-foreground": FOREGROUND,
    overlay: color("oklch(1 0 0)", "oklch(0.215 0.006 250)"),
    "overlay-foreground": FOREGROUND,
    muted: MUTED,
    default: color("oklch(0.935 0.004 110)", "oklch(0.285 0.007 250)"),
    "default-foreground": FOREGROUND,
    accent: FOREGROUND,
    "accent-foreground": INVERSE,
    success: color("oklch(0.5 0.13 135)", "oklch(0.72 0.15 135)"),
    "success-foreground": ON_STATUS,
    warning: color("oklch(0.55 0.15 47)", "oklch(0.72 0.17 47)"),
    "warning-foreground": ON_STATUS,
    danger: color("oklch(0.45 0.17 24)", "oklch(0.66 0.2 22)"),
    "danger-foreground": ON_STATUS,
    "field-background": color("oklch(1 0 0)", "oklch(0.235 0.007 250)"),
    "field-foreground": FOREGROUND,
    "field-placeholder": MUTED,
    "field-border": color("oklch(0.6 0.008 250)", "oklch(0.56 0.008 250)"),
    // The kit predates HeroUI's segment role, so it aliases two kit colours: white in light, as HeroUI's default, and
    // graphite-700 in dark, so the selected segment stands above the `default` track as HeroUI's dark segment does.
    segment: color(WHITE, GRAPHITE_700),
    "segment-foreground": FOREGROUND,
    border: color("oklch(0.885 0.005 110)", "oklch(0.35 0.008 250)"),
    separator: color("oklch(0.92 0.004 110)", "oklch(0.27 0.007 250)"),
    focus: FOREGROUND,
    link: FOREGROUND,
    backdrop: color("oklch(0.158 0.005 248 / 0.4)", "oklch(0.08 0.004 248 / 0.6)"),
  },
  palette: {
    amber: color("oklch(0.83 0.15 82)", "oklch(0.83 0.15 82)"),
    ink: INK,
    paper: PAPER,
    white: color(WHITE, WHITE),
    steel: color("oklch(0.931 0.012 248)", "oklch(0.931 0.012 248)"),
    "steel-deep": color("oklch(0.24 0.015 248.4)", "oklch(0.24 0.015 248.4)"),
    "stk-tile": color("oklch(1 0 89.9)", "oklch(0.234 0.007 258.4)"),
    "stk-tile-line": color("oklch(0.839 0.007 124.5)", "oklch(0.35 0.009 248.1)"),
    "stk-ink": color("oklch(0.24 0.015 248.4)", "oklch(0.931 0.012 248)"),
    "graphite-100": color("oklch(0.925 0.006 248)", "oklch(0.925 0.006 248)"),
    "graphite-200": color("oklch(0.87 0.007 248)", "oklch(0.87 0.007 248)"),
    "graphite-300": color("oklch(0.8 0.008 248)", "oklch(0.8 0.008 248)"),
    "graphite-700": color(GRAPHITE_700, GRAPHITE_700),
    "graphite-800": color("oklch(0.3 0.009 248)", "oklch(0.3 0.009 248)"),
    "graphite-900": color("oklch(0.265 0.008 248)", "oklch(0.265 0.008 248)"),
    "accent-hover": color("oklch(0.3 0.009 248)", "oklch(0.87 0.007 248)"),
    "accent-pressed": color("oklch(0.38 0.009 248)", "oklch(0.8 0.008 248)"),
    "accent-soft": color("oklch(0.925 0.006 248)", "oklch(0.265 0.008 248)"),
    "accent-soft-foreground": FOREGROUND,
    signal: FOREGROUND,
    "signal-foreground": INVERSE,
    cursor: color("oklch(0.47 0.095 75)", "oklch(0.83 0.15 82)"),
  },
  fontFamily: {
    sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
    mono: '"Geist Mono", ui-monospace, "SFMono-Regular", "Menlo", monospace',
    arabic: '"IBM Plex Sans Arabic", "Geist", system-ui, "Segoe UI", "Tahoma", sans-serif',
  },
  typography: {
    display: {
      weight: 600,
      size: "56px",
      lineHeight: "1.05",
      family: "sans",
      letterSpacing: "-0.035em",
    },
    h1: { weight: 600, size: "40px", lineHeight: "1.1", family: "sans", letterSpacing: "-0.03em" },
    h2: { weight: 600, size: "28px", lineHeight: "1.2", family: "sans", letterSpacing: "-0.02em" },
    h3: { weight: 600, size: "20px", lineHeight: "1.3", family: "sans", letterSpacing: "-0.015em" },
    // h4 to h6 are ADR 0303 decision 9: HeroUI's own h4 is 20px, the size of our h3, so the scale defines its tail.
    h4: { weight: 600, size: "18px", lineHeight: "1.4", family: "sans", letterSpacing: "-0.01em" },
    h5: { weight: 600, size: "16px", lineHeight: "1.5", family: "sans", letterSpacing: "0em" },
    h6: { weight: 600, size: "14px", lineHeight: "1.5", family: "sans", letterSpacing: "0em" },
    body: { weight: 400, size: "16px", lineHeight: "1.6", family: "sans", letterSpacing: "0em" },
    small: { weight: 400, size: "14px", lineHeight: "1.5", family: "sans", letterSpacing: "0em" },
    caption: { weight: 500, size: "12px", lineHeight: "1.4", family: "sans", letterSpacing: "0em" },
    mono: { weight: 400, size: "14px", lineHeight: "1.7", family: "mono", letterSpacing: "0em" },
    label: {
      weight: 500,
      size: "11px",
      lineHeight: "1.4",
      family: "mono",
      letterSpacing: "0.06em",
    },
    "display-ar": {
      weight: 600,
      size: "52px",
      lineHeight: "1.3",
      family: "arabic",
      letterSpacing: "0em",
    },
    "h1-ar": {
      weight: 600,
      size: "38px",
      lineHeight: "1.35",
      family: "arabic",
      letterSpacing: "0em",
    },
    "h2-ar": {
      weight: 600,
      size: "30px",
      lineHeight: "1.4",
      family: "arabic",
      letterSpacing: "0em",
    },
    "h3-ar": {
      weight: 600,
      size: "21px",
      lineHeight: "1.5",
      family: "arabic",
      letterSpacing: "0em",
    },
    // The Arabic twins of h4 to h6 are one pixel and 0.2 of line height above their Latin style (decision 9).
    "h4-ar": {
      weight: 600,
      size: "19px",
      lineHeight: "1.6",
      family: "arabic",
      letterSpacing: "0em",
    },
    "h5-ar": {
      weight: 600,
      size: "17px",
      lineHeight: "1.7",
      family: "arabic",
      letterSpacing: "0em",
    },
    "h6-ar": {
      weight: 600,
      size: "15px",
      lineHeight: "1.7",
      family: "arabic",
      letterSpacing: "0em",
    },
    "body-ar": {
      weight: 400,
      size: "17px",
      lineHeight: "1.8",
      family: "arabic",
      letterSpacing: "0em",
    },
    "small-ar": {
      weight: 400,
      size: "15px",
      lineHeight: "1.7",
      family: "arabic",
      letterSpacing: "0em",
    },
    "caption-ar": {
      weight: 500,
      size: "13px",
      lineHeight: "1.6",
      family: "arabic",
      letterSpacing: "0em",
    },
  },
  spacing: {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px",
    "18": "72px",
    "20": "80px",
  },
  radius: {
    base: "0.25rem",
    field: "var(--radius)",
    steps: { sm: "2px", lg: "6px", full: "9999px", "app-tile": "21.875%" },
  },
  shadows: {
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
  },
  motion: {
    fast: { duration: "150ms", easing: "ease-out" },
    base: { duration: "250ms", easing: "ease-in-out" },
    blink: { duration: "1000ms", easing: "steps(1)" },
    // An entrance (Reveal, a chart drawing in): quick to start, long to settle.
    reveal: { duration: "400ms", easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    // The delay between items revealed in a row; only its duration is read.
    stagger: { duration: "40ms", easing: "linear" },
  },
});
