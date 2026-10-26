/**
 * Stackra file contract:
 * Purpose: `githubStack(plan, rules, config?)`, the GitHub slice of the Pulumi program `stackra infra gen` composes:
 *          the repository's settings (squash merges only, keeping the commit messages; branches deleted on merge;
 *          secret scanning and push protection on a public repository), the OIDC subject template pinned to GitHub's
 *          default `repo:<org>/<repo>:environment:<env>` that the cloud roles and the Infisical CI identity trust,
 *          each deployment environment with its reviewers, deploy refs and variables, the repository variables, and
 *          every committed ruleset and the branch protection.
 * Boundary: runs inside a Pulumi program. Creates no Actions secret and reads no secret value: CI reads secrets from
 *           Infisical over OIDC (ADR 0173), so GitHub holds variables (ids) only. The repository is protected and
 *           retained on delete, so neither `pulumi destroy` nor a removed resource deletes it; the owner imports an
 *           existing repository once before the first `up`. The provider's token comes from the environment
 *           (`GITHUB_TOKEN`), never from this code. Agents run `pulumi preview` at most; `up` is the owner's.
 * Runtime: node
 * Governing contract: ADR 0171 (decisions 2, 3, 6 and 8), ADR 0119 (decision 6: squash only, branches deleted on
 *                     merge), ADR 0170 (decision 6), ADR 0072 (decision 2: push protection), ADR 0173 (decisions 5
 *                     and 6), ADR 0284 (decisions 6 and 7), ADR 0167 (CI over OIDC).
 */
import * as github from "@pulumi/github";
import * as pulumi from "@pulumi/pulumi";

import { GithubVisibility } from "#core/enums/github-visibility.enum";
import type { GithubPlan } from "#core/types/github-plan.type";
import type { GithubRules } from "#core/types/github-rules.type";
import { resolveRef } from "#node/functions/resolve-ref.function";
import { rulesetRules } from "#node/functions/ruleset-rules.function";
import type { GithubStack } from "#node/types/github-stack.type";

/**
 * Apply the plan and the committed rules to GitHub.
 *
 * @param plan - the plan `githubPlan` built from the root runway.
 * @param rules - the committed rules `readGithubRules` read.
 * @param config - the stack config that `ref:` values resolve from; defaults to the project's.
 * @throws Error (Pulumi's missing-configuration error) when a `ref:` variable is not set in the stack config.
 * @example
 * // .stackra/infra/index.ts (generated)
 * export const github = githubStack(githubPlan(root), readGithubRules(".github"));
 */
export function githubStack(
  plan: GithubPlan,
  rules: GithubRules,
  config: pulumi.Config = new pulumi.Config(),
): GithubStack {
  const opts = { provider: new github.Provider(plan.repo, { owner: plan.org }) };

  const repository = new github.Repository(
    plan.repo,
    {
      name: plan.repo,
      visibility: plan.visibility,
      allowMergeCommit: false,
      allowRebaseMerge: false,
      allowSquashMerge: true,
      squashMergeCommitTitle: "COMMIT_OR_PR_TITLE",
      squashMergeCommitMessage: "COMMIT_MESSAGES",
      deleteBranchOnMerge: true,
      // Free on a public repository; a private one needs GitHub's paid secret protection, an owner decision.
      ...(plan.visibility === GithubVisibility.Public
        ? {
            securityAndAnalysis: {
              secretScanning: { status: "enabled" },
              secretScanningPushProtection: { status: "enabled" },
            },
          }
        : {}),
    },
    { ...opts, protect: true, retainOnDelete: true },
  );

  void new github.ActionsRepositoryOidcSubjectClaimCustomizationTemplate(
    `${plan.repo}-oidc`,
    { repository: repository.name, useDefault: true },
    opts,
  );

  for (const [name, value] of Object.entries(plan.variables)) {
    void new github.ActionsVariable(
      `${plan.repo}-${name}`,
      { repository: repository.name, variableName: name, value: resolveRef(value, config) },
      opts,
    );
  }

  for (const environment of plan.environments) {
    const custom = environment.branches.length + environment.tags.length > 0;
    const reviewers =
      environment.teams.length + environment.users.length === 0
        ? undefined
        : Promise.all([
            Promise.all(
              environment.teams.map(async (slug) =>
                Number((await github.getTeam({ slug, summaryOnly: true }, opts)).id),
              ),
            ),
            Promise.all(
              environment.users.map(async (username) =>
                Number((await github.getUser({ username }, opts)).id),
              ),
            ),
          ]).then(([teams, users]) => [{ teams, users }]);
    const created = new github.RepositoryEnvironment(
      `${plan.repo}-${environment.name}`,
      {
        repository: repository.name,
        environment: environment.name,
        ...(reviewers === undefined ? {} : { reviewers }),
        ...(custom
          ? { deploymentBranchPolicy: { protectedBranches: false, customBranchPolicies: true } }
          : {}),
      },
      opts,
    );
    for (const branch of environment.branches) {
      void new github.RepositoryEnvironmentDeploymentPolicy(
        `${plan.repo}-${environment.name}-branch-${branch}`,
        { repository: repository.name, environment: created.environment, branchPattern: branch },
        opts,
      );
    }
    for (const tag of environment.tags) {
      void new github.RepositoryEnvironmentDeploymentPolicy(
        `${plan.repo}-${environment.name}-tag-${tag}`,
        { repository: repository.name, environment: created.environment, tagPattern: tag },
        opts,
      );
    }
    for (const [name, value] of Object.entries(environment.variables)) {
      void new github.ActionsEnvironmentVariable(
        `${plan.repo}-${environment.name}-${name}`,
        {
          repository: repository.name,
          environment: created.environment,
          variableName: name,
          value: resolveRef(value, config),
        },
        opts,
      );
    }
  }

  for (const ruleset of rules.rulesets) {
    void new github.RepositoryRuleset(
      `${plan.repo}-${ruleset.name}`,
      {
        name: ruleset.name,
        repository: repository.name,
        target: ruleset.target,
        enforcement: ruleset.enforcement,
        conditions: {
          refName: {
            includes: ruleset.conditions.ref_name.include,
            excludes: ruleset.conditions.ref_name.exclude,
          },
        },
        bypassActors: ruleset.bypass_actors.map((actor) => ({
          actorId: actor.actor_id ?? undefined,
          actorType: actor.actor_type,
          bypassMode: actor.bypass_mode,
        })),
        rules: rulesetRules(ruleset.rules),
      },
      opts,
    );
  }

  const protection = rules.branchProtection;
  if (protection !== undefined) {
    const { rules: branch } = protection;
    const checks = branch.required_status_checks;
    const reviews = branch.required_pull_request_reviews;
    void new github.BranchProtection(
      `${plan.repo}-${protection.branch}`,
      {
        repositoryId: repository.nodeId,
        pattern: protection.branch,
        enforceAdmins: branch.enforce_admins ?? false,
        requiredStatusChecks:
          checks === null ? [] : [{ strict: checks.strict, contexts: checks.contexts }],
        requiredPullRequestReviews:
          reviews === null
            ? []
            : [
                {
                  dismissStaleReviews: reviews.dismiss_stale_reviews,
                  requireCodeOwnerReviews: reviews.require_code_owner_reviews,
                  requiredApprovingReviewCount: reviews.required_approving_review_count,
                  requireLastPushApproval: reviews.require_last_push_approval,
                },
              ],
        requiredLinearHistory: branch.required_linear_history,
        allowsForcePushes: branch.allow_force_pushes ?? undefined,
        allowsDeletions: branch.allow_deletions,
        requireConversationResolution: branch.required_conversation_resolution,
        lockBranch: branch.lock_branch,
      },
      opts,
    );
  }

  return { repository: repository.fullName, ciSecrets: plan.ciSecrets };
}
