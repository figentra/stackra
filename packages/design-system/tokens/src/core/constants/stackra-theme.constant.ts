/**
 * Stackra file contract:
 * Purpose: the stackra theme, the default theme of the Stackra Design System. Its oklch values come unchanged from
 *          the approved Stackra brand kit 0.1.0, which @stackra/brand vendored until it was retired; the theme's test
 *          holds every colour to a frozen in-code snapshot of them and every WCAG minimum of the kit's contrast report
 *          to `STACKRA_CONTRAST_PAIRS` (ADR 0340 decision 8). One documented deviation: light `muted` is 0.49, not the
 *          kit's 0.5 (owner decision 2026-10-23). Each hex is derived from its oklch value (`oklchToHex`), never
 *          typed, so the two cannot disagree.
 * Boundary: data only. The accent is the brand's neutral steel (ADR 0463, superseding ADR 0319 decision 1; brand
 *          rules §31): the accent, its hover, pressed and soft steps and the focus ring sit at oklch hue 252 and chroma
 *          0.03 or less, with paper or ink on the accent at 4.5:1 or more; the link and the signal stay neutral.
 *          Graphite carries the neutral states and, as an alias, the dark `segment` role. The environment banners and the chart set are ADR 0340 decision 9's
 *          tokens. The theme names no product or family (decision 8): the amber bar a mark draws is `amber-strong`.
 *          The display text and the headings (display, h1 to h6 and their Arabic twins) are set in the `display` and
 *          `displayArabic` stacks, which this theme leaves to their defaults (Geist and IBM Plex Sans Arabic), so a
 *          brand that sets its display faces changes its headings (STA-1386, brand rules §33).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0024 (the brand assets stay all rights reserved); ADR 0340
 *          (decisions 8 and 9); ADR 0463 (the neutral steel accent; ADR 0319 decisions 2 and 3 stand).
 */
import type { ColorToken } from "#contracts/types/color-token.type";
import { FIELD_BORDER_WIDTH } from "#core/constants/field-border-width.constant";
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
// ADR 0463 (brand rules §31): neutral steel, #647282 light and #A7B6C7 dark. Paper on it is 4.53:1 (light), ink on it
// 9.42:1 (dark).
const ACCENT = color("oklch(0.546 0.03 252)", "oklch(0.77 0.03 252)");

/** The stackra theme: a neutral steel accent, Geist and IBM Plex Sans Arabic, a 4px spacing step and a 0.25rem radius. */
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
    "accent-hover": color("oklch(0.5 0.03 252)", "oklch(0.72 0.03 252)"),
    "accent-pressed": color("oklch(0.45 0.03 252)", "oklch(0.67 0.03 252)"),
    "accent-soft": color("oklch(0.94 0.012 252)", "oklch(0.29 0.015 252)"),
    "accent-soft-foreground": color("oklch(0.4 0.03 252)", "oklch(0.88 0.02 252)"),
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
    // accent never pushes a chart under it. Neighbours step in lightness as well as hue (blue mid, teal light, violet
    // dark, orange light, pink mid), so the set stays apart under protan, deutan and tritan vision: the closest pair
    // keeps an OKLab distance of 0.09 or more in both schemes. Read by @stackra/ui's charts as `var(--chart-<n>)`.
    "chart-1": color("oklch(0.5 0.13 252)", "oklch(0.7 0.12 252)"),
    "chart-2": color("oklch(0.64 0.11 185)", "oklch(0.86 0.11 185)"),
    "chart-3": color("oklch(0.4 0.15 300)", "oklch(0.6 0.17 300)"),
    "chart-4": color("oklch(0.65 0.15 55)", "oklch(0.8 0.14 60)"),
    "chart-5": color("oklch(0.54 0.18 355)", "oklch(0.68 0.17 355)"),
  },
  // No display stacks: they default to sans and arabic, and a brand's theme.json sets its own (brand rules §33).
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
      family: "display",
      letterSpacing: "-0.035em",
    },
    h1: {
      weight: 600,
      size: "40px",
      lineHeight: "1.1",
      family: "display",
      letterSpacing: "-0.03em",
    },
    h2: {
      weight: 600,
      size: "28px",
      lineHeight: "1.2",
      family: "display",
      letterSpacing: "-0.02em",
    },
    h3: {
      weight: 600,
      size: "20px",
      lineHeight: "1.3",
      family: "display",
      letterSpacing: "-0.015em",
    },
    // h4 to h6 are ADR 0303 decision 9: HeroUI's own h4 is 20px, the size of our h3, so the scale defines its tail.
    h4: {
      weight: 600,
      size: "18px",
      lineHeight: "1.4",
      family: "display",
      letterSpacing: "-0.01em",
    },
    h5: { weight: 600, size: "16px", lineHeight: "1.5", family: "display", letterSpacing: "0em" },
    h6: { weight: 600, size: "14px", lineHeight: "1.5", family: "display", letterSpacing: "0em" },
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
      family: "displayArabic",
      letterSpacing: "0em",
    },
    "h1-ar": {
      weight: 600,
      size: "38px",
      lineHeight: "1.35",
      family: "displayArabic",
      letterSpacing: "0em",
    },
    "h2-ar": {
      weight: 600,
      size: "30px",
      lineHeight: "1.4",
      family: "displayArabic",
      letterSpacing: "0em",
    },
    "h3-ar": {
      weight: 600,
      size: "21px",
      lineHeight: "1.5",
      family: "displayArabic",
      letterSpacing: "0em",
    },
    // The Arabic twins of h4 to h6 are one pixel and 0.2 of line height above their Latin style (decision 9).
    "h4-ar": {
      weight: 600,
      size: "19px",
      lineHeight: "1.6",
      family: "displayArabic",
      letterSpacing: "0em",
    },
    "h5-ar": {
      weight: 600,
      size: "17px",
      lineHeight: "1.7",
      family: "displayArabic",
      letterSpacing: "0em",
    },
    "h6-ar": {
      weight: 600,
      size: "15px",
      lineHeight: "1.7",
      family: "displayArabic",
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
  // Tailwind v4's own scale, so the utilities every component draws (`text-sm`, `font-medium`, `tracking-tight`) read
  // the theme; `3xs`, `2xs` and `code` are the small steps charts, badges and code frames used to hard-code.
  typeScale: {
    sizes: {
      "3xs": { size: "0.625rem", lineHeight: "1.4" },
      "2xs": { size: "0.6875rem", lineHeight: "1.4" },
      xs: { size: "0.75rem", lineHeight: "1.3333" },
      code: { size: "0.8125rem", lineHeight: "1.5" },
      sm: { size: "0.875rem", lineHeight: "1.4286" },
      base: { size: "1rem", lineHeight: "1.5" },
      lg: { size: "1.125rem", lineHeight: "1.5556" },
      xl: { size: "1.25rem", lineHeight: "1.4" },
      "2xl": { size: "1.5rem", lineHeight: "1.3333" },
      "3xl": { size: "1.875rem", lineHeight: "1.2" },
      "4xl": { size: "2.25rem", lineHeight: "1.1111" },
      "5xl": { size: "3rem", lineHeight: "1" },
      "6xl": { size: "3.75rem", lineHeight: "1" },
      // A KPI or stat value: Stackra's 30px figure, set tight.
      metric: { size: "1.875rem", lineHeight: "1.2", weight: 600, tracking: "-0.02em" },
    },
    weights: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 },
    tracking: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    },
    leading: { tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625", loose: "2" },
    numeric: "tabular-nums",
    // No utility adjustment: Stackra's Arabic sizing lives in the `-ar` text styles; a brand may scale the utilities.
    arabic: { scale: 1, leading: 0 },
  },
  // HeroUI's desktop ladder (32, 36, 40) on Tailwind's unit, so density moves the controls with the padding.
  layout: {
    spacing: "0.25rem",
    controlHeight: {
      sm: "calc(var(--spacing) * 8)",
      md: "calc(var(--spacing) * 9)",
      lg: "calc(var(--spacing) * 10)",
    },
    iconSize: { sm: "1rem", md: "1.25rem", lg: "1.5rem" },
    touchTarget: "24px",
    page: { padding: "1.5rem", gutter: "1rem", contentMaxWidth: "80rem" },
    breakpoints: { sm: "40rem", md: "48rem", lg: "64rem", xl: "80rem", "2xl": "96rem" },
    borderWidth: "1px",
    fieldBorderWidth: FIELD_BORDER_WIDTH,
    cornerShape: "round",
    vibrant: false,
    cursor: "pointer",
    skeleton: "shimmer",
    animations: true,
    focusRing: { width: "2px", offset: "2px", style: "solid" },
    state: { hover: "0.08", press: "0.12", focus: "0.12", selected: "0.16", drag: "0.16" },
    opacity: { disabled: "0.5", dimmed: "0.5", muted: "0.6", subtle: "0.4" },
    sizes: {
      "table-header": "calc(var(--spacing) * 9)",
      "app-header": "calc(var(--spacing) * 14)",
      "icon-tile": "calc(var(--spacing) * 9)",
      "step-indicator": "calc(var(--spacing) * 8)",
      "timeline-marker": "calc(var(--spacing) * 8)",
      "action-bar": "calc(var(--spacing) * 11)",
      readout: "8.75rem",
      "drawer-sm": "25rem",
      "drawer-md": "35rem",
      "drawer-lg": "45rem",
      "dialog-sm": "20rem",
      "dialog-md": "28rem",
      "dialog-lg": "36rem",
      "dialog-max-height": "30rem",
      panel: "22rem",
    },
    zIndex: {
      behind: "-1",
      // The base of a component's own order: a pinned column over the cells scrolling under it.
      pinned: "2",
      raised: "10",
      sticky: "20",
      dock: "30",
      float: "40",
      overlay: "50",
      toast: "60",
      tooltip: "70",
    },
    regions: {
      sidebar: "surface",
      "sidebar-foreground": "surface-foreground",
      tray: "surface-secondary",
      "tray-body": "surface",
      scrim: "backdrop",
      "level-0": "background",
      "level-1": "surface",
      "level-2": "surface-secondary",
      "level-3": "surface-tertiary",
      "level-4": "overlay",
      selection: "accent-soft",
      "selection-foreground": "accent-soft-foreground",
      "chart-single": "accent",
    },
  },
  locale: { mirrorIcons: true, digits: "latn" },
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
    // The lift the segment thumb and the small floating marks drew with Tailwind's `shadow-sm`, now a token.
    raised: {
      light: "0px 1px 3px 0px oklch(0 0 0 / 0.1), 0px 1px 2px -1px oklch(0 0 0 / 0.1)",
      dark: "0px 1px 3px 0px oklch(0 0 0 / 0.4), 0px 1px 2px -1px oklch(0 0 0 / 0.4)",
    },
    pressed: {
      light: "inset 0px 1px 2px 0px oklch(0 0 0 / 0.1)",
      dark: "inset 0px 1px 2px 0px oklch(0 0 0 / 0.3)",
    },
    // Glass chrome (ADR 0320 as amended 2026-10-31): in dark, depth comes from the rim and the surface ladder.
    floating: {
      light:
        "0px 8px 24px -6px oklch(0.158 0.005 248 / 0.14), 0px 2px 6px -2px oklch(0.158 0.005 248 / 0.08)",
      dark: "0px 10px 30px -8px oklch(0 0 0 / 0.55)",
    },
  },
  motion: {
    // One leg of a shake or a morph.
    tick: { duration: "50ms", easing: "linear" },
    // A colour or background change.
    instant: { duration: "100ms", easing: "ease-out" },
    fast: { duration: "150ms", easing: "ease-out" },
    // A small move: a rail opening, a chevron turning, a dot growing.
    moderate: { duration: "200ms", easing: "ease-out" },
    base: { duration: "250ms", easing: "ease-in-out" },
    // A panel or a larger surface moving.
    slow: { duration: "300ms", easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    // A selection indicator sliding between items (tabs, segments, the active nav pill).
    indicator: { duration: "250ms", easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
    blink: { duration: "1000ms", easing: "steps(1)" },
    // A looping attention cue (a live dot, a beacon).
    pulse: { duration: "1200ms", easing: "ease-in-out" },
    // An attention move that settles (a bell wiggle, rings sweeping in).
    emphasis: { duration: "600ms", easing: "ease-in-out" },
    // How long a confirmation holds before it returns (a morph button's success state).
    hold: { duration: "1500ms", easing: "linear" },
    // The pause before a hover card opens, and before it closes once the pointer leaves.
    "hover-open": { duration: "500ms", easing: "linear" },
    "hover-close": { duration: "200ms", easing: "linear" },
    // A number counting to its value.
    count: { duration: "900ms", easing: "ease-out" },
    // An entrance (Reveal, a chart drawing in): quick to start, long to settle.
    reveal: { duration: "400ms", easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    // The delay between items revealed in a row; only its duration is read.
    stagger: { duration: "40ms", easing: "linear" },
    // ADR 0501's duration scale is instant, fast, base, slow, slower; the other steps are named roles beside it.
    slower: { duration: "450ms", easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
    // An overlay (drawer, sheet, modal) arriving and leaving, on the fluid curve HeroUI measures at 250ms and 200ms.
    "overlay-in": { duration: "250ms", easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
    "overlay-out": { duration: "200ms", easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
    // A toast rising from its edge and leaving (HeroUI: 350ms in, 300ms kept mounted out).
    "toast-in": { duration: "350ms", easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
    "toast-out": { duration: "300ms", easing: "cubic-bezier(0.4, 0, 1, 1)" },
  },
  // ADR 0501, the motion family: the springs keep the feel the segment thumb (snappy) and the tab indicator (bouncy)
  // already played.
  animation: {
    easings: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      emphasized: "cubic-bezier(0.32, 0.72, 0, 1)",
      enter: "cubic-bezier(0.22, 1, 0.36, 1)",
      exit: "cubic-bezier(0.4, 0, 1, 1)",
    },
    springs: {
      gentle: { stiffness: 120, damping: 20, mass: 1 },
      snappy: { stiffness: 260, damping: 22, mass: 0.8 },
      bouncy: { stiffness: 220, damping: 16, mass: 1 },
      // Measured in the HeroUI Pro study (2026-10-31): a pointer-following tilt, a return to rest flat at about 550ms
      // with no overshoot, a heavy card turn with a small rebound, and a morphing control (FAB, morph button).
      follow: { stiffness: 180, damping: 28, mass: 1 },
      settle: { stiffness: 120, damping: 22, mass: 1 },
      flip: { stiffness: 60, damping: 12, mass: 1.2 },
      morph: { stiffness: 300, damping: 25, mass: 0.8 },
      // ADR 0320 as amended 2026-10-31: Apple's default (damping 1.0, response 0.35s) for popovers, menus, toasts and tab
      // content, and its drawer spring (0.85, 0.3s) for sheets; stiffness (2π/response)², damping 2ζ√k at mass 1.
      default: { stiffness: 322, damping: 36, mass: 1 },
      sheet: { stiffness: 439, damping: 35.6, mass: 1 },
    },
    pressScale: 0.97,
    enterDistance: "8px",
  },
  haptics: {
    selection: "selection",
    light: "impact-light",
    impact: "impact-light",
    medium: "impact-medium",
    rigid: "impact-rigid",
    success: "notification-success",
    warning: "notification-warning",
    error: "notification-error",
  },
  // ADR 0501, accessibility modes. More contrast darkens the quiet text and every edge to 4.5:1 or more; the safe
  // chart palette is Okabe and Ito's hues (darkened in light to 3:1 on the surface), told apart under every common colour-vision deficiency.
  accessibility: {
    contrast: {
      muted: color("oklch(0.36 0.01 250)", "oklch(0.86 0.006 250)"),
      "field-placeholder": color("oklch(0.36 0.01 250)", "oklch(0.86 0.006 250)"),
      "field-border": color("oklch(0.3 0.008 250)", "oklch(0.86 0.006 250)"),
      border: color("oklch(0.3 0.008 250)", "oklch(0.86 0.006 250)"),
      separator: color("oklch(0.45 0.008 250)", "oklch(0.7 0.008 250)"),
      focus: FOREGROUND,
    },
    textScales: { large: 1.125, larger: 1.25, largest: 1.5 },
    chartSafe: [
      color("oklch(0.532 0.131 244)", "oklch(0.735 0.117 236.2)"),
      color("oklch(0.6 0.13 70)", "oklch(0.753 0.158 76.8)"),
      color("oklch(0.55 0.115 165.5)", "oklch(0.62 0.13 165.5)"),
      color("oklch(0.56 0.13 346.3)", "oklch(0.679 0.118 346.3)"),
      color("oklch(0.58 0.17 45)", "oklch(0.902 0.172 105)"),
    ],
  },
  // ADR 0320: text on a level keeps at least the regular fill's share of the surface behind it, so its contrast
  // holds over the light ambient tints; the thin level is for chrome without reading text.
  materials: {
    levels: {
      // Glyphs over art only, never body text.
      "ultra-thin": {
        fill: { light: 0.4, dark: 0.45 },
        blur: "8px",
        saturation: 1.8,
        edge: { light: 0.08, dark: 0.1 },
        rim: { light: 0.5, dark: 0.06 },
        vibrancy: ["glyph"],
      },
      thin: {
        fill: { light: 0.6, dark: 0.62 },
        blur: "12px",
        saturation: 1.6,
        // No reading text (ADR 0320): foreground falls to 3:1 over white in dark liquid.
        vibrancy: ["glyph"],
      },
      regular: {
        fill: { light: 0.78, dark: 0.8 },
        blur: "20px",
        saturation: 1.6,
        elevation: "raised",
        vibrancy: ["primary", "glyph"],
      },
      thick: {
        fill: { light: 0.9, dark: 0.92 },
        blur: "28px",
        saturation: 1.4,
        elevation: "raised",
        vibrancy: ["primary", "secondary", "tertiary", "glyph"],
      },
      // The functional layer: the regular fill (so its 4.5:1 proof carries over) with the rim, the specular, the
      // inner depth and the floating shadow.
      glass: {
        fill: { light: 0.78, dark: 0.8 },
        blur: "24px",
        saturation: 1.8,
        tint: 0.04,
        brightness: 1.04,
        edge: { light: 0.08, dark: 0.14 },
        rim: { light: 0.8, dark: 0.12 },
        specular: 0.35,
        innerDepth: { y: "1px", blur: "2px", alpha: { light: 0.04, dark: 0.2 } },
        elevation: "floating",
        vibrancy: ["primary", "glyph"],
      },
      // Controls over media, always over the black dim; the floors (0.50 glyphs, 0.55 labels) raise Apple's 0.35.
      "glass-clear": {
        fill: { light: 0, dark: 0 },
        blur: "6px",
        saturation: 1.8,
        tintSource: "none",
        edge: { light: 0.14, dark: 0.14 },
        rim: { light: 0.4, dark: 0.4 },
        specular: 0.35,
        dim: 0.35,
        vibrancy: ["glyph", "on-media"],
      },
    },
    edge: { light: 0.1, dark: 0.12 },
    highlight: { light: 0.7, dark: 0.09 },
    // Product UI stays opaque until it opts in (ADR 0320 decision 1 as amended): the dashboard family, solid.
    family: "studio",
    defaultMode: "solid",
  },
  // The 24px-grid stroke by the weight of the text beside the icon.
  iconStroke: { "400": 1.5, "500": 1.75, "600": 2, "700": 2 },
});
