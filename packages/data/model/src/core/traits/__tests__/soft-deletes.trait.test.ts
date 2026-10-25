/**
 * Stackra file contract:
 * Purpose: unit tests of `SoftDeletes`: a created row is live (`deletedAt` null) and the trait is registered for
 *          @stackra/database to read.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0096 (decision 3); ADR 0134.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { SoftDeletes } from "#core/traits/soft-deletes.trait";

class LoyaltyAccount extends Model.with(SoftDeletes) {}

describe("SoftDeletes", () => {
  it("starts live and is registered", () => {
    expect(new LoyaltyAccount().deletedAt).toBeNull();
    expect(traitsOf(LoyaltyAccount).map((trait) => trait.name)).toEqual(["soft_deletes"]);
  });
});
