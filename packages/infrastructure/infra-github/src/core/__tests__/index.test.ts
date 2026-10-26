/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the plan builder, the two rules-file checks, the visibility enum
 *          and the error are exported, nothing else is (the schemas, `issuesOf` and `mappable` stay internal), the
 *          entry loads without Pulumi, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { RootRunway } from "@stackra/runway";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type {
  BranchProtectionDocument,
  GithubEnvironment,
  GithubPlan,
  GithubRules,
  GithubVisibility,
  RulesetDocument,
} from "#core/index";

describe("@stackra/infra-github", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "GithubHealthIndicatorDriver",
      "GithubInfraInvalidError",
      "GithubVisibility",
      "githubPlan",
      "parseBranchProtection",
      "parseRuleset",
    ]);
  });

  it("types the plan builder and the checks", () => {
    expectTypeOf(core.githubPlan).parameters.toEqualTypeOf<[root: RootRunway]>();
    expectTypeOf(core.githubPlan).returns.toEqualTypeOf<GithubPlan>();
    expectTypeOf(core.parseRuleset).returns.toEqualTypeOf<RulesetDocument>();
    expectTypeOf(core.parseBranchProtection).returns.toEqualTypeOf<BranchProtectionDocument>();
  });

  it("resolves the public types", () => {
    expectTypeOf<GithubPlan["environments"]>().toEqualTypeOf<readonly GithubEnvironment[]>();
    expectTypeOf<GithubPlan["visibility"]>().toEqualTypeOf<GithubVisibility>();
    expectTypeOf<GithubRules["rulesets"]>().toEqualTypeOf<readonly RulesetDocument[]>();
  });
});
