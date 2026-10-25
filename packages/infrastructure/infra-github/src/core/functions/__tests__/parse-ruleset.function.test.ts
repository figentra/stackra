/**
 * Stackra file contract:
 * Purpose: unit tests of `parseRuleset`: the template's `main` ruleset and a `schemas@*` tag ruleset pass; unmapped
 *          settings pass while off and are refused while on (the `require_extra_approval_for_unattributed_changes`
 *          setting of this repository's own `main` ruleset); a push target, a missing ref condition, a rule type this
 *          package does not apply and a repeated rule type are refused, each with its path and the file named.
 * Boundary: test only; the documents are inline copies of the committed JSON shapes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 8); ADR 0119 (decision 6); ADR 0288.
 */
import { describe, expect, it } from "@stackra/testing";

import { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";
import { parseRuleset } from "#core/functions/parse-ruleset.function";

/** The template's `.github/rulesets/main.json`. */
const MAIN = {
  name: "main",
  target: "branch",
  enforcement: "active",
  conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
  bypass_actors: [],
  rules: [
    { type: "deletion" },
    { type: "non_fast_forward" },
    { type: "required_linear_history" },
    {
      type: "pull_request",
      parameters: {
        required_approving_review_count: 1,
        dismiss_stale_reviews_on_push: true,
        require_code_owner_review: true,
        require_last_push_approval: true,
        required_review_thread_resolution: true,
        allowed_merge_methods: ["squash"],
      },
    },
    {
      type: "required_status_checks",
      parameters: {
        strict_required_status_checks_policy: true,
        do_not_enforce_on_create: false,
        required_status_checks: [{ context: "Quality Gate", integration_id: 15368 }],
      },
    },
  ],
};

/** The paths a refused ruleset names, with the source the error carries. */
const refusal = (document: unknown): { source: string; paths: string[] } => {
  try {
    parseRuleset(document, ".github/rulesets/x.json");
  } catch (error) {
    if (error instanceof GithubInfraInvalidError) {
      return { source: error.source, paths: error.issues.map((issue) => issue.path) };
    }
    throw error;
  }
  throw new Error("Expected a GithubInfraInvalidError");
};

describe("parseRuleset", () => {
  it("accepts the template's main ruleset", () => {
    const ruleset = parseRuleset(MAIN, ".github/rulesets/main.json");

    expect(ruleset.name).toBe("main");
    expect(ruleset.rules.map((rule) => rule.type)).toEqual([
      "deletion",
      "non_fast_forward",
      "required_linear_history",
      "pull_request",
      "required_status_checks",
    ]);
  });

  it("accepts a tag ruleset and fills in no bypass actors", () => {
    const tags = {
      name: "schema-tags",
      target: "tag",
      enforcement: "active",
      conditions: { ref_name: { include: ["refs/tags/schemas@*"], exclude: [] } },
      rules: [{ type: "deletion" }, { type: "update" }, { type: "non_fast_forward" }],
    };

    expect(parseRuleset(tags).bypass_actors).toEqual([]);
  });

  it("passes an unmapped setting while it is off and refuses it while it is on", () => {
    const pullRequest = {
      type: "pull_request",
      parameters: {
        required_approving_review_count: 0,
        required_reviewers: [],
        dismissal_restriction: { enabled: false, allowed_actors: [] },
        require_extra_approval_for_unattributed_changes: false,
      },
    };
    expect(() => parseRuleset({ ...MAIN, rules: [pullRequest] })).not.toThrow();

    const on = {
      ...pullRequest,
      parameters: { ...pullRequest.parameters, require_extra_approval_for_unattributed_changes: true },
    };
    expect(refusal({ ...MAIN, rules: [{ type: "deletion" }, on] })).toEqual({
      source: ".github/rulesets/x.json",
      paths: ["rules.1.parameters.require_extra_approval_for_unattributed_changes"],
    });
  });

  it("refuses what the provider cannot apply here", () => {
    expect(refusal({ ...MAIN, target: "push" }).paths).toEqual(["target"]);
    expect(refusal({ ...MAIN, conditions: undefined }).paths).toEqual(["conditions"]);
    expect(refusal({ ...MAIN, rules: [{ type: "code_scanning" }] }).paths).toEqual([
      expect.stringMatching(/^rules\.0/),
    ]);
    expect(refusal({ ...MAIN, rules: [{ type: "deletion" }, { type: "deletion" }] }).paths).toEqual([
      "rules",
    ]);
  });
});
