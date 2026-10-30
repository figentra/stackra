/**
 * Stackra file contract:
 * Purpose: `MARKER_TONE_CLASS_NAME`, the tinted disc each tone draws behind a small icon (a timeline marker, a result
 *          icon): a soft background and the tone's own foreground, the accent as its soft label for contrast.
 * Boundary: data only; the colours are the theme's roles, so light, dark and every brand follow.
 * Runtime: isomorphic
 * Governing contract: ADR 0302; WCAG 2.2 SC 1.4.11; STA-1371 (wave A, owner request 2026-10-29).
 */

/** The disc classes of each tone. */
export const MARKER_TONE_CLASS_NAME = Object.freeze({
  default: "bg-default text-foreground",
  accent: "bg-accent-soft text-accent-soft-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
} as const satisfies Record<Tone, string>);import type { Tone } from "@stackra/contracts";

