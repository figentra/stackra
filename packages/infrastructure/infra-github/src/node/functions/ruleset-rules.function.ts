/**
 * Stackra file contract:
 * Purpose: `rulesetRules(rules)`, the rules of a committed ruleset (GitHub's REST list, snake_case) as the Pulumi
 *          GitHub provider's `RepositoryRuleset.rules` input (one camelCase block per rule type).
 * Boundary: internal; `githubStack` calls it. `parseRuleset` has already refused every rule and setting the provider
 *           cannot apply, so the mapping is total and drops nothing that is on.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 8: rulesets through the Pulumi GitHub provider).
 */
import type * as github from "@pulumi/github";

import type { RulesetDocument } from "#core/types/ruleset-document.type";

/** The provider's flag for each REST rule type that has no parameters. */
const FLAGS = {
  creation: "creation",
  deletion: "deletion",
  non_fast_forward: "nonFastForward",
  required_linear_history: "requiredLinearHistory",
  required_signatures: "requiredSignatures",
} as const;

/**
 * The provider's rules block.
 *
 * @example
 * rulesetRules([{ type: "deletion" }, { type: "required_linear_history" }]);
 * // { deletion: true, requiredLinearHistory: true }
 */
export function rulesetRules(
  rules: RulesetDocument["rules"],
): github.types.input.RepositoryRulesetRules {
  const out: github.types.input.RepositoryRulesetRules = {};
  for (const rule of rules) {
    switch (rule.type) {
      case "update":
        out.update = true;
        out.updateAllowsFetchAndMerge = rule.parameters?.update_allows_fetch_and_merge;
        break;
      case "pull_request":
        out.pullRequest = {
          allowedMergeMethods: rule.parameters.allowed_merge_methods,
          dismissStaleReviewsOnPush: rule.parameters.dismiss_stale_reviews_on_push,
          requireCodeOwnerReview: rule.parameters.require_code_owner_review,
          requireLastPushApproval: rule.parameters.require_last_push_approval,
          requiredApprovingReviewCount: rule.parameters.required_approving_review_count,
          requiredReviewThreadResolution: rule.parameters.required_review_thread_resolution,
        };
        break;
      case "required_status_checks":
        out.requiredStatusChecks = {
          requiredChecks: rule.parameters.required_status_checks.map((check) => ({
            context: check.context,
            integrationId: check.integration_id,
          })),
          strictRequiredStatusChecksPolicy: rule.parameters.strict_required_status_checks_policy,
          doNotEnforceOnCreate: rule.parameters.do_not_enforce_on_create,
        };
        break;
      case "merge_queue":
        out.mergeQueue = {
          checkResponseTimeoutMinutes: rule.parameters?.check_response_timeout_minutes,
          groupingStrategy: rule.parameters?.grouping_strategy,
          maxEntriesToBuild: rule.parameters?.max_entries_to_build,
          maxEntriesToMerge: rule.parameters?.max_entries_to_merge,
          mergeMethod: rule.parameters?.merge_method,
          minEntriesToMerge: rule.parameters?.min_entries_to_merge,
          minEntriesToMergeWaitMinutes: rule.parameters?.min_entries_to_merge_wait_minutes,
        };
        break;
      default:
        out[FLAGS[rule.type]] = true;
    }
  }
  return out;
}
