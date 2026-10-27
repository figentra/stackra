/**
 * Stackra file contract:
 * Purpose: the `GuardrailLayer` port, the base the shipped guardrail drivers extend (`Driver(GuardrailLayer)`): one
 *          layer that checks a model's input or output, the `Guardrail` shape `runGuardrails` takes.
 * Boundary: an abstract class that is its own token, keyed `ai.GuardrailLayer`. `Guardrail` stays the structural type
 *           `runGuardrails` accepts, so a service may still pass its own layer as a plain object. In `core`, not
 *           `contracts`, because it speaks `GuardrailVerdict`, a core type.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: layered guardrails); ADR 0294 (decisions 4 and 16; R3: drivers extend
 *                     `Driver(Port)`); STA-1377 (stackra-219).
 */
import { Port } from "@stackra/contracts";

import type { Guardrail } from "#core/types/guardrail.type";
import type { GuardrailVerdict } from "#core/types/guardrail-verdict.type";

/**
 * One guardrail layer.
 *
 * @example
 * class TopicGuardrailDriver extends Driver(GuardrailLayer) { ... }
 */
export abstract class GuardrailLayer extends Port implements Guardrail {
  /** Type-only port key, so `DriverName<GuardrailLayer>` narrows to this port's drivers. */
  declare readonly "~key": "ai.GuardrailLayer";

  /** The layer's name, recorded with a block or flag. */
  abstract readonly name: string;

  /** Checks `text` at `stage` and answers the layer's verdict. */
  abstract check(
    text: string,
    stage: "input" | "output",
  ): GuardrailVerdict | Promise<GuardrailVerdict>;
}
