/**
 * Stackra file contract:
 * Purpose: `Guardrail`, the port of one guardrail layer: it checks a model's input before the call or its output
 *          after it.
 * Boundary: a type only. A layer is a driver the service binds (a classifier, a policy model, a pattern list); the
 *           layers run in the order bound through `runGuardrails`.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4).
 */
import type { GuardrailVerdict } from "#core/types/guardrail-verdict.type";

/** One guardrail layer. */
export interface Guardrail {
  /** The layer's name, recorded with a block. */
  readonly name: string;

  /**
   * Checks `text` and returns the guardrail's verdict on it.
   *
   * @param text - the prompt before the call or the answer after it.
   * @param stage - which of the two `text` is.
   */
  check(text: string, stage: "input" | "output"): GuardrailVerdict | Promise<GuardrailVerdict>;
}
