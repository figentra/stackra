/**
 * Stackra file contract:
 * Purpose: `GuardrailResult`, what `runGuardrails` answers: pass, or the first layer that blocked and its reason.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4).
 */

/** The answer of the guardrail layers. */
export type GuardrailResult =
  | {
      /** Every layer passed. */
      readonly pass: true;
    }
  | {
      /** A layer blocked. */
      readonly pass: false;
      /** The name of the layer that blocked. */
      readonly guardrail: string;
      /** Its reason. */
      readonly reason: string;
    };
