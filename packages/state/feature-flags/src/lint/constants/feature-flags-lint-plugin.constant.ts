/**
 * Stackra file contract:
 * Purpose: `FEATURE_FLAGS_LINT_PLUGIN`, the `./lint` entry of @stackra/feature-flags: the oxlint JS plugin named
 *          `feature-flags` with the `no-plan-targeting` rule, loaded by an oxlint config through
 *          `"jsPlugins": ["@stackra/feature-flags/lint"]` and enabled as `"feature-flags/no-plan-targeting": "error"`.
 * Boundary: data only; registers the rule and turns nothing on. The default export is the same object, because oxlint
 *           loads a plugin module's default export. The repo's oxlint base preset loads this file from source (Node
 *           strips its types), so lint needs no built dist: its one value import is a relative `.ts` path, and the
 *           rule file imports types only. Keep both that way; a `#lint/...` value import would not resolve in Node.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 7); ADR 0129 (house rules as an oxlint jsPlugin); ADR 0421.
 */
import { NO_PLAN_TARGETING_RULE } from "./no-plan-targeting-rule.constant.ts";

/**
 * The `feature-flags` oxlint plugin.
 *
 * @example
 * ```jsonc
 * { "jsPlugins": ["@stackra/feature-flags/lint"], "rules": { "feature-flags/no-plan-targeting": "error" } }
 * ```
 */
export const FEATURE_FLAGS_LINT_PLUGIN = {
  meta: { name: "feature-flags" },
  rules: { "no-plan-targeting": NO_PLAN_TARGETING_RULE },
} as const;

export default FEATURE_FLAGS_LINT_PLUGIN;
