/**
 * Stackra file contract:
 * Purpose: the stackra theme, the default theme of the Stackra Design System. Its oklch values come unchanged from
 *          the approved Stackra brand kit 0.1.0, which @stackra/brand vendored until it was retired; the theme's test
 *          holds every colour to a frozen in-code snapshot of them and every WCAG minimum of the kit's contrast report
 *          to `STACKRA_CONTRAST_PAIRS` (ADR 0340 decision 8). One documented deviation: light `muted` is 0.49, not the
 *          kit's 0.5 (owner decision 2026-10-23). Each hex is derived from its oklch value (`oklchToHex`), never
 *          typed, so the two cannot disagree.
 * Boundary: data only. The accent is the brand's steel blue (ADR 0319): the accent, its hover, pressed and soft
 *          steps and the focus ring take the wordmark's hue (248) at a chroma a control can carry, with paper or ink on
 *          it at 4.5:1 or more; the link and the signal stay neutral. Graphite carries the neutral states and,
 *          as an alias, the dark `segment` role. The environment banners and the chart set are ADR 0340 decision 9's
 *          tokens. The theme names no product or family (decision 8): the amber bar a mark draws is `amber-strong`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0024 (the brand assets stay all rights reserved); ADR 0340
 *          (decisions 8 and 9).
 */
import type { ColorToken } from "#contracts/types/color-token.type";
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
// ADR 0319: the brand accent, steel blue on the wordmark's hue. Paper on it is 5.49:1 (light), ink on it 7.88:1 (dark).
const ACCENT = color("oklch(0.5 0.12 248)", "oklch(0.72 0.11 248)");

/** The stackra theme: a steel-blue accent, Geist and IBM Plex Sans Arabic, a 4px spacing step and a 0.25rem radius. */
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
    accent: ACCENT,
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
    focus: ACCENT,
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
    "accent-hover": color("oklch(0.45 0.12 248)", "oklch(0.67 0.11 248)"),
    "accent-pressed": color("oklch(0.4 0.11 248)", "oklch(0.62 0.11 248)"),
    "accent-soft": color("oklch(0.94 0.03 248)", "oklch(0.29 0.05 248)"),
    "accent-soft-foreground": color("oklch(0.42 0.12 248)", "oklch(0.85 0.07 248)"),
    signal: FOREGROUND,
    "signal-foreground": INVERSE,
    // ADR 0340 decision 8: amber that stands 3:1 off the page in each scheme, under a neutral name (was `cursor`;
    // TOKEN_PATH_ALIASES maps the old path).
    "amber-strong": color("oklch(0.47 0.095 75)", "oklch(0.83 0.15 82)"),
    // ADR 0340 decision 4: HeroUI's own warning hover mixes 10% white into the light warning, which leaves its white
    // text at 4.22:1; this step goes 0.05 darker in both schemes, as the accent's hover does (6.38:1 and 6.10:1).
    "warning-hover": color("oklch(0.5 0.15 47)", "oklch(0.67 0.17 47)"),
    // ADR 0340 decision 9: the environment banners of ADR 0280, which a brand above may lock. Each sits at the status
    // colours' lightness with their label, and 25 degrees or more from danger, warning, success and the accent.
    "banner-sandbox": color("oklch(0.5 0.08 190)", "oklch(0.72 0.11 190)"),
    "banner-sandbox-foreground": ON_STATUS,
    "banner-staging": color("oklch(0.5 0.16 300)", "oklch(0.72 0.13 300)"),
    "banner-staging-foreground": ON_STATUS,
    "banner-acting-as": color("oklch(0.5 0.17 350)", "oklch(0.72 0.15 350)"),
    "banner-acting-as-foreground": ON_STATUS,
    // ADR 0340 decision 9: a categorical chart set at 3:1 or more against the surface in both schemes, so a product
    // accent never pushes a chart under it. On the web the names are HeroUI Pro's own chart properties.
    "chart-1": color("oklch(0.55 0.12 248)", "oklch(0.72 0.11 248)"),
    "chart-2": color("oklch(0.6 0.1 185)", "oklch(0.78 0.11 185)"),
    "chart-3": color("oklch(0.52 0.16 300)", "oklch(0.7 0.14 300)"),
    "chart-4": color("oklch(0.62 0.15 55)", "oklch(0.78 0.14 60)"),
    "chart-5": color("oklch(0.55 0.17 355)", "oklch(0.72 0.15 355)"),
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
  // ADR 0320: text on a level keeps at least the regular fill's share of the surface behind it, so its contrast
  // holds over the light ambient tints; the thin level is for chrome without reading text.
  materials: {
    levels: {
      thin: { fill: { light: 0.6, dark: 0.62 }, blur: "12px", saturation: 1.6 },
      regular: { fill: { light: 0.78, dark: 0.8 }, blur: "20px", saturation: 1.6 },
      thick: { fill: { light: 0.9, dark: 0.92 }, blur: "28px", saturation: 1.4 },
    },
    edge: { light: 0.1, dark: 0.12 },
    highlight: { light: 0.7, dark: 0.09 },
  },
});
