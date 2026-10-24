/**
 * Stackra file contract:
 * Purpose: unit tests of `discoverWithGen`: the targets a member decorator marks on the classes a test-file module
 *          exports (one per public method for a class facet), with its constant value, keyed by the decorator's
 *          `kind`; and a missing module refused.
 * Boundary: test only; writes the shop fixture (its `__tests__` module included) under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0144 as amended by 0263 (conformance); ADR 0294 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { discoverWithGen } from "#testing/functions/discover-with-gen.function";
import { SHOP_SOURCES } from "#node/__tests__/fixtures/shop-sources.fixture";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** Stands in for the fixture's module class: only its name is read. */
class FixtureModule {}

/** Stands in for a module no file declares. */
class MissingModule {}

describe("discoverWithGen", () => {
  const root = writeFixtureMember("shop", SHOP_SOURCES);

  it("lists what the decorator marks on the module's exports", async () => {
    const found = await discoverWithGen<{ reason: string }>(
      FixtureModule,
      { kind: "audited" },
      { root },
    );
    expect(found).toEqual([
      {
        target: "ShopService.cancel",
        class: "ShopService",
        member: "cancel",
        options: { reason: "money" },
      },
      {
        target: "ShopService.list",
        class: "ShopService",
        member: "list",
        options: { reason: "money" },
      },
    ]);
    expect(await discoverWithGen(FixtureModule, { kind: "unknown" }, { root })).toEqual([]);
  });

  it("refuses a module no file declares", async () => {
    await expect(discoverWithGen(MissingModule, { kind: "audited" }, { root })).rejects.toThrow(
      /no module class named MissingModule/,
    );
  });
});
