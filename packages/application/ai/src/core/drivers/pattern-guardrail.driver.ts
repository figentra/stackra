/**
 * Stackra file contract:
 * Purpose: `PatternGuardrailDriver`, the guardrail layer over configured regular expressions: text matching any rule
 *          is blocked, redacted (with `redact`) or flagged, per stage.
 * Boundary: a `Driver(GuardrailLayer)`, so a `Guardrail` `runGuardrails` runs. Every rule is compiled when the driver
 *           is built, so a broken pattern fails at bind time. No pattern is written here; all come from
 *           `PatternGuardrailOptions`.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: layered guardrails); STA-1377 (stackra-219).
 */
import { Driver } from "@stackra/container";

import { effectVerdict } from "#core/functions/effect-verdict.function";
import { redact } from "#core/functions/redact.function";
import { rulePattern } from "#core/functions/rule-pattern.function";
import { GuardrailLayer } from "#core/ports/guardrail-layer.port";
import type { GuardrailVerdict } from "#core/types/guardrail-verdict.type";
import type { PatternGuardrailOptions } from "#core/types/pattern-guardrail-options.type";

/**
 * Checks text against configured patterns.
 *
 * @example
 * const denylist = new PatternGuardrailDriver({ rules: settings.ai.denylist, stages: { output: GuardrailEffect.Block } });
 * await runGuardrails([denylist], answer, "output");
 */
export class PatternGuardrailDriver extends Driver(GuardrailLayer) {
  /** The layer's name. */
  override readonly name: string;

  /** The settings. */
  private readonly options: PatternGuardrailOptions;

  /** Each rule's name with its compiled expression. */
  private readonly patterns: readonly (readonly [string, RegExp])[];

  /**
   * @param options - the layer's settings.
   * @throws SyntaxError when a rule's pattern or flags are not a valid regular expression.
   */
  constructor(options: PatternGuardrailOptions) {
    super();
    this.name = options.name ?? "pattern";
    this.options = options;
    this.patterns = options.rules.map((rule) => [rule.name, rulePattern(rule)] as const);
  }

  /** Blocks, redacts or flags `text` when a rule matches it at `stage`. */
  override check(text: string, stage: "input" | "output"): GuardrailVerdict {
    const effect = this.options.stages[stage];
    if (effect === undefined) return { pass: true };
    const reasons = this.patterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
    return effectVerdict(effect, reasons, () => redact(text, this.options.rules));
  }
}
