/**
 * Stackra file contract:
 * Purpose: unit tests of `githubPlan` over root runways shaped like the template's: the repository, the Infisical
 *          variables derived from `providers.infisical`, one environment per deploying runway environment plus the
 *          ones only GitHub knows, each with its reviewers and deploy refs, the CI secret names, a public visibility
 *          and literal values; and every refusal (no or malformed block, a secret name as a variable, `dev`, a team
 *          outside the org, a promoted environment nobody approves, too many reviewers).
 * Boundary: test only; the documents go through `parseRunway`, so each fixture is also a valid version 3 root runway.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170 (decision 6); ADR 0173 (decisions 5 and 6); ADR 0284.
 */
import { parseRunway } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";
import { githubPlan } from "#core/functions/github-plan.function";

const GITHUB = {
  org: "acme",
  repo: "acme-platform",
  variables: { INFISICAL_CI_IDENTITY_ID: "ref:infisical.ciIdentityId" },
  environments: {
    production: { reviewers: ["acme/platform-team", "octo-owner"] },
    release: { reviewers: ["acme/platform-team"] },
    static: { branches: ["main"], tags: ["schemas@*"] },
  },
};

/** A root runway like the template's, with `providers.github` replaced; an explicit `undefined` leaves it out. */
const root = (...args: [github?: unknown]) => {
  const github = args.length === 0 ? GITHUB : args[0];
  return parseRunway("root", {
    version: 3,
    project: "acme-platform",
    providers: {
      ...(github === undefined ? {} : { github }),
      infisical: { domain: "https://eu.infisical.com", workspace: "ref:infisical.workspace" },
    },
    environments: {
      dev: { destinations: { services: "compose" } },
      preview: { deploy: { on: "pull-request", gate: "health" } },
      staging: { deploy: { on: "merge-to-main" } },
      production: { deploy: { on: "promote", approval: "github-environment" } },
    },
    secrets: { ci: ["EXPO_TOKEN", "TURBO_TOKEN"], gateway: ["GATEWAY_SIGNING_KEY"] },
  });
};

/** The paths a refused plan names. */
const pathsOf = (run: () => unknown): string[] => {
  try {
    run();
  } catch (error) {
    if (error instanceof GithubInfraInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("Expected a GithubInfraInvalidError");
};

describe("githubPlan", () => {
  it("builds the repository, its variables and its environments from the root runway", () => {
    expect(githubPlan(root())).toEqual({
      org: "acme",
      repo: "acme-platform",
      visibility: "private",
      variables: {
        INFISICAL_DOMAIN: "https://eu.infisical.com",
        INFISICAL_PROJECT_ID: "ref:infisical.workspace",
        INFISICAL_CI_IDENTITY_ID: "ref:infisical.ciIdentityId",
      },
      environments: [
        { name: "preview", teams: [], users: [], branches: [], tags: [], variables: {} },
        { name: "staging", teams: [], users: [], branches: ["main"], tags: [], variables: {} },
        {
          name: "production",
          teams: ["platform-team"],
          users: ["octo-owner"],
          branches: ["main"],
          tags: [],
          variables: {},
        },
        {
          name: "release",
          teams: ["platform-team"],
          users: [],
          branches: ["main"],
          tags: [],
          variables: {},
        },
        {
          name: "static",
          teams: [],
          users: [],
          branches: ["main"],
          tags: ["schemas@*"],
          variables: {},
        },
      ],
      ciSecrets: ["EXPO_TOKEN", "TURBO_TOKEN"],
    });
  });

  it("takes a stated visibility, literal values, tag-only refs and environment variables", () => {
    const plan = githubPlan(
      root({
        org: "acme",
        repo: "acme-platform",
        visibility: "public",
        variables: { BUILD_SHARDS: 4, SMOKE_ENABLED: true },
        environments: {
          preview: { branches: ["feature/*"] },
          production: {
            reviewers: ["octo-owner"],
            variables: { AWS_ROLE_ARN: "ref:aws.roles.prod" },
          },
          static: { tags: ["schemas@*"] },
        },
      }),
    );

    expect(plan.visibility).toBe("public");
    expect(plan.variables).toMatchObject({ BUILD_SHARDS: "4", SMOKE_ENABLED: "true" });
    expect(
      plan.environments.find((environment) => environment.name === "preview")?.branches,
    ).toEqual(["feature/*"]);
    expect(
      plan.environments.find((environment) => environment.name === "production"),
    ).toMatchObject({
      users: ["octo-owner"],
      variables: { AWS_ROLE_ARN: "ref:aws.roles.prod" },
    });
    expect(plan.environments.find((environment) => environment.name === "static")).toMatchObject({
      branches: [],
      tags: ["schemas@*"],
    });
  });

  it("refuses a missing or malformed providers.github block", () => {
    expect(pathsOf(() => githubPlan(root(undefined)))).toEqual(["root.providers.github"]);
    expect(
      pathsOf(() =>
        githubPlan(
          root({ org: "acme", repo: "acme platform", visibility: "secret", owner: "acme" }),
        ),
      ),
    ).toEqual(
      expect.arrayContaining([
        "root.providers.github",
        "root.providers.github.repo",
        "root.providers.github.visibility",
      ]),
    );
    expect(
      pathsOf(() =>
        githubPlan(root({ org: "acme", repo: "acme-platform", variables: { GITHUB_TOKEN: "x" } })),
      ),
    ).toEqual([expect.stringMatching(/^root\.providers\.github\.variables/)]);
  });

  it("refuses more than six reviewers on one environment", () => {
    const reviewers = ["a", "b", "c", "d", "e", "f", "g"];
    expect(
      pathsOf(() =>
        githubPlan(
          root({ org: "acme", repo: "acme-platform", environments: { production: { reviewers } } }),
        ),
      ),
    ).toEqual(["root.providers.github.environments.production.reviewers"]);
  });

  it("names every refusal at once", () => {
    expect(
      pathsOf(() =>
        githubPlan(
          root({
            org: "acme",
            repo: "acme-platform",
            variables: { EXPO_TOKEN: "x" },
            environments: {
              dev: {},
              staging: {
                reviewers: ["other-org/platform-team"],
                variables: { GATEWAY_SIGNING_KEY: "x" },
              },
            },
          }),
        ),
      ),
    ).toEqual([
      "root.providers.github.variables.EXPO_TOKEN",
      "root.providers.github.environments.staging.reviewers.0",
      "root.providers.github.environments.staging.variables.GATEWAY_SIGNING_KEY",
      "root.providers.github.environments.production.reviewers",
      "root.providers.github.environments.dev",
    ]);
  });
});
