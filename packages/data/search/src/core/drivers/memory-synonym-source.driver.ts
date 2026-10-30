/**
 * Stackra file contract:
 * Purpose: the in-memory `SynonymSource` for tests and development: the sets it was given, filtered by index and
 *          language.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. It has no
 *           tenant of its own: whatever it was constructed with is the caller's. Nothing survives a restart.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0492 (decision 5); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { SynonymSource } from "#contracts/index";
import type { SynonymSet } from "#contracts/index";

/**
 * Answers from the sets it holds.
 *
 * @example
 * const source = new MemorySynonymSourceDriver([{ index: "products", language: "ar", terms: ["كنبة", "أريكة"] }]);
 * await source.setsOf(["products"], "ar"); // the one set
 */
export class MemorySynonymSourceDriver extends Driver(SynonymSource) {
  /** The sets held. */
  private readonly sets: readonly SynonymSet[];

  /**
   * @param sets - the sets of every index and language; none when absent.
   */
  constructor(sets: readonly SynonymSet[] = []) {
    super();
    this.sets = sets;
  }

  /** The held sets of `indexes` in `language`, or in every language when it is absent. */
  async setsOf(indexes: readonly string[], language?: string): Promise<readonly SynonymSet[]> {
    return this.sets.filter(
      (set) => indexes.includes(set.index) && (language === undefined || set.language === language),
    );
  }
}
