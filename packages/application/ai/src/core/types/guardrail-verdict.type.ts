/**
 * Stackra file contract:
 * Purpose: `GuardrailVerdict`, one guardrail's answer: pass, or block with a reason.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: layered guardrails).
 */

/** A guardrail's answer. */
export type GuardrailVerdict =
  | {
      /** The text may go on. */
      readonly pass: true;
    }
  | {
      /** The text is blocked. */
      readonly pass: false;
      /** Why, for the run's evidence; never the blocked text itself. */
      readonly reason: string;
    };
