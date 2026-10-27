/**
 * Stackra file contract:
 * Purpose: `GuardrailEffect`, what a guardrail layer does with text it catches: block it, pass it with the caught
 *          parts redacted, or pass it unchanged with a flag for the run's evidence.
 * Boundary: an enum (`Enum.of`). Which effect a layer has at each stage is configuration (`GuardrailStages`) the
 *           service passes from settings; a layer with no effect for a stage skips that stage.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: layered guardrails); STA-1377 (stackra-219).
 */
import { Enum } from "@stackra/contracts";

/**
 * A guardrail layer's effect.
 *
 * @example
 * new PatternGuardrailDriver({ rules, stages: { input: GuardrailEffect.Block } });
 */
export const GuardrailEffect = Enum.of({
  /** The text stops; the run refuses it. */
  Block: "block",
  /** The text goes on with every caught part replaced. */
  Redact: "redact",
  /** The text goes on unchanged; the catch is recorded as a flag. */
  Flag: "flag",
});

/** One of the codes above. */
export type GuardrailEffect = Enum.Value<typeof GuardrailEffect>;
