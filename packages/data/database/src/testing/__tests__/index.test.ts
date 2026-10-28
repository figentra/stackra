/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: `Factory` and `usePostgres` (the template's imports), the memory
 *          driver, the plugin and `strictLoading` are exported, nothing else is, and the template's factory shape compiles against `Faker`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); ADR 0022.
 */
import { HasPublicId, Model } from "@stackra/model";
import type { Attributes } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as testing from "#testing/index";
import { Factory } from "#testing/index";
import type { Faker } from "#testing/index";

class StockLevel extends Model.with(HasPublicId("stk")) {
  variantId = "";

  locationId = "";

  onHand = 0;

  reserved = 0;
}

class StockLevelFactory extends Factory<StockLevel> {
  definition(faker: Faker): Attributes<StockLevel> {
    return { variantId: faker.publicId("var"), locationId: "loc_main", onHand: 10 };
  }

  soldOut(): this {
    return this.state({ onHand: 0, reserved: 0 });
  }
}

describe("@stackra/database/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "DATABASE_TESTING_PLUGIN",
      "Factory",
      "MemoryDatabaseDriver",
      "assertRowSecurity",
      "strictLoading",
      "usePostgres",
    ]);
    expect("FAKER" in testing).toBe(false);
  });

  it("compiles the template's factory shape", () => {
    expectTypeOf<ReturnType<Faker["publicId"]>>().toEqualTypeOf<`${string}_${string}`>();
    expectTypeOf(StockLevelFactory.new().soldOut()).toEqualTypeOf<StockLevelFactory>();
    expectTypeOf(StockLevelFactory.new().count(2).create).returns.resolves.toEqualTypeOf<
      StockLevel[]
    >();
  });
});
