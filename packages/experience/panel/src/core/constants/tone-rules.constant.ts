/**
 * Stackra file contract:
 * Purpose: `TONE_RULES`, what a KPI's tone callback receives: the runtime side of `ToneRules`.
 * Boundary: internal: each method returns one frozen rule; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15: threshold tones).
 */
import type { Tone } from "@stackra/contracts";

import type { ToneRule } from "#core/types/tone-rule.type";
import type { ToneRules } from "#core/types/tone-rules.type";

/** The tone rule builders. */
export const TONE_RULES: ToneRules = Object.freeze({
  belowTarget: (ratio: number, tone: Tone): ToneRule => Object.freeze({ belowTarget: ratio, tone }),
  aboveTarget: (ratio: number, tone: Tone): ToneRule => Object.freeze({ aboveTarget: ratio, tone }),
  below: (value: number, tone: Tone): ToneRule => Object.freeze({ below: value, tone }),
  above: (value: number, tone: Tone): ToneRule => Object.freeze({ above: value, tone }),
});
