/**
 * Stackra file contract:
 * Purpose: unit tests of `activeContributions`: contributions that enhance nothing are live, those whose enhanced
 *          module is installed are live, the rest stay inert, in input order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0350 (decisions 4 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { activeContributions } from "#core/functions/active-contributions.function";

const items = [{ key: "a" }, { key: "b", enhances: "tills" }, { key: "c", enhances: "orders" }];

describe("activeContributions", () => {
  it("keeps what enhances nothing or an installed module", () => {
    expect(activeContributions(items, new Set(["orders"])).map((item) => item.key)).toEqual([
      "a",
      "c",
    ]);
    expect(activeContributions(items, new Set()).map((item) => item.key)).toEqual(["a"]);
  });
});
