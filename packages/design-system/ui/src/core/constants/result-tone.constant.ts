/**
 * Stackra file contract:
 * Purpose: `RESULT_TONE`, the tone each Result status is drawn in.
 * Boundary: data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A).
 */

/** The tone of each status. */
export const RESULT_TONE = Object.freeze({
  success: "success",
  error: "danger",
  info: "accent",
  pending: "default",
} as const satisfies Record<string, Tone>);
import type { Tone } from "@stackra/contracts";
