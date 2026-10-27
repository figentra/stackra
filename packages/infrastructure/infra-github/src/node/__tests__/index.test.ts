/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `githubStack` and `readGithubRules` are its only values,
 *          neither is also exported by `.`, and they take and return the plan, rules and stack types.
 * Boundary: test only; imports the stand-in barrels through their aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type * as pulumi from "@pulumi/pulumi";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { GithubPlan, GithubRules } from "#core/index";
import * as node from "#node/index";
import type { GithubStack } from "#node/index";

describe("@stackra/infra-github/node", () => {
  it("exports exactly its values, none of them also exported by .", () => {
    expect(Object.keys(node).sort()).toEqual(["githubStack", "readGithubRules"]);
    for (const name of Object.keys(node)) expect(Object.keys(core)).not.toContain(name);
  });

  it("types the reader and the Pulumi slice", () => {
    expectTypeOf(node.readGithubRules).parameters.toEqualTypeOf<[directory: string]>();
    expectTypeOf(node.readGithubRules).returns.toEqualTypeOf<GithubRules>();
    expectTypeOf(node.githubStack).parameters.toEqualTypeOf<
      [plan: GithubPlan, rules: GithubRules, config?: pulumi.Config | undefined]
    >();
    expectTypeOf(node.githubStack).returns.toEqualTypeOf<GithubStack>();
  });
});
