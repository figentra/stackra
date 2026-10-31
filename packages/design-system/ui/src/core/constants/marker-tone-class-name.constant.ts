/**
 * Stackra file contract:
 * Purpose: `MARKER_TONE_CLASS_NAME`, the tinted fill each tone draws behind a small icon or label (a timeline marker, a
 *          result icon, a scheduler event): each tone's soft fill and soft label, the pair the theme holds at 4.5:1.
 * Boundary: data only; the colours are the theme's roles, so light, dark and every brand follow.
 * Runtime: isomorphic
 * Governing contract: ADR 0302; WCAG 2.2 SC 1.4.3 and 1.4.11; STA-1371 (wave A, owner request 2026-10-29).
 */

/** The disc classes of each tone. */
export const MARKER_TONE_CLASS_NAME = Object.freeze({
  default: "bg-default text-foreground",
  accent: "bg-accent-soft text-accent-soft-foreground",
  // The soft label, not the solid tone: amber or green as 12 px text on its own tint is under 4.5:1.
  success: "bg-success-soft text-success-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  danger: "bg-danger-soft text-danger-soft-foreground",
} as const satisfies Record<Tone, string>);
import type { Tone } from "@stackra/contracts";
