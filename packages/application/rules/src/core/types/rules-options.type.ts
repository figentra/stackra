/**
 * Stackra file contract:
 * Purpose: `RulesOptions`, what a consumer gives `Rules.create`: its key and the fact sources its rules may test.
 * Boundary: a type only. The key names the consumer and is stored on each of its rule sets, so a rule set is only ever
 *           checked against the fields it was written for.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 4).
 */
import type { FactSource } from "#contracts/index";

/** The options of `Rules.create`. */
export interface RulesOptions {
  /** The consumer's key: its module key, a dot and a snake_case name (`promotions.discount`). */
  readonly key: string;

  /** The fact sources, each with a distinct key. */
  readonly sources: readonly FactSource[];
}
