/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `identityStack` and `readIdentitySeed` are its only values,
 *          none of them also exported by `.`, typed as the generated Pulumi program calls them.
 * Boundary: test only; imports the stand-in barrels through their aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { IdentityPlan, IdentitySeed } from "#core/index";
import * as node from "#node/index";
import type { IdentityStack } from "#node/index";

describe("@stackra/infra-identity/node", () => {
  it("exports exactly its values, none of them also exported by .", () => {
    expect(Object.keys(node).sort()).toEqual(["identityStack", "readIdentitySeed"]);
    for (const name of Object.keys(node)) expect(Object.keys(core)).not.toContain(name);
  });

  it("types the reader and the Pulumi slice", () => {
    expectTypeOf(node.readIdentitySeed).parameters.toEqualTypeOf<[file: string]>();
    expectTypeOf(node.readIdentitySeed).returns.toEqualTypeOf<IdentitySeed>();
    expectTypeOf(node.identityStack).parameters.toEqualTypeOf<[plan: IdentityPlan]>();
    expectTypeOf(node.identityStack).returns.toEqualTypeOf<IdentityStack>();
  });
});
