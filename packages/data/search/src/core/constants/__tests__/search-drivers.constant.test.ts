/**
 * Stackra file contract:
 * Purpose: unit tests of `SEARCH_DRIVERS`: one name per shipped driver, each the prefix of its driver file, matching
 *          the template wiring's candidates (`postgres`, `memory`).
 * Boundary: test only; the driver class names stand in for the file names gen reads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { SEARCH_DRIVERS } from "#core/constants/search-drivers.constant";
import { MemorySearchDriver } from "#core/drivers/memory-search.driver";
import { PostgresSearchDriver } from "#node/drivers/postgres-search.driver";

/** `MemorySearchDriver` to `memory`: the class name less the port and kind, in lower case. */
const driverName = (type: { readonly name: string }): string =>
  type.name.replace(/SearchDriver$/, "").toLowerCase();

describe("SEARCH_DRIVERS", () => {
  it("names every shipped driver once", () => {
    expect([...SEARCH_DRIVERS]).toEqual([PostgresSearchDriver, MemorySearchDriver].map(driverName));
  });
});
