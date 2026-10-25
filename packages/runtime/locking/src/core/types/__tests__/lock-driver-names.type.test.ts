/**
 * Stackra file contract:
 * Purpose: type tests of the `DriverRegistry` entry: `DriverName<LockDriver>` is exactly this package's driver names,
 *          which equal the shipped schema's `driver` enum.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 4).
 */
import "#core/types/lock-driver-names.type";

import type { DriverName, DriverRegistry } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { LockDriver } from "#contracts/ports/lock-driver.port";
import { LOCK_DRIVERS } from "#core/constants/lock-drivers.constant";
import { LOCKING_CONFIG_SCHEMA } from "#core/constants/locking-config-schema.constant";

describe("DriverRegistry['locking.LockDriver']", () => {
  it("narrows DriverName<LockDriver> to the shipped drivers", () => {
    expectTypeOf<DriverName<LockDriver>>().toEqualTypeOf<"postgres" | "valkey" | "memory">();
    expectTypeOf<DriverRegistry["locking.LockDriver"]>().toEqualTypeOf<DriverName<LockDriver>>();
  });

  it("matches the schema's driver enum", () => {
    expect(LOCKING_CONFIG_SCHEMA.shape.driver.unwrap().options).toEqual([...LOCK_DRIVERS]);
  });
});
