/**
 * Stackra file contract:
 * Purpose: `RulesOptions`, what a consumer gives `Rules.create`: its key, the fact sources its rules may test and the
 *          outcome kinds a match may yield, and how many outcomes one rule may yield.
 * Boundary: a type only. The key names the consumer and is stored on each of its rule sets, so a rule set is only ever
 *           checked against the fields and outcome kinds it was written for. A consumer without outcomes (a segment)
 *           leaves `outcomes` out. A declared outcome kind (`RuleOutcome({...})`) is what gen lists in the manifest.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 4 and 9); STA-1250 (a permission matrix of more than 20 rows).
 */
import type { FactSource, OutcomeKind } from "#contracts/index";
import type { RuleOutcomeClass } from "#core/types/rule-outcome-class.type";

/** The options of `Rules.create`. */
export interface RulesOptions {
  /** The consumer's key: its module key, a dot and a snake_case name (`promotions.discount`). */
  readonly key: string;

  /** The fact sources, each with a distinct key. */
  readonly sources: readonly FactSource[];

  /** The outcome kinds, as data or declared `RuleOutcome` classes, each with a distinct key; none when left out. */
  readonly outcomes?: readonly (OutcomeKind | RuleOutcomeClass)[];

  /** The most outcomes one rule may yield, 1 to 500; 20 when left out (a permission matrix holds more rows). */
  readonly maxOutcomes?: number;
}
