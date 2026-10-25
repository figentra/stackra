/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: exactly the public values are exported (the helpers stay internal),
 *          the `$` names are the shipped schemas, and the public types resolve.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";
import { SIGNED_PACK_SCHEMA } from "#core/constants/signed-pack-schema.constant";
import type { MarketPack, PackEntry, SignedPack } from "#core/index";
import * as entry from "#core/index";

describe("@stackra/market-packs", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "FloorBound",
      "MarketPack$",
      "PackNotFoundError",
      "PackRejectedError",
      "PackRejection",
      "PackStatus",
      "SignedPack$",
      "contentHash",
      "factsOn",
      "floorsOn",
      "launchGate",
      "resolvePack",
      "signPack",
      "unreviewed",
      "valueOf",
      "valuesOn",
      "verifyPack",
    ]);
  });

  it("exports the shipped schemas under their generated names", () => {
    expect(entry.MarketPack$).toBe(MARKET_PACK_SCHEMA);
    expect(entry.SignedPack$).toBe(SIGNED_PACK_SCHEMA);
  });

  it("resolves its public types", () => {
    expectTypeOf<MarketPack["entries"][number]>().toEqualTypeOf<PackEntry>();
    expectTypeOf<SignedPack["pack"]>().toEqualTypeOf<MarketPack>();
  });
});
