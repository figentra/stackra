/**
 * Stackra file contract:
 * Purpose: unit tests of `githubStack` under Pulumi's mocks: the provider is the runway's org; the repository allows
 *          squash merges only, keeps the commit messages, deletes merged branches, turns on secret scanning and push
 *          protection when public (not when private) and is protected and retained; the OIDC subject template stays
 *          GitHub's default; variables resolve `ref:` values from the stack config; each environment gets its
 *          reviewers (team and user ids looked up), its deploy refs and its variables, and a preview none; the
 *          committed ruleset and branch protection map to the provider; no Actions secret is created; an unset `ref:`
 *          fails before anything is applied; the outputs resolve.
 * Boundary: test only; `pulumi.runtime.setMocks` and `setAllConfig` stand in for the engine, GitHub and the stack
 *           config, so nothing reaches GitHub and no state is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decisions 2, 3 and 8); ADR 0119 (decision 6); ADR 0173.
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { parseBranchProtection } from "#core/functions/parse-branch-protection.function";
import { parseRuleset } from "#core/functions/parse-ruleset.function";
import type { GithubPlan } from "#core/types/github-plan.type";
import type { GithubRules } from "#core/types/github-rules.type";
import { githubStack } from "#node/functions/github-stack.function";
import type { GithubStack } from "#node/types/github-stack.type";

/** One resource the program registered: its type token, logical name, resolved inputs and options. */
type Registered = {
  readonly type: string;
  readonly name: string;
  readonly inputs: Record<string, unknown>;
};

const registered: Registered[] = [];
const invoked: { token: string; inputs: Record<string, unknown> }[] = [];

const PLAN: GithubPlan = {
  org: "acme",
  repo: "acme-platform",
  visibility: "public",
  variables: {
    INFISICAL_DOMAIN: "https://eu.infisical.com",
    INFISICAL_PROJECT_ID: "ref:infisical.workspace",
  },
  environments: [
    { name: "preview", teams: [], users: [], branches: [], tags: [], variables: {} },
    {
      name: "production",
      teams: ["platform-team"],
      users: ["octo-owner"],
      branches: ["main"],
      tags: [],
      variables: { AWS_ROLE_ARN: "arn:aws:iam::123456789012:role/acme-production-infra" },
    },
    { name: "static", teams: [], users: [], branches: ["main"], tags: ["schemas@*"], variables: {} },
  ],
  ciSecrets: ["EXPO_TOKEN"],
};

const RULES: GithubRules = {
  rulesets: [
    parseRuleset({
      name: "main",
      target: "branch",
      enforcement: "active",
      conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
      bypass_actors: [{ actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" }],
      rules: [
        { type: "deletion" },
        { type: "non_fast_forward" },
        { type: "update", parameters: { update_allows_fetch_and_merge: true } },
        {
          type: "pull_request",
          parameters: { required_approving_review_count: 1, allowed_merge_methods: ["squash"] },
        },
        {
          type: "required_status_checks",
          parameters: {
            strict_required_status_checks_policy: false,
            required_status_checks: [{ context: "Quality Gate", integration_id: 15368 }],
          },
        },
        { type: "merge_queue", parameters: { merge_method: "SQUASH", grouping_strategy: "ALLGREEN" } },
      ],
    }),
  ],
  branchProtection: parseBranchProtection({
    branch: "main",
    rules: {
      required_status_checks: { strict: false, contexts: ["Quality Gate"] },
      enforce_admins: null,
      required_pull_request_reviews: { dismiss_stale_reviews: true, required_approving_review_count: 0 },
      restrictions: null,
      required_linear_history: true,
    },
  }),
};

/** The value `output` resolves to. */
function valueOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => {
    output.apply(resolve);
  });
}

/** The registered resource whose type token ends in `:<kind>` and whose logical name is `name`. */
function resource(kind: string, name: string): Registered {
  const found = registered.find((entry) => entry.type.endsWith(`:${kind}`) && entry.name === name);
  if (found === undefined) throw new Error(`No ${kind} named ${name} was registered`);
  return found;
}

let stack: GithubStack;

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        const inputs = args.inputs as Record<string, unknown>;
        registered.push({ type: args.type, name: args.name, inputs });
        return {
          id: `${args.name}-id`,
          state: { ...inputs, fullName: `acme/${String(inputs["name"])}`, nodeId: "R_kgDOacme" },
        };
      },
      call: (args) => {
        invoked.push({ token: args.token, inputs: args.inputs as Record<string, unknown> });
        return { id: args.token.endsWith("getTeam") ? "4242" : "7" };
      },
    },
    "infra",
    "production",
    false,
  );
  pulumi.runtime.setAllConfig({ "infra:infisical": JSON.stringify({ workspace: "ws-123" }) });
  stack = githubStack(PLAN, RULES);
  // Provider, repository, OIDC template, 2 variables, 3 environments, 3 deploy policies, 1 environment variable,
  // 1 ruleset and 1 branch protection: 14 registrations, some after the team and user lookups.
  await vi.waitFor(() => expect(registered).toHaveLength(14));
});

describe("githubStack", () => {
  it("talks to the runway's org", () => {
    expect(resource("github", "acme-platform").inputs).toMatchObject({ owner: "acme" });
  });

  it("sets the repository's merge, branch and secret scanning settings", () => {
    expect(resource("Repository", "acme-platform").inputs).toMatchObject({
      name: "acme-platform",
      visibility: "public",
      allowMergeCommit: false,
      allowRebaseMerge: false,
      allowSquashMerge: true,
      squashMergeCommitTitle: "COMMIT_OR_PR_TITLE",
      squashMergeCommitMessage: "COMMIT_MESSAGES",
      deleteBranchOnMerge: true,
      securityAndAnalysis: {
        secretScanning: { status: "enabled" },
        secretScanningPushProtection: { status: "enabled" },
      },
    });
  });

  it("pins the default OIDC subject and creates no Actions secret", () => {
    expect(
      resource("ActionsRepositoryOidcSubjectClaimCustomizationTemplate", "acme-platform-oidc").inputs,
    ).toMatchObject({ repository: "acme-platform", useDefault: true });
    expect(registered.filter((entry) => /secret/i.test(entry.type))).toEqual([]);
  });

  it("sets the repository variables, resolving refs from the stack config", () => {
    expect(resource("ActionsVariable", "acme-platform-INFISICAL_DOMAIN").inputs).toMatchObject({
      variableName: "INFISICAL_DOMAIN",
      value: "https://eu.infisical.com",
    });
    expect(resource("ActionsVariable", "acme-platform-INFISICAL_PROJECT_ID").inputs).toMatchObject({
      variableName: "INFISICAL_PROJECT_ID",
      value: "ws-123",
    });
  });

  it("gives each environment its reviewers, deploy refs and variables", () => {
    const preview = resource("RepositoryEnvironment", "acme-platform-preview").inputs;
    expect(preview).toMatchObject({ environment: "preview" });
    expect(preview["reviewers"]).toBeUndefined();
    expect(preview["deploymentBranchPolicy"]).toBeUndefined();

    expect(resource("RepositoryEnvironment", "acme-platform-production").inputs).toMatchObject({
      environment: "production",
      reviewers: [{ teams: [4242], users: [7] }],
      deploymentBranchPolicy: { protectedBranches: false, customBranchPolicies: true },
    });
    expect(invoked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ inputs: expect.objectContaining({ slug: "platform-team" }) }),
        expect.objectContaining({ inputs: expect.objectContaining({ username: "octo-owner" }) }),
      ]),
    );
    expect(
      resource("RepositoryEnvironmentDeploymentPolicy", "acme-platform-production-branch-main").inputs,
    ).toMatchObject({ environment: "production", branchPattern: "main" });
    expect(
      resource("RepositoryEnvironmentDeploymentPolicy", "acme-platform-static-tag-schemas@*").inputs,
    ).toMatchObject({ environment: "static", tagPattern: "schemas@*" });
    expect(
      resource("ActionsEnvironmentVariable", "acme-platform-production-AWS_ROLE_ARN").inputs,
    ).toMatchObject({ environment: "production", variableName: "AWS_ROLE_ARN" });
  });

  it("applies the committed ruleset through the provider", () => {
    expect(resource("RepositoryRuleset", "acme-platform-main").inputs).toMatchObject({
      name: "main",
      repository: "acme-platform",
      target: "branch",
      enforcement: "active",
      conditions: { refName: { includes: ["~DEFAULT_BRANCH"], excludes: [] } },
      bypassActors: [{ actorId: 5, actorType: "RepositoryRole", bypassMode: "always" }],
      rules: {
        deletion: true,
        nonFastForward: true,
        update: true,
        updateAllowsFetchAndMerge: true,
        pullRequest: { requiredApprovingReviewCount: 1, allowedMergeMethods: ["squash"] },
        requiredStatusChecks: {
          requiredChecks: [{ context: "Quality Gate", integrationId: 15368 }],
          strictRequiredStatusChecksPolicy: false,
        },
        mergeQueue: { mergeMethod: "SQUASH", groupingStrategy: "ALLGREEN" },
      },
    });
  });

  it("applies the committed branch protection", () => {
    expect(resource("BranchProtection", "acme-platform-main").inputs).toMatchObject({
      repositoryId: "R_kgDOacme",
      pattern: "main",
      enforceAdmins: false,
      requiredStatusChecks: [{ strict: false, contexts: ["Quality Gate"] }],
      requiredPullRequestReviews: [{ dismissStaleReviews: true, requiredApprovingReviewCount: 0 }],
      requiredLinearHistory: true,
    });
  });

  it("returns the repository's full name and the CI secret names", async () => {
    expect(await valueOf(stack.repository)).toBe("acme/acme-platform");
    expect(stack.ciSecrets).toEqual(["EXPO_TOKEN"]);
  });

  it("leaves secret scanning to the owner on a private repository", async () => {
    githubStack({ ...PLAN, repo: "acme-private", visibility: "private", environments: [] }, { rulesets: [] });
    await vi.waitFor(() => resource("Repository", "acme-private"));

    expect(resource("Repository", "acme-private").inputs["securityAndAnalysis"]).toBeUndefined();
  });

  it("fails on a ref the stack config does not hold", () => {
    expect(() =>
      githubStack(
        { ...PLAN, repo: "acme-missing", variables: { INFISICAL_PROJECT_ID: "ref:missing.workspace" } },
        { rulesets: [] },
      ),
    ).toThrow(/missing/);
  });
});
