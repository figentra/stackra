/**
 * Stackra file contract:
 * Purpose: `STACKRA_PLUGIN`, the `.` entry of @stackra/coding-standard: the oxlint JS plugin named `stackra` that
 *          holds every house rule, loaded by an oxlint config through `"jsPlugins": ["@stackra/coding-standard"]`
 *          and enabled per rule as `"stackra/<rule>": "error"`.
 * Boundary: data only; registers the rules and turns none on. Which rules run, and where, is the oxlint preset's
 *           choice (`@stackra/oxlint-config`). The default export is the same object, because oxlint loads a plugin
 *           module's default export.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (decisions 1 and 5); ADR 0294 (Enforcement, STA-338 and STA-340); ADR 0305 (rules
 *                     13 and 15); ADR 0127 2026-10-24 note (coding-standard in developer, entry `.`).
 */
import { BASE_MATCHES_SUFFIX_RULE } from "#core/constants/base-matches-suffix-rule.constant";
import { DISABLE_NEEDS_REASON_RULE } from "#core/constants/disable-needs-reason-rule.constant";
import { DOCBLOCK_SHAPE_RULE } from "#core/constants/docblock-shape-rule.constant";
import { HOOK_FILE_NAME_RULE } from "#core/constants/hook-file-name-rule.constant";
import { LINES_BETWEEN_CLASS_MEMBERS_RULE } from "#core/constants/lines-between-class-members-rule.constant";
import { MEMBER_ORDER_RULE } from "#core/constants/member-order-rule.constant";
import { MULTILINE_DECORATOR_OPTIONS_RULE } from "#core/constants/multiline-decorator-options-rule.constant";
import { NO_EMPTY_DECORATOR_RULE } from "#core/constants/no-empty-decorator-rule.constant";
import { NO_EMPTY_MODULE_RULE } from "#core/constants/no-empty-module-rule.constant";
import { NO_ENUM_RULE } from "#core/constants/no-enum-rule.constant";
import { NO_HASH_PRIVATE_RULE } from "#core/constants/no-hash-private-rule.constant";
import { NO_KIND_DECORATOR_RULE } from "#core/constants/no-kind-decorator-rule.constant";
import { NO_PARAMETER_DECORATOR_RULE } from "#core/constants/no-parameter-decorator-rule.constant";
import { ONE_DECLARATION_PER_FILE_RULE } from "#core/constants/one-declaration-per-file-rule.constant";
import type { Plugin } from "#core/types/plugin.type";

/**
 * The `stackra` oxlint plugin: the house rules oxlint lacks. Enable each rule in an oxlint config.
 *
 * @example
 * ```jsonc
 * {
 *   "jsPlugins": ["@stackra/coding-standard"],
 *   "rules": { "stackra/base-matches-suffix": "error", "stackra/lines-between-class-members": "error" }
 * }
 * ```
 */
export const STACKRA_PLUGIN: Plugin = {
  meta: { name: "stackra" },
  rules: {
    "base-matches-suffix": BASE_MATCHES_SUFFIX_RULE,
    "disable-needs-reason": DISABLE_NEEDS_REASON_RULE,
    "docblock-shape": DOCBLOCK_SHAPE_RULE,
    "hook-file-name": HOOK_FILE_NAME_RULE,
    "lines-between-class-members": LINES_BETWEEN_CLASS_MEMBERS_RULE,
    "member-order": MEMBER_ORDER_RULE,
    "multiline-decorator-options": MULTILINE_DECORATOR_OPTIONS_RULE,
    "no-empty-decorator": NO_EMPTY_DECORATOR_RULE,
    "no-empty-module": NO_EMPTY_MODULE_RULE,
    "no-enum": NO_ENUM_RULE,
    "no-hash-private": NO_HASH_PRIVATE_RULE,
    "no-kind-decorator": NO_KIND_DECORATOR_RULE,
    "no-parameter-decorator": NO_PARAMETER_DECORATOR_RULE,
    "one-declaration-per-file": ONE_DECLARATION_PER_FILE_RULE,
  },
};

export default STACKRA_PLUGIN;
