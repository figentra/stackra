/**
 * Stackra file contract:
 * Purpose: `PatternGuardrailOptions`, the settings of a `PatternGuardrailDriver`: its name, the configured patterns
 *          (a denylist, off-topic terms, a product's banned phrases) and its effect per stage.
 * Boundary: a type only. Every pattern is data from settings or a market pack (Arabic word lists included); none is
 *           written in code. A pattern is trusted platform or admin data, never request input.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); STA-1377 (stackra-219).
 */
import type { GuardrailStages } from "#core/types/guardrail-stages.type";
import type { RedactionRule } from "#core/types/redaction-rule.type";

/** A pattern layer's settings. */
export interface PatternGuardrailOptions {
  /** The layer's name, recorded with a block or flag; `pattern` when absent. */
  readonly name?: string;

  /** The patterns; a rule's name is the reason code, its replacement what a redaction writes. */
  readonly rules: readonly RedactionRule[];

  /** The effect per stage. */
  readonly stages: GuardrailStages;
}
