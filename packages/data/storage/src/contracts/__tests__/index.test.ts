/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports `Storage` (the generated wirings import it from
 *          here) and no other value, and the types the port's signature names resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { StorageAreaHandle, StorageWriteOptions, StoredRecord } from "#contracts/index";

describe("@stackra/storage/contracts", () => {
  it("exports exactly Storage", () => {
    expect(Object.keys(contracts)).toEqual(["Storage"]);
  });

  it("resolves the port's types", () => {
    expectTypeOf<contracts.Storage["prefs"]>().toEqualTypeOf<StorageAreaHandle>();
    expectTypeOf<StoredRecord<{ a: number }>["read"]>().returns.toEqualTypeOf<
      Partial<{ a: number }> | undefined
    >();
    expectTypeOf<StorageWriteOptions>().toHaveProperty("ttl");
  });
});
