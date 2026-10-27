/**
 * Stackra file contract:
 * Purpose: `PiiGuardrailOptions`, the settings of a `PiiGuardrailDriver`: its name, the contact-detail patterns
 *          (emails, phones, cards) as redaction rules, the Market's identity document formats, and its effect per
 *          stage.
 * Boundary: a type only. The rules are the platform floor and market-pack redaction data (ADR 0360 decision 15); the
 *           national ID formats are the market pack's `identity.national_ids` value, parsed with
 *           `NationalIdFormats$` from `@stackra/validation`, the same data `nationalId()` validates with. No pattern
 *           or format is written in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); ADR 0360 (decision 15); STA-1269 (national ID formats); STA-1377.
 */
import type { IdentifierFormat } from "@stackra/validation";

import type { GuardrailStages } from "#core/types/guardrail-stages.type";
import type { RedactionRule } from "#core/types/redaction-rule.type";

/** A personal-data layer's settings. */
export interface PiiGuardrailOptions {
  /** The layer's name, recorded with a block or flag; `pii` when absent. */
  readonly name?: string;

  /** Contact detail and card patterns; a rule's name is the reason code and the default replacement. */
  readonly rules: readonly RedactionRule[];

  /** The identity documents the Market issues, by kind code; a number passing one is replaced with `[<kind>]`. */
  readonly nationalIds?: Readonly<Record<string, IdentifierFormat>>;

  /** The effect per stage. */
  readonly stages: GuardrailStages;
}
