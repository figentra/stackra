/**
 * Stackra file contract:
 * Purpose: the contrast pairs every theme check measures (ADR 0340 decision 4): HeroUI's role pairs as the components
 *          paint them, in both schemes. Text holds 4.5:1 on each surface, on each solid role and its hover, and on each
 *          soft fill HeroUI derives; the focus ring and the field edge hold 3:1 (WCAG 1.4.11).
 * Boundary: roles and HeroUI's derived names only, so any theme can be measured; a theme's palette pairs (its own
 *           accent steps, marks and signals) belong to that theme's tests, and a policy adds its own pairs.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 3 and 4); WCAG 2.2 (1.4.3, 1.4.11).
 */
import type { ContrastPair } from "#contracts/types/contrast-pair.type";

const text = (fg: string, bg: string): ContrastPair => ({ fg, bg, min: 4.5 });
const edge = (fg: string, bg: string): ContrastPair => ({ fg, bg, min: 3 });

/** The pairs `checkTheme` measures when it is given none. */
export const DEFAULT_CONTRAST_PAIRS: readonly ContrastPair[] = Object.freeze([
  text("foreground", "background"),
  text("muted", "background"),
  text("link", "background"),
  text("surface-foreground", "surface"),
  text("surface-foreground", "surface-hover"),
  text("muted", "surface"),
  text("surface-secondary-foreground", "surface-secondary"),
  text("surface-tertiary-foreground", "surface-tertiary"),
  text("overlay-foreground", "overlay"),
  text("default-foreground", "default"),
  text("default-foreground", "default-hover"),
  text("accent-foreground", "accent"),
  text("accent-foreground", "accent-hover"),
  text("accent-soft-foreground", "accent-soft"),
  text("success-foreground", "success"),
  text("success-foreground", "success-hover"),
  text("success-soft-foreground", "success-soft"),
  text("warning-foreground", "warning"),
  text("warning-foreground", "warning-hover"),
  text("warning-soft-foreground", "warning-soft"),
  text("danger-foreground", "danger"),
  text("danger-foreground", "danger-hover"),
  text("danger-soft-foreground", "danger-soft"),
  text("field-foreground", "field-background"),
  text("field-foreground", "field-hover"),
  text("field-placeholder", "field-background"),
  text("segment-foreground", "segment"),
  edge("focus", "background"),
  edge("field-border", "field-background"),
]);
