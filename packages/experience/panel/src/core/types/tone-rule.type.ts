/**
 * Stackra file contract:
 * Purpose: `ToneRule`, one threshold that colours a KPI: below or above a ratio of its target, or below or above a value.
 * Boundary: a type only; built by the tone callback of a KPI. The first rule that matches wins; a rule against the target
 *           never matches a metric without one.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15: the display adds threshold tones).
 */
import type { Tone } from "@stackra/contracts";

/** One KPI threshold and its tone. */
export type ToneRule =
  | {
      /** Matches a value under this share of the target. */
      readonly belowTarget: number;
      /** The tone when it matches. */
      readonly tone: Tone;
    }
  | {
      /** Matches a value at or over this share of the target. */
      readonly aboveTarget: number;
      /** The tone when it matches. */
      readonly tone: Tone;
    }
  | {
      /** Matches a value under this number. */
      readonly below: number;
      /** The tone when it matches. */
      readonly tone: Tone;
    }
  | {
      /** Matches a value at or over this number. */
      readonly above: number;
      /** The tone when it matches. */
      readonly tone: Tone;
    };
