/**
 * Stackra file contract:
 * Purpose: `TenderEligibility`, the port that evaluates a restricted tender's rule set over a basket: which lines the
 *          tender may pay.
 * Boundary: an abstract class that is its own token, key `payments.TenderEligibility`. The host binds it over the
 *           `@stackra/rules` engine (the rule set seeded per pack, e.g. `rule-set:grocery:tender-eligibility`); the
 *           `memory` driver serves tests. This package holds no eligibility list. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0445; ADR 0331 (rules); ADR 0294 (decision 16); R3-SO-08.
 */
import { Port } from "@stackra/contracts";

import type { TenderLine } from "#contracts/types/tender-line.type";

/**
 * Line eligibility, by rule set.
 *
 * @example
 * export class RulesTenderEligibilityDriver extends Driver(TenderEligibility) { … }
 */
export abstract class TenderEligibility extends Port {
  /** Type-only port key. */
  declare readonly "~key": "payments.TenderEligibility";

  /**
   * Whether each line of `lines` may be paid by the tender, per rule set `ruleSet` in `market`.
   *
   * @returns one flag per line, in the same order.
   */
  abstract eligible(
    market: string,
    ruleSet: string,
    lines: readonly TenderLine[],
  ): Promise<readonly boolean[]>;
}
