/**
 * Stackra file contract:
 * Purpose: `InjectionGuardrailOptions`, the settings of an `InjectionGuardrailDriver`: its name, the signals and their
 *          weights, the weight of hidden characters, the score that counts as an injection, and the effect per stage.
 * Boundary: settings only; settings and market-pack data. No phrase, weight or threshold is written in code.
 *           A class with declared fields only: the driver's constructor names it, so gen and the container take it
 *           as a token (the host binds it with `useValue`); an object literal of the fields still fits (STA-1299).
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); STA-1377 (stackra-219).
 */
import type { GuardrailStages } from "#core/types/guardrail-stages.type";
import type { InjectionSignal } from "#core/types/injection-signal.type";

/** A prompt-injection layer's settings. */
export abstract class InjectionGuardrailOptions {
  /** The layer's name, recorded with a block or flag; `prompt_injection` when absent. */
  declare readonly name?: string;

  /** The signals; each matching signal adds its weight once. */
  declare readonly signals: readonly InjectionSignal[];

  /**
   * What invisible characters add to the score (zero-width, bidirectional controls, Unicode tag characters, the
   * usual way to hide instructions in a page); not counted when absent.
   */
  declare readonly hiddenCharacters?: number;

  /** The score from which the text counts as an injection. */
  declare readonly threshold: number;

  /** The effect per stage; usually the input of an agent that reads pages or inbound messages. */
  declare readonly stages: GuardrailStages;
}
