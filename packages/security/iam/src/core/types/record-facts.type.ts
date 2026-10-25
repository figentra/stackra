/**
 * Stackra file contract:
 * Purpose: `RecordFacts`, a record as the decision point tests it: the `Rules` registry of its model's fields and the
 *          facts (the record's values under the `record` source).
 * Boundary: a type only. The registry is the trust boundary for a stored condition: a deny or visibility condition
 *           that names a field the model does not register is refused by `@stackra/rules`, never guessed.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 4, 6 and 11); ADR 0333 (decision 2: conditions over record attributes).
 */
import type { Facts, Rules } from "@stackra/rules";

/**
 * One record's facts.
 *
 * @example
 * const record: RecordFacts = { rules: PRODUCT_FACTS, facts: { record: { collection: "private_sale" } } };
 */
export interface RecordFacts {
  /** The model's registered fields. */
  readonly rules: Rules;

  /** The record's values. */
  readonly facts: Facts;

  /** The model's key (`orders.order`), so conditions on its declared dimensions are checked against the projection. */
  readonly model?: string;
}
