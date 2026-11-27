/**
 * Stackra file contract:
 * Purpose: unit tests of `singular`: the regular English singular of a module key's last word, the inverse of gen's
 *          `plural`, and a word that is not plural kept as it is.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { singular } from "#node/feature-scaffold/functions/singular.function";

describe(singular, () => {
  it.each([
    ["orders", "order"],
    ["price-lists", "price-list"],
    ["categories", "category"],
    ["addresses", "address"],
    ["boxes", "box"],
    ["keys", "key"],
    ["billing", "billing"],
    ["status", "status"],
  ])("%s is %s", (plural, one) => {
    expect(singular(plural)).toBe(one);
  });
});
