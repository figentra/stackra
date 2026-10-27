/**
 * Stackra file contract:
 * Purpose: `InjectionGuardrailDriver`, the prompt-injection heuristic for untrusted text (a page reading, an inbound
 *          WhatsApp message, an email): it scores the configured signals and hidden characters, and from the
 *          threshold blocks, redacts (the matched signals and the hidden characters) or flags the text, per stage.
 * Boundary: a `Driver(GuardrailLayer)`, so a `Guardrail` `runGuardrails` runs. A heuristic: it lowers the risk, it does
 *           not prove text safe; the tool approval floor stays the control (ADR 0360). The reason is `prompt_injection`
 *           and the flags are the signal names, never the text. No phrase, weight or threshold is written here.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); ADR 0450 (a reading is untrusted data, never instructions); STA-1377.
 */
import { Driver } from "@stackra/container";

import { effectVerdict } from "#core/functions/effect-verdict.function";
import { redact } from "#core/functions/redact.function";
import { rulePattern } from "#core/functions/rule-pattern.function";
import { GuardrailLayer } from "#core/ports/guardrail-layer.port";
import type { GuardrailVerdict } from "#core/types/guardrail-verdict.type";
import type { InjectionGuardrailOptions } from "#core/types/injection-guardrail-options.type";

/** Zero-width characters, bidirectional controls, word joiners, the BOM and Unicode tag characters. */
const HIDDEN = /[​-‏‪-‮⁠-⁤⁦-⁩﻿\u{E0000}-\u{E007F}]/gu;

/** The flag hidden characters raise. */
const HIDDEN_FLAG = "hidden_characters";

/**
 * Scores text for prompt injection.
 *
 * @example
 * const injection = new InjectionGuardrailDriver({ ...settings.ai.injection, stages: { input: GuardrailEffect.Block } });
 * await runGuardrails([injection], reading.text, "input");
 */
export class InjectionGuardrailDriver extends Driver(GuardrailLayer) {
  /** The layer's name. */
  override readonly name: string;

  /** The settings. */
  private readonly options: InjectionGuardrailOptions;

  /** Each signal with its compiled expression. */
  private readonly patterns: readonly (readonly [string, RegExp, number])[];

  /**
   * @param options - the layer's settings.
   * @throws SyntaxError when a signal's pattern or flags are not a valid regular expression.
   * @throws RangeError when the threshold or a weight is not a finite number above zero.
   */
  constructor(options: InjectionGuardrailOptions) {
    super();
    const weights = [
      options.threshold,
      ...options.signals.map((signal) => signal.weight),
      ...(options.hiddenCharacters === undefined ? [] : [options.hiddenCharacters]),
    ];
    if (weights.some((weight) => !Number.isFinite(weight) || weight <= 0))
      throw new RangeError(
        "InjectionGuardrailDriver takes a threshold and weights that are finite numbers above zero",
      );
    this.name = options.name ?? "prompt_injection";
    this.options = options;
    this.patterns = options.signals.map(
      (signal) => [signal.name, rulePattern(signal), signal.weight] as const,
    );
  }

  /** Blocks, redacts or flags `text` when its score reaches the threshold at `stage`. */
  override check(text: string, stage: "input" | "output"): GuardrailVerdict {
    const effect = this.options.stages[stage];
    if (effect === undefined) return { pass: true };
    const hits = this.patterns.filter(([, pattern]) => pattern.test(text));
    const flags = hits.map(([name]) => name);
    let score = hits.reduce((total, [, , weight]) => total + weight, 0);
    const hidden = this.options.hiddenCharacters;
    if (hidden !== undefined && new RegExp(HIDDEN.source, "u").test(text)) {
      score += hidden;
      flags.push(HIDDEN_FLAG);
    }
    if (score < this.options.threshold) return { pass: true };
    const verdict = effectVerdict(effect, flags, () =>
      redact(text, this.options.signals).replace(HIDDEN, ""),
    );
    return verdict.pass ? verdict : { pass: false, reason: "prompt_injection" };
  }
}
