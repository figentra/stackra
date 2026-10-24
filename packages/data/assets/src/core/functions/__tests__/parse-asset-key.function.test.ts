/**
 * Stackra file contract:
 * Purpose: unit tests of `parseAssetKey`: it splits `<module>::<kind>/<path>` keys (nested paths and dotted file names
 *          included) and refuses keys without the namespace or kind, with non-kebab names, or with a path that leaves
 *          its folder.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0234 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { parseAssetKey } from "#core/functions/parse-asset-key.function";

describe("parseAssetKey", () => {
  it("splits a key into module, kind and path", () => {
    expect(parseAssetKey("orders::public/logo.svg")).toEqual({
      module: "orders",
      kind: "public",
      path: "logo.svg",
    });
    expect(parseAssetKey("flags::public/images/eg.svg")).toEqual({
      module: "flags",
      kind: "public",
      path: "images/eg.svg",
    });
    expect(parseAssetKey("feature-flags::ai/explain-order.eval.json")).toEqual({
      module: "feature-flags",
      kind: "ai",
      path: "explain-order.eval.json",
    });
  });

  it("refuses strings that are not asset keys", () => {
    for (const key of [
      "",
      "logo.svg",
      "public/logo.svg",
      "orders::logo.svg",
      "orders::/logo.svg",
      "::public/logo.svg",
      "Orders::public/logo.svg",
      "orders::Public/logo.svg",
      "orders_x::public/logo.svg",
      "orders-::public/logo.svg",
      "orders::public/",
      "orders::public/../secrets.json",
      "orders::public//logo.svg",
    ])
      expect(() => parseAssetKey(key), key).toThrow(TypeError);
  });

  it("names the expected form in its message", () => {
    expect(() => parseAssetKey("logo.svg")).toThrow(/<module>::<kind>\/<path>/);
  });
});
