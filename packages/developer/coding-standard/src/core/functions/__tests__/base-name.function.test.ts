/**
 * Stackra file contract:
 * Purpose: unit tests of `baseName`: POSIX and Windows separators, a bare name and a trailing separator.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { baseName } from "#core/functions/base-name.function";

describe("baseName", () => {
  it.each([
    ["src/modules/orders/actions/cancel-order.action.ts", "cancel-order.action.ts"],
    ["C:\\repo\\src\\use-cart.ts", "use-cart.ts"],
    ["orders.module.ts", "orders.module.ts"],
    ["src/actions/", ""],
  ])("baseName(%j) is %j", (path, expected) => {
    expect(baseName(path)).toBe(expected);
  });
});
