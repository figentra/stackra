/**
 * Stackra file contract:
 * Purpose: `FactField`, the typed description of one field a fact source lets rules test: its type, its label, and
 *          for an enum the codes it may hold.
 * Boundary: a type only. The type fixes the operators (`FieldType`); the label and the value labels are lang keys, so
 *           the rule builder shows each locale its own words. Only an enum field has `values`.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 3, 4 and 8); naming rule (namespace lookups `<module>::<path>`).
 */
import type { I18nKey } from "@stackra/i18n";

import type { FieldType } from "#contracts/enums/field-type.enum";

/**
 * One field of a fact source.
 *
 * @example
 * const tier: FactField = { type: FieldType.Enum, label: "loyalty::facts.tier", values: { gold: "loyalty::tiers.gold" } };
 */
export interface FactField {
  /** The field's type, which fixes the operators a rule may apply to it. */
  readonly type: FieldType;

  /** The lang key of the field's name in the rule builder. */
  readonly label: I18nKey;

  /** An enum field's codes, each with the lang key of its name, in the order the builder offers them. */
  readonly values?: Readonly<Record<string, I18nKey>>;
}
