/**
 * Stackra file contract:
 * Purpose: unit tests of `Versioned`: a created row starts at version 1, and a loaded row keeps its stored version.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0133 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { Versioned } from "#core/traits/versioned.trait";

class StockLevel extends Model.with(Versioned) {}

describe("Versioned", () => {
  it("starts at version 1 and keeps a loaded version", () => {
    expect(new StockLevel().version).toBe(1);
    const loaded = Object.assign(Object.create(StockLevel.prototype) as StockLevel, {
      version: 4,
    });
    expect(loaded.version).toBe(4);
    expect(Versioned.traitName).toBe("versioned");
  });
});
