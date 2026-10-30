/**
 * Stackra file contract:
 * Purpose: the stackra theme's own contrast pairs (ADR 0340 decision 8): every WCAG minimum of the approved brand
 *          kit's contrast report, moved into code when the kit's reports left the package, with the palette pairs the
 *          defaults leave out (the accent steps, the signal, the tile ink, the strong amber), the segment pair the kit
 *          predates, and decision 9's banner and chart pairs. `checkTheme(STACKRA_THEME, STACKRA_CONTRAST_PAIRS)` finds
 *          nothing, and the foundations page shows each role's pair from here.
 * Boundary: data only; names the stackra theme's palette, so it measures that theme and its layers, not any theme
 *           (`DEFAULT_CONTRAST_PAIRS` does that). A policy adds its own pairs on top.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 4, 8 and 9); WCAG 2.2 (1.4.3 text, 1.4.11 non-text).
 */
import type { ContrastPair } from "#contracts/types/contrast-pair.type";

const text = (fg: string, bg: string): ContrastPair => ({ fg, bg, min: 4.5 });
const edge = (fg: string, bg: string): ContrastPair => ({ fg, bg, min: 3 });

/** The pairs the stackra theme holds in both schemes. */
export const STACKRA_CONTRAST_PAIRS: readonly ContrastPair[] = Object.freeze([
  // Text on the page and its surfaces.
  text("foreground", "background"),
  text("muted", "background"),
  text("link", "background"),
  text("accent", "background"),
  text("success", "background"),
  text("warning", "background"),
  text("danger", "background"),
  text("surface-foreground", "surface"),
  text("muted", "surface"),
  text("link", "surface"),
  text("accent", "surface"),
  text("success", "surface"),
  text("warning", "surface"),
  text("danger", "surface"),
  text("surface-secondary-foreground", "surface-secondary"),
  text("muted", "surface-secondary"),
  text("link", "surface-secondary"),
  text("success", "surface-secondary"),
  text("warning", "surface-secondary"),
  text("danger", "surface-secondary"),
  text("surface-tertiary-foreground", "surface-tertiary"),
  text("muted", "surface-tertiary"),
  text("overlay-foreground", "overlay"),
  text("link", "overlay"),
  text("default-foreground", "default"),
  text("muted", "default"),
  text("field-foreground", "field-background"),
  text("field-placeholder", "field-background"),
  text("segment-foreground", "segment"),
  // Labels on the solid colours and the accent's steps.
  text("accent-foreground", "accent"),
  text("accent-foreground", "accent-hover"),
  text("accent-foreground", "accent-pressed"),
  text("accent-soft-foreground", "accent-soft"),
  text("link", "accent-soft"),
  // The accent as text (a link's or a caption's accent tone) is its soft label, which a light accent keeps legible.
  text("accent-soft-foreground", "background"),
  text("accent-soft-foreground", "surface"),
  text("muted", "accent-soft"),
  text("success-foreground", "success"),
  text("warning-foreground", "warning"),
  text("danger-foreground", "danger"),
  text("signal-foreground", "signal"),
  // The environment banners (decision 9).
  text("banner-sandbox-foreground", "banner-sandbox"),
  text("banner-staging-foreground", "banner-staging"),
  text("banner-acting-as-foreground", "banner-acting-as"),
  // Focus rings, field edges and marks.
  edge("focus", "background"),
  edge("focus", "surface"),
  edge("focus", "surface-secondary"),
  edge("focus", "accent-soft"),
  edge("field-border", "background"),
  edge("field-border", "surface"),
  edge("field-border", "field-background"),
  edge("amber-strong", "background"),
  edge("amber-strong", "surface"),
  edge("stk-ink", "background"),
  edge("stk-ink", "surface"),
  edge("stk-ink", "stk-tile"),
  // The chart set against the surface (decision 9).
  edge("chart-1", "surface"),
  edge("chart-2", "surface"),
  edge("chart-3", "surface"),
  edge("chart-4", "surface"),
  edge("chart-5", "surface"),
]);
