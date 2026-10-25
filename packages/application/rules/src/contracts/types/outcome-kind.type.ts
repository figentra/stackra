/**
 * Stackra file contract:
 * Purpose: `OutcomeKind`, what a consumer registers so a rule set may name what a match does: a key, a label and the
 *          typed parameters the outcome takes (`refundWindow { days }`, `holdOrder { reason }`).
 * Boundary: a type only, and a description only: the consumer's own handler applies the outcome (ADR 0331 decision 9);
 *           the engine checks a stored outcome against the kind and guards its floored parameters, and never runs it.
 *           A rule names an outcome by its kind key; a kind no consumer registers cannot be stored.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 4, 9 and 10); config-model section 4.
 */
import type { I18nKey } from "@stackra/i18n";

import type { OutcomeParam } from "#contracts/types/outcome-param.type";

/**
 * One outcome a consumer's rules may yield.
 *
 * @example
 * export const REFUND_WINDOW = {
 *   key: "refundWindow",
 *   label: "returns::outcomes.refund_window",
 *   params: { days: { type: FieldType.Number, label: "returns::outcomes.days", floor: "consumer.withdrawal_days" } },
 * } satisfies OutcomeKind;
 */
export interface OutcomeKind {
  /** The kind's camelCase key, stored on each outcome. */
  readonly key: string;

  /** The lang key of the kind's name in the rule builder. */
  readonly label: I18nKey;

  /** The parameters, by camelCase key; every one is required on a stored outcome. */
  readonly params: Readonly<Record<string, OutcomeParam>>;
}
