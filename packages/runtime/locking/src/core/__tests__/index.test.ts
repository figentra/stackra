/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `Locks` (which the template's `StockService` injects and its wiring
 *          lists as a platform class) is exported with the memory driver, the busy refusal, the configuration, its
 *          shape and its shipped schema under the generated name `LockingConfig$`, and nothing else is a value.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { LockLease } from "#contracts/index";
import { LOCKING_CONFIG_SCHEMA } from "#core/constants/locking-config-schema.constant";
import * as locking from "#core/index";

describe("@stackra/locking", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(locking).sort()).toEqual([
      "LockUnavailableError",
      "LockingConfig",
      "LockingConfig$",
      "LockingOptions",
      "Locks",
      "MemoryLockDriver",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(locking.LockingConfig$).toBe(LOCKING_CONFIG_SCHEMA);
  });

  it("takes the template's call shape", () => {
    expectTypeOf<locking.Locks["with"]>().parameter(0).toEqualTypeOf<string | readonly string[]>();
    expectTypeOf<Parameters<locking.Locks["tryWith"]>[2]>().toEqualTypeOf<
      (lease: LockLease) => Promise<void>
    >();
    expectTypeOf<locking.Locks["tryWith"]>().returns.toEqualTypeOf<Promise<boolean>>();
  });
});
