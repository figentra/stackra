/**
 * Stackra file contract:
 * Purpose: `GuardrailResult`, what `runGuardrails` answers: pass with the text the model may see (after every redacting
 *          layer) and the flags raised, or the first layer that blocked and its reason.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); STA-1377 (stackra-219).
 */

/** The answer of the guardrail layers. */
export type GuardrailResult =
  | {
      /** Every layer passed. */
      readonly pass: true;
      /** The text after every redacting layer; send this, not the original. */
      readonly text: string;
      /** Each flag raised, with the layer that raised it, in layer order. */
      readonly flags: readonly { readonly guardrail: string; readonly reason: string }[];
    }
  | {
      /** A layer blocked. */
      readonly pass: false;
      /** The name of the layer that blocked. */
      readonly guardrail: string;
      /** Its reason. */
      readonly reason: string;
    };
