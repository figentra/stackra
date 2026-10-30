/**
 * Stackra file contract:
 * Purpose: `CONTRAST_PAIRS`: the pairs the studio's contrast report measures, by painted name: the catalogue id of its
 *          label, the pair and the ratio it needs.
 * Boundary: data only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0340 (decision 4: what is painted); WCAG 2.2 SC 1.4.3, 1.4.11.
 */
import type { ContrastPair } from "@stackra/tokens/contracts";

/** The pairs the report measures. */
export const CONTRAST_PAIRS = [
  { id: "text", fg: "foreground", bg: "background", min: 4.5 },
  { id: "muted", fg: "muted", bg: "background", min: 4.5 },
  { id: "surface", fg: "surface-foreground", bg: "surface", min: 4.5 },
  { id: "accent", fg: "accent-foreground", bg: "accent", min: 4.5 },
  { id: "accent_hover", fg: "accent-foreground", bg: "accent-hover", min: 4.5 },
  { id: "accent_soft", fg: "accent-soft-foreground", bg: "accent-soft", min: 4.5 },
  { id: "link", fg: "link", bg: "background", min: 4.5 },
  { id: "field", fg: "field-foreground", bg: "field-background", min: 4.5 },
  { id: "warning_hover", fg: "warning-foreground", bg: "warning-hover", min: 4.5 },
  { id: "danger", fg: "danger-foreground", bg: "danger", min: 4.5 },
  { id: "danger_soft", fg: "danger-soft-foreground", bg: "danger-soft", min: 4.5 },
  { id: "field_edge", fg: "field-border", bg: "field-background", min: 3 },
  { id: "focus", fg: "focus", bg: "background", min: 3 },
] as const satisfies readonly (ContrastPair & { id: string })[];
