/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `LockDriver` is the only value, and the `LockLease` type
 *          resolves to its keys, owner and fencing token.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { LockLease } from "#contracts/index";

describe("@stackra/locking/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["LockDriver"]);
  });

  it("resolves the lease type", () => {
    expectTypeOf<LockLease["keys"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<LockLease["owner"]>().toEqualTypeOf<string>();
    expectTypeOf<LockLease["token"]>().toEqualTypeOf<number>();
  });
});
