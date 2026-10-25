/**
 * Stackra file contract:
 * Purpose: unit tests of `MODEL_TOKENS`: `Repository<M>` is `repositoryOf(M)` from @stackra/database with no
 *          dependency, and `Journal<M>` is `journalOf(M)` from @stackra/ledger with `Locks`; the map is frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0097; ADR 0220; ADR 0263 as amended by 0294.
 */
import { describe, expect, it } from "@stackra/testing";

import { MODEL_TOKENS } from "#core/constants/model-tokens.constant";

describe("MODEL_TOKENS", () => {
  it("maps each per-model type to its token factory and dependencies", () => {
    expect(MODEL_TOKENS["Repository"]).toEqual({
      package: "@stackra/database",
      factory: { name: "repositoryOf", from: "@stackra/database" },
      deps: [],
    });
    expect(MODEL_TOKENS["Journal"]).toEqual({
      package: "@stackra/ledger",
      factory: { name: "journalOf", from: "@stackra/ledger/node" },
      deps: [{ name: "Locks", from: "@stackra/locking" }],
    });
    expect(Object.isFrozen(MODEL_TOKENS)).toBe(true);
  });
});
