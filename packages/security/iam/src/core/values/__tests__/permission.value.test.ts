/**
 * Stackra file contract:
 * Purpose: unit tests of `Permission`: each level carries its `Risk`, `.system()` keeps the level and marks it system,
 *          every read is a new frozen instance (so each static has its own identity), and the class cannot be built
 *          from outside.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0132 (as amended by 0294); ADR 0099 (as amended).
 */
import { describe, expect, it } from "@stackra/testing";

import { Risk } from "#core/enums/risk.enum";
import { Permission } from "#core/values/permission.value";

describe("Permission", () => {
  it("carries the level of each static getter", () => {
    expect(
      [Permission.L0, Permission.L1, Permission.L2, Permission.L3, Permission.L4].map(
        (p) => p.risk,
      ),
    ).toEqual([Risk.L0, Risk.L1, Risk.L2, Risk.L3, Risk.L4]);
    expect(Permission.L2.isSystem).toBe(false);
  });

  it("marks a system permission without changing its level", () => {
    const expire = Permission.L2.system();
    expect(expire.risk).toBe(Risk.L2);
    expect(expire.isSystem).toBe(true);
  });

  it("returns a new frozen instance on every read", () => {
    const read = Permission.L0;
    expect(read).not.toBe(Permission.L0);
    expect(Object.isFrozen(read)).toBe(true);
    expect(read).toBeInstanceOf(Permission);
  });
});
