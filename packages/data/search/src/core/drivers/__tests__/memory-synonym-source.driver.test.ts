/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySynonymSourceDriver`: it is a `SynonymSource` answering the held sets of the asked indexes,
 *          in the asked language or every language.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266; ADR 0492 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { SynonymSource } from "#contracts/index";
import { MemorySynonymSourceDriver } from "#core/drivers/memory-synonym-source.driver";

const SETS = [
  { index: "products", language: "en", terms: ["sofa", "couch"] },
  { index: "products", language: "ar", terms: ["كنبة", "أريكة"] },
  { index: "orders", language: "en", terms: ["refund", "return"] },
];

describe(MemorySynonymSourceDriver, () => {
  it("is a SynonymSource filtering by index and language", async () => {
    const source = new MemorySynonymSourceDriver(SETS);
    expect(source).toBeInstanceOf(SynonymSource);
    expect(await source.setsOf(["products"])).toEqual([SETS[0], SETS[1]]);
    expect(await source.setsOf(["products", "orders"], "en")).toEqual([SETS[0], SETS[2]]);
    expect(await source.setsOf(["carts"])).toEqual([]);
    expect(await new MemorySynonymSourceDriver().setsOf(["products"])).toEqual([]);
  });
});
