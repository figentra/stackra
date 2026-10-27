/**
 * Stackra file contract:
 * Purpose: `InjectionGuardrailOptions`, the settings of an `InjectionGuardrailDriver`: its name, the signals and their
 *          weights, the weight of hidden characters, the score that counts as an injection, and the effect per stage.
 * Boundary: a type only; settings and market-pack data. No phrase, weight or threshold is written in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); STA-1377 (stackra-219).
 */
import type { GuardrailStages } from "#core/types/guardrail-stages.type";
import type { InjectionSignal } from "#core/types/injection-signal.type";

/** A prompt-injection layer's settings. */
export interface InjectionGuardrailOptions {
  /** The layer's name, recorded with a block or flag; `prompt_injection` when absent. */
  readonly name?: string;

  /** The signals; each matching signal adds its weight once. */
  readonly signals: readonly InjectionSignal[];

  /**
   * What invisible characters add to the score (zero-width, bidirectional controls, Unicode tag characters, the
   * usual way to hide instructions in a page); not counted when absent.
   */
  readonly hiddenCharacters?: number;

  /** The score from which the text counts as an injection. */
  readonly threshold: number;

  /** The effect per stage; usually the input of an agent that reads pages or inbound messages. */
  readonly stages: GuardrailStages;
}
