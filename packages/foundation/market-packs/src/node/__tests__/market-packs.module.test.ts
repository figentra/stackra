/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPacksModule` and the `./node` entry: a module whose one export is
 *          `ResolvedPackSource`, and an entry that exports exactly the module.
 * Boundary: test only; reads the module's recorded options.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 12 and 16); ADR 0418.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { ResolvedPackSource } from "#core/ports/resolved-pack-source.port";
import * as entry from "#node/index";
import { MarketPacksModule } from "#node/market-packs.module";

describe("MarketPacksModule", () => {
  it("is a module that exports ResolvedPackSource only", () => {
    expect(kindOf(MarketPacksModule)?.kind).toBe("module");
    expect(kindOf(MarketPacksModule)?.options["exports"]).toEqual([ResolvedPackSource]);
  });

  it("is the one export of the node entry", () => {
    expect(Object.keys(entry)).toEqual(["MarketPacksModule"]);
  });
});
