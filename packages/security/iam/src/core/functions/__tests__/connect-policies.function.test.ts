/**
 * Stackra file contract:
 * Purpose: unit test of `connectPolicies`: it hands the registry the resolver policy instances are built with, and a
 *          later call replaces it.
 * Boundary: test only; the resolvers are plain objects of the `Resolver` shape.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0132 (as amended by 0263).
 */
import type { Resolver } from "@stackra/actions";
import { describe, expect, it } from "@stackra/testing";

import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";
import { connectPolicies } from "#core/functions/connect-policies.function";

/** A resolver that binds nothing. */
const empty = (): Resolver => ({
  has: () => false,
  get: () => {
    throw new Error("nothing is bound");
  },
});

describe("connectPolicies", () => {
  it("sets the resolver, and a later call replaces it", () => {
    const first = empty();
    const second = empty();
    connectPolicies(first);
    expect(POLICY_REGISTRY.resolver).toBe(first);
    connectPolicies(second);
    expect(POLICY_REGISTRY.resolver).toBe(second);
  });
});
