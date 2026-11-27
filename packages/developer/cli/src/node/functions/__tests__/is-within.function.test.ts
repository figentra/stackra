/**
 * Stackra file contract:
 * Purpose: unit tests of `isWithin`: the folder itself and a folder inside it are within; a parent, a sibling that
 *          shares a name prefix and an unrelated folder are not.
 * Boundary: test only; pure paths.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2888.
 */
import { describe, expect, it } from "@stackra/testing";

import { isWithin } from "#node/functions/is-within.function";

describe("isWithin", () => {
  it("holds the folder itself and every folder inside it", () => {
    expect(isWithin("/repo/services/orders", "/repo/services/orders")).toBe(true);
    expect(isWithin("/repo/services/orders", "/repo/services/orders/src/modules")).toBe(true);
    expect(isWithin("/repo/services/orders", "/repo/services/orders/..orders")).toBe(true);
  });

  it("holds no parent, sibling sharing a name prefix or unrelated folder", () => {
    expect(isWithin("/repo/services/orders", "/repo")).toBe(false);
    expect(isWithin("/repo/services/orders", "/repo/services/orders-admin")).toBe(false);
    expect(isWithin("/repo/services/orders", "/elsewhere")).toBe(false);
  });
});
