/**
 * Stackra file contract:
 * Purpose: unit tests of `connectExtensions`: it sets the connected resolver and its inline implementers, and a second
 *          call replaces both.
 * Boundary: test only; reads the internal host to observe the write.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 23 and 25).
 */
import { describe, expect, it } from "@stackra/testing";

import { ExtensionPoint } from "#core/bases/extension-point.base";
import { EXTENSION_HOST } from "#core/constants/extension-host.constant";
import { connectExtensions } from "#core/functions/connect-extensions.function";
import type { Resolver } from "#core/types/resolver.type";

class EarnPoint extends ExtensionPoint {
  readonly earnAdjust = ExtensionPoint.after<number, []>();
}

const resolver: Resolver = {
  has: () => false,
  get: () => {
    throw new Error("nothing bound");
  },
};

describe(connectExtensions, () => {
  it("connects a resolver with its inline implementers, replacing the previous connection", () => {
    const inline = {
      point: EarnPoint,
      slot: "earnAdjust",
      order: 1,
      handle: (points: number) => points + 1,
    };
    connectExtensions(resolver, [inline]);
    expect(EXTENSION_HOST.resolver).toBe(resolver);
    expect(EXTENSION_HOST.inline).toEqual([inline]);
    connectExtensions(resolver);
    expect(EXTENSION_HOST.inline).toEqual([]);
  });
});
