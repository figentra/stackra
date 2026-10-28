/**
 * Stackra file contract:
 * Purpose: `ToneRules`, what a KPI's tone callback receives: thresholds against the target or against a value.
 * Boundary: a type only; each method returns one rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15: threshold tones).
 */
import type { Tone } from "@stackra/contracts";

import type { ToneRule } from "#core/types/tone-rule.type";

/** Builds a KPI's threshold tones. */
export interface ToneRules {
  /** `tone` when the value is under `ratio` of the target. */
  belowTarget: (ratio: number, tone: Tone) => ToneRule;

  /** `tone` when the value is at or over `ratio` of the target. */
  aboveTarget: (ratio: number, tone: Tone) => ToneRule;

  /** `tone` when the value is under `value`. */
  below: (value: number, tone: Tone) => ToneRule;

  /** `tone` when the value is at or over `value`. */
  above: (value: number, tone: Tone) => ToneRule;
}
