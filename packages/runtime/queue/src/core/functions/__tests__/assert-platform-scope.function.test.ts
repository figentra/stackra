/**
 * Stackra file contract:
 * Purpose: unit tests of `assertPlatformScope`: no scope and a `ScopeRef`-shaped one pass; a string, an array, null, a
 *          bare id or path, a foreign id prefix, a path that is not an `ltree` path and a non-string member are
 *          refused with `ScopeNotPlatformWrittenError`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098; ADR 0495 (note of 2026-11-01).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScopeNotPlatformWrittenError } from "#core/errors/scope-not-platform-written.error";
import { assertPlatformScope } from "#core/functions/assert-platform-scope.function";

/** What `assertPlatformScope(value)` throws, or `undefined` when it passes. */
function thrownBy(value: unknown): unknown {
  try {
    assertPlatformScope(value);
    return undefined;
  } catch (error) {
    return error;
  }
}

describe(assertPlatformScope, () => {
  it("passes no scope and a ScopeRef-shaped one", () => {
    expect(thrownBy(undefined)).toBeUndefined();
    expect(
      thrownBy({ id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme.shop_eu" }),
    ).toBeUndefined();
  });

  it("refuses everything else", () => {
    const refused: unknown[] = [
      "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
      "platform.acme",
      ["platform.acme"],
      null,
      42,
      {},
      { id: "scp_1" },
      { path: "platform.acme" },
      { id: "usr_1", path: "platform.acme" },
      { id: "scp_", path: "platform.acme" },
      { id: "scp_1", path: "" },
      { id: "scp_1", path: "platform.acme.*" },
      { id: ["scp_1"], path: "platform.acme" },
    ];
    for (const value of refused)
      expect(isRefusal(thrownBy(value), ScopeNotPlatformWrittenError)).toBe(true);
  });
});
