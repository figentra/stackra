/**
 * Stackra file contract:
 * Purpose: `githubPlan(root)`, the repository as code from the root runway: the org, repository and visibility in
 *          `providers.github`; the repository Actions variables (the Infisical domain and project from
 *          `providers.infisical`, which the CI login reads, plus the block's own); one deployment environment per
 *          runway environment that deploys (`environments.<env>.deploy`) and per environment the block names, each
 *          with its reviewers, the refs that may deploy to it and its variables; and the CI secret names.
 * Boundary: pure: a parsed root runway in, a plan out. A `ref:` value stays a ref; the Pulumi slice (`./node`)
 *           resolves it. Reports every failure at once. Reads no file and calls no cloud.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decisions 2 and 4), ADR 0170 (decisions 5 and 6: production promotes behind a GitHub
 *                     environment the owner approves), ADR 0173 (decisions 5 and 6: CI reads Infisical over OIDC,
 *                     secret names in git and values never), ADR 0284 (decisions 6 and 7), ADR 0296 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment } from "@stackra/runway";
import type { RootRunway, RunwayIssue } from "@stackra/runway";

import { GITHUB_PROVIDER_SCHEMA } from "#core/constants/github-provider-schema.constant";
import { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";
import { issuesOf } from "#core/functions/issues-of.function";
import type { GithubEnvironment } from "#core/types/github-environment.type";
import type { GithubPlan } from "#core/types/github-plan.type";

/**
 * The GitHub plan of a repository.
 *
 * @param root - the parsed root runway.
 * @throws GithubInfraInvalidError naming every invalid path, prefixed `root.`: a missing or malformed
 *         `providers.github` block, a variable that carries a CI or gateway secret's name, a `dev` environment, a team
 *         reviewer outside the org, or an environment promoted behind a GitHub approval (`deploy.approval:
 *         github-environment`) with no reviewer.
 * @example
 * const plan = githubPlan(readRunway("runway.yaml", "root"));
 * plan.environments.map((environment) => environment.name); // ["preview", "staging", "production", "release"]
 */
export function githubPlan(root: RootRunway): GithubPlan {
  const parsed = GITHUB_PROVIDER_SCHEMA.safeParse(root.providers?.github);
  if (!parsed.success) {
    throw new GithubInfraInvalidError(
      "the root runway",
      issuesOf(parsed.error, "root.providers.github"),
    );
  }
  const github = parsed.data;
  const issues: RunwayIssue[] = [];

  const secrets = new Set([...(root.secrets?.ci ?? []), ...(root.secrets?.gateway ?? [])]);
  const checked = (
    variables: Readonly<Record<string, string>> | undefined,
    path: string,
  ): Readonly<Record<string, string>> => {
    for (const name of Object.keys(variables ?? {})) {
      if (secrets.has(name)) {
        issues.push({
          path: `${path}.${name}`,
          message:
            "A secret name: jobs read it from Infisical over OIDC, and GitHub holds no secret value",
        });
      }
    }
    return variables ?? {};
  };

  const infisical = root.providers?.infisical;
  const variables = {
    ...(infisical?.domain === undefined ? {} : { INFISICAL_DOMAIN: infisical.domain }),
    ...(infisical?.workspace === undefined
      ? {}
      : { INFISICAL_PROJECT_ID: String(infisical.workspace) }),
    ...checked(github.variables, "root.providers.github.variables"),
  };

  const declared = github.environments ?? {};
  const names = new Set([
    ...Enum.values(RunwayEnvironment).filter(
      (name) => name !== RunwayEnvironment.Dev && root.environments[name]?.deploy !== undefined,
    ),
    ...Object.keys(declared),
  ]);
  const environments: GithubEnvironment[] = [];
  for (const name of names) {
    const path = `root.providers.github.environments.${name}`;
    if (name === RunwayEnvironment.Dev) {
      issues.push({
        path,
        message: "dev runs on a developer machine and has no GitHub environment",
      });
      continue;
    }
    const entry = declared[name];
    const runway = Enum.values(RunwayEnvironment).find((environment) => environment === name);
    const deploy = runway === undefined ? undefined : root.environments[runway]?.deploy;

    const teams: string[] = [];
    const users: string[] = [];
    (entry?.reviewers ?? []).forEach((reviewer, index) => {
      const [owner = "", team] = reviewer.split("/");
      if (team === undefined) users.push(reviewer);
      else if (owner === github.org) teams.push(team);
      else {
        issues.push({
          path: `${path}.reviewers.${index}`,
          message: `A team reviewer belongs to ${github.org}`,
        });
      }
    });
    if (deploy?.approval === "github-environment" && teams.length + users.length === 0) {
      issues.push({
        path: `${path}.reviewers`,
        message: `${name} is promoted behind a GitHub environment approval, so it names who approves`,
      });
    }

    // A pull-request preview deploys from any branch; everything else from main unless the block names its refs.
    const anyRef =
      entry?.branches === undefined && entry?.tags === undefined && deploy?.on === "pull-request";
    environments.push({
      name,
      teams,
      users,
      branches: entry?.branches ?? (anyRef || entry?.tags !== undefined ? [] : ["main"]),
      tags: entry?.tags ?? [],
      variables: checked(entry?.variables, `${path}.variables`),
    });
  }

  if (issues.length > 0) throw new GithubInfraInvalidError("the root runway", issues);
  return {
    org: github.org,
    repo: github.repo,
    visibility: github.visibility,
    variables,
    environments,
    ciSecrets: [...(root.secrets?.ci ?? [])],
  };
}
