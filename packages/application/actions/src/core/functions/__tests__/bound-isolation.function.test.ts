/**
 * Stackra file contract:
 * Purpose: unit tests of `boundIsolation`: the container's bound `CallIsolation`, or `undefined` when it binds none.
 * Boundary: test only; map resolvers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495.
 */
import { describe, expect, it } from "@stackra/testing";

import { CallIsolation } from "#contracts/ports/call-isolation.port";
import { boundIsolation } from "#core/functions/bound-isolation.function";
import type { Resolver } from "#core/types/resolver.type";

describe("boundIsolation", () => {
  it("answers the bound isolation, or undefined when none is bound", () => {
    const isolation = { run: async () => undefined } as unknown as CallIsolation;
    const bound: Resolver = {
      has: (token) => token === CallIsolation,
      get: <T extends object>() => isolation as unknown as T,
    };
    expect(boundIsolation(bound)).toBe(isolation);
    expect(boundIsolation({ has: () => false, get: () => ({}) as never })).toBeUndefined();
  });
});
