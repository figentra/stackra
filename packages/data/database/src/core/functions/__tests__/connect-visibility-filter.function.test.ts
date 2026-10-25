/**
 * Stackra file contract:
 * Purpose: unit tests of `connectVisibilityFilter`: it sets the resolver the reads take the visibility driver from,
 *          replaces it whole, and `undefined` disconnects.
 * Boundary: test only; the resolvers are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0333 (decision 4); ADR 0022; ADR 0269.
 */
import type { Resolver } from "@stackra/actions";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { VISIBILITY_HOST } from "#core/constants/visibility-host.constant";
import { connectVisibilityFilter } from "#core/functions/connect-visibility-filter.function";

/** A resolver that binds nothing. */
function emptyResolver(): Resolver {
  return {
    has: () => false,
    get: () => {
      throw new Error("nothing is bound");
    },
  };
}

afterEach(() => {
  connectVisibilityFilter(undefined);
});

describe(connectVisibilityFilter, () => {
  it("connects, replaces and disconnects the resolver", () => {
    const first = emptyResolver();
    const second = emptyResolver();
    connectVisibilityFilter(first);
    expect(VISIBILITY_HOST.resolver).toBe(first);
    connectVisibilityFilter(second);
    expect(VISIBILITY_HOST.resolver).toBe(second);
    connectVisibilityFilter(undefined);
    expect(VISIBILITY_HOST.resolver).toBeUndefined();
  });
});
