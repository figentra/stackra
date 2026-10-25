/**
 * Stackra file contract:
 * Purpose: `RuleField`, one field a consumer's rules may test, by its path: what `Rules.fields()` lists for the rule
 *          builder.
 * Boundary: a type only; the field description is the fact source's own object.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 4 and 8).
 */
import type { FactField } from "#contracts/index";

/** A registered field. */
export interface RuleField {
  /** `<source>.<field>` (`cart.total`), the name a condition leaf uses. */
  readonly path: string;

  /** The field's description. */
  readonly field: FactField;
}
