/**
 * Stackra file contract:
 * Purpose: unit tests of `strictLoading`: it resolves to the output and the count within its limits, fails on any
 *          repeated shape by default, honours `repeats`, and fails above `budget`.
 * Boundary: test only; statements are fed to an observed logger inside the block, no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; data-layer gaps scale-performance 8 and model-orm 12 (STA-1400).
 */
import { describe, expect, it } from "@stackra/testing";

import { observedLogger } from "#node/functions/observed-logger.function";
import { strictLoading } from "#testing/functions/strict-loading.function";

const orm = observedLogger({ writer: () => undefined }, []);

/** Work that runs `times` lookups of one shape and answers `times`. */
function lookups(times: number): () => Promise<number> {
  return async () => {
    for (let i = 0; i < times; i += 1)
      orm.logQuery({ query: `select * from "variants" where id = ${i}` });
    return times;
  };
}

describe("strictLoading", () => {
  it("resolves to the output and the count", async () => {
    await expect(strictLoading(lookups(1), { budget: 1 })).resolves.toEqual({
      output: 1,
      queries: 1,
    });
  });

  it("fails on a repeated shape unless repeats allows it", async () => {
    await expect(strictLoading(lookups(2))).rejects.toThrow(/ran 2 times \(limit 1\)/);
    await expect(strictLoading(lookups(2), { repeats: 2 })).resolves.toEqual({
      output: 2,
      queries: 2,
    });
  });

  it("fails above the budget", async () => {
    await expect(strictLoading(lookups(3), { budget: 2, repeats: 5 })).rejects.toThrow(
      /ran 3 statements, budget 2/,
    );
  });
});
