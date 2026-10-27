/**
 * Stackra file contract:
 * Purpose: `GuardrailVerdict`, one guardrail's answer: pass (optionally with the text redacted and flags raised), or
 *          block with a reason.
 * Boundary: a type only. A redacting layer answers the replaced text, which the next layer checks; a flag is a reason
 *           code for the run's evidence, never the caught text itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: layered guardrails); STA-1377 (stackra-219).
 */

/** A guardrail's answer. */
export type GuardrailVerdict =
  | {
      /** The text may go on. */
      readonly pass: true;
      /** The text with the caught parts replaced; the text as given when absent. */
      readonly text?: string;
      /** Reason codes of what the layer caught but let through. */
      readonly flags?: readonly string[];
    }
  | {
      /** The text is blocked. */
      readonly pass: false;
      /** Why, for the run's evidence; never the blocked text itself. */
      readonly reason: string;
    };
