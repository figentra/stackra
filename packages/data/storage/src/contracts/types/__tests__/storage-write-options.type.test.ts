/**
 * Stackra file contract:
 * Purpose: type tests of `StorageWriteOptions`: the time-to-live is an optional `Duration`, so a bare number of
 *          milliseconds is refused.
 * Boundary: test only; type assertions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0256 (decision 4).
 */
import { Duration } from "@stackra/contracts";
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { StorageWriteOptions } from "#contracts/types/storage-write-options.type";

describe("StorageWriteOptions", () => {
  it("takes an optional Duration", () => {
    expectTypeOf<StorageWriteOptions["ttl"]>().toEqualTypeOf<Duration | undefined>();
    expectTypeOf({ ttl: Duration.minutes(10) }).toExtend<StorageWriteOptions>();
    expectTypeOf({ ttl: 600_000 }).not.toExtend<StorageWriteOptions>();
  });
});
