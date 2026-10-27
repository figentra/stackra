/**
 * Stackra file contract:
 * Purpose: `GuardrailStages<E>`, the effect a guardrail layer has on a model's input and on its output.
 * Boundary: a type only; settings data the service passes to a layer. A stage left out is not checked by that layer.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); STA-1377 (stackra-219).
 */
import type { GuardrailEffect } from "#core/enums/guardrail-effect.enum";

/** A layer's effect per stage. */
export interface GuardrailStages<E extends GuardrailEffect = GuardrailEffect> {
  /** The effect on the prompt before the call; not checked when absent. */
  readonly input?: E;

  /** The effect on the answer after the call; not checked when absent. */
  readonly output?: E;
}
