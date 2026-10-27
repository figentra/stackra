/**
 * Stackra file contract:
 * Purpose: `MemoryTenderEligibilityDriver`, an in-memory `TenderEligibility` for tests and development: a rule set is
 *          a list of eligible categories set by the test; a line is eligible when its category is listed.
 * Boundary: the memory driver every port ships before its durable one (ADR 0266); its name is the file prefix
 *           (`memory`). Isomorphic, so it ships from the `.` entry. Production evaluates the rule set with
 *           `@stackra/rules` in the host's driver. Markets share the lists here.
 * Runtime: isomorphic
 * Governing contract: ADR 0445; ADR 0266 (decision 2); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { TenderEligibility } from "#contracts/ports/tender-eligibility.port";
import type { TenderLine } from "#contracts/types/tender-line.type";

/**
 * Category lists by rule set.
 *
 * @example
 * const eligibility = new MemoryTenderEligibilityDriver().allow("rule-set:grocery:tender-eligibility", "dairy", "produce");
 */
export class MemoryTenderEligibilityDriver extends Driver(TenderEligibility) {
  /** Eligible categories by rule set. */
  private readonly sets = new Map<string, ReadonlySet<string>>();

  /** Adds `categories` to rule set `ruleSet`; returns this driver. */
  allow(ruleSet: string, ...categories: readonly string[]): this {
    this.sets.set(ruleSet, new Set([...(this.sets.get(ruleSet) ?? []), ...categories]));
    return this;
  }

  /** One flag per line: its category is in `ruleSet`'s list. An unknown rule set allows nothing. */
  async eligible(
    _market: string,
    ruleSet: string,
    lines: readonly TenderLine[],
  ): Promise<readonly boolean[]> {
    const allowed = this.sets.get(ruleSet);
    return lines.map(
      (line) => allowed !== undefined && line.category !== undefined && allowed.has(line.category),
    );
  }
}
