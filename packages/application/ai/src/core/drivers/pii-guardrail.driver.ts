/**
 * Stackra file contract:
 * Purpose: `PiiGuardrailDriver`, the personal-data guardrail layer: emails, phones and cards by the configured
 *          redaction rules, and identity document numbers by the Market's `IdentifierFormat`s (pattern and check
 *          digit, through `checkIdentifier` of `@stackra/validation`), blocked, redacted or flagged per stage.
 * Boundary: a `Driver(GuardrailLayer)`, so a `Guardrail` `runGuardrails` runs. It finds identity-number candidates as
 *           runs of letters and digits whose digits may be split by single spaces or hyphens (Arabic-Indic digits
 *           included, as `normalizeIdentifier` reads them) and keeps only those a format accepts, so a random number
 *           that fails the check digit is left alone. The reasons are rule names and document kinds, never the matched
 *           text. No pattern or format is written here.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); ADR 0360 (decision 15: contact details, document numbers and card
 *                     numbers are redacted); STA-1269 (national ID formats); STA-1377 (stackra-219).
 */
import { Driver } from "@stackra/container";

import { checkIdentifier } from "@stackra/validation";

import { effectVerdict } from "#core/functions/effect-verdict.function";
import { redact } from "#core/functions/redact.function";
import { rulePattern } from "#core/functions/rule-pattern.function";
import { GuardrailLayer } from "#core/ports/guardrail-layer.port";
import type { GuardrailVerdict } from "#core/types/guardrail-verdict.type";
import type { PiiGuardrailOptions } from "#core/types/pii-guardrail-options.type";

/**
 * A candidate identity number: letters and digits around at least one digit, digits joined by at most one space or
 * hyphen, not inside a longer word.
 *
 * shortcut: a number split by other separators (dots, slashes) or with letters split off by a space is not a
 * candidate; widen the shape when a market pack's format needs it.
 */
const CANDIDATE =
  /(?<![A-Za-z0-9٠-٩۰-۹])[A-Za-z0-9٠-٩۰-۹]*[0-9٠-٩۰-۹](?:[\s-]?[0-9٠-٩۰-۹])*[A-Za-z]*(?![A-Za-z0-9٠-٩۰-۹])/g;

/**
 * Finds personal data in text.
 *
 * @example
 * const pii = new PiiGuardrailDriver({
 *   rules: floor.redaction,
 *   nationalIds: NationalIdFormats$.parse(valueOf(pack, "identity.national_ids", today)?.value),
 *   stages: { input: GuardrailEffect.Redact, output: GuardrailEffect.Redact },
 * });
 */
export class PiiGuardrailDriver extends Driver(GuardrailLayer) {
  /** The layer's name. */
  override readonly name: string;

  /** The settings. */
  private readonly options: PiiGuardrailOptions;

  /** Each rule's name with its compiled expression. */
  private readonly patterns: readonly (readonly [string, RegExp])[];

  /**
   * @param options - the layer's settings.
   * @throws SyntaxError when a rule's pattern or flags are not a valid regular expression.
   */
  constructor(options: PiiGuardrailOptions) {
    super();
    this.name = options.name ?? "pii";
    this.options = options;
    this.patterns = options.rules.map((rule) => [rule.name, rulePattern(rule)] as const);
  }

  /** Blocks, redacts or flags `text` when it holds personal data at `stage`. */
  override check(text: string, stage: "input" | "output"): GuardrailVerdict {
    const effect = this.options.stages[stage];
    if (effect === undefined) return { pass: true };
    const reasons = this.patterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
    for (const candidate of text.match(CANDIDATE) ?? []) {
      const kind = this.documentKind(candidate);
      if (kind !== undefined && !reasons.includes(kind)) reasons.push(kind);
    }
    return effectVerdict(effect, reasons, () =>
      redact(text, this.options.rules).replace(CANDIDATE, (candidate) => {
        const kind = this.documentKind(candidate);
        return kind === undefined ? candidate : `[${kind}]`;
      }),
    );
  }

  /** The kind of the first identity document `candidate` is a valid number of, if any. */
  private documentKind(candidate: string): string | undefined {
    const formats = this.options.nationalIds ?? {};
    return Object.keys(formats).find((kind) => {
      const format = formats[kind];
      return format !== undefined && checkIdentifier(candidate, format) !== null;
    });
  }
}
