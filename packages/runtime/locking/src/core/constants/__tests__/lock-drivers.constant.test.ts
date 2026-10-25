/**
 * Stackra file contract:
 * Purpose: unit tests of `LOCK_DRIVERS`: one name per shipped driver, each the prefix of its driver file (`postgres`,
 *          `memory`).
 * Boundary: test only; the driver class names stand in for the file names gen reads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { LOCK_DRIVERS } from "#core/constants/lock-drivers.constant";
import { MemoryLockDriver } from "#core/drivers/memory-lock.driver";
import { PostgresLockDriver } from "#node/drivers/postgres-lock.driver";
import { ValkeyLockDriver } from "#node/drivers/valkey-lock.driver";

/** `MemoryLockDriver` to `memory`: the class name less the port and kind, in lower case. */
const driverName = (type: { readonly name: string }): string =>
  type.name.replace(/LockDriver$/, "").toLowerCase();

describe("LOCK_DRIVERS", () => {
  it("names every shipped driver once", () => {
    expect([...LOCK_DRIVERS]).toEqual(
      [PostgresLockDriver, ValkeyLockDriver, MemoryLockDriver].map(driverName),
    );
  });
});
