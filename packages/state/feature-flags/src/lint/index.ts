/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./lint` entry of @stackra/feature-flags (the `feature-flags` oxlint plugin and its
 *          rule) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; the plugin is also the default export oxlint loads. Imports no
 *           other entry of this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0129; ADR 0213 (decision 7).
 */
export {
  FEATURE_FLAGS_LINT_PLUGIN,
  FEATURE_FLAGS_LINT_PLUGIN as default,
} from "#lint/constants/feature-flags-lint-plugin.constant";
export { NO_PLAN_TARGETING_RULE } from "#lint/constants/no-plan-targeting-rule.constant";
export type { LintNode } from "#lint/types/lint-node.type";
export type { LintRule } from "#lint/types/lint-rule.type";
