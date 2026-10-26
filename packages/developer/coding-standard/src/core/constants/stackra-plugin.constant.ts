/**
 * Stackra file contract:
 * Purpose: `STACKRA_PLUGIN`, the `.` entry of @stackra/coding-standard: the oxlint JS plugin named `stackra` that
 *          holds every house rule, loaded by an oxlint config through `"jsPlugins": ["@stackra/coding-standard"]`
 *          and enabled per rule as `"stackra/<rule>": "error"`.
 * Boundary: data only; registers the rules and turns none on. Which rules run, and where, is the oxlint preset's
 *           choice (`@stackra/oxlint-config`). The default export is the same object, because oxlint loads a plugin
 *           module's default export. The repo's oxlint base preset loads this file from source (Node strips its
 *           types, ADR 0421), so this file and every rule it reaches import values only by relative `.ts` paths;
 *           a `#core/...` value import would not resolve in Node. Type imports may keep the alias.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (decisions 1 and 5); ADR 0294 (Enforcement, STA-338 and STA-340); ADR 0305 (rules
 *                     13 and 15); ADR 0127 2026-10-24 note (coding-standard in developer, entry `.`); ADR 0421.
 */
import { BASE_MATCHES_SUFFIX_RULE } from "./base-matches-suffix-rule.constant.ts";
import { DISABLE_NEEDS_REASON_RULE } from "./disable-needs-reason-rule.constant.ts";
import { DOCBLOCK_SHAPE_RULE } from "./docblock-shape-rule.constant.ts";
import { FILE_CONTRACT_RULE } from "./file-contract-rule.constant.ts";
import { HOOK_FILE_NAME_RULE } from "./hook-file-name-rule.constant.ts";
import { LINES_BETWEEN_CLASS_MEMBERS_RULE } from "./lines-between-class-members-rule.constant.ts";
import { MEMBER_ORDER_RULE } from "./member-order-rule.constant.ts";
import { MULTILINE_DECORATOR_OPTIONS_RULE } from "./multiline-decorator-options-rule.constant.ts";
import { NO_EMPTY_DECORATOR_RULE } from "./no-empty-decorator-rule.constant.ts";
import { NO_EMPTY_MODULE_RULE } from "./no-empty-module-rule.constant.ts";
import { NO_ENUM_RULE } from "./no-enum-rule.constant.ts";
import { NO_HASH_PRIVATE_RULE } from "./no-hash-private-rule.constant.ts";
import { NO_KIND_DECORATOR_RULE } from "./no-kind-decorator-rule.constant.ts";
import { NO_PARAMETER_DECORATOR_RULE } from "./no-parameter-decorator-rule.constant.ts";
import { NO_RAW_KEY_LITERAL_RULE } from "./no-raw-key-literal-rule.constant.ts";
import { NO_TENANT_VOCABULARY_RULE } from "./no-tenant-vocabulary-rule.constant.ts";
import { ONE_DECLARATION_PER_FILE_RULE } from "./one-declaration-per-file-rule.constant.ts";
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
    "file-contract": FILE_CONTRACT_RULE,
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
    "no-raw-key-literal": NO_RAW_KEY_LITERAL_RULE,
    "no-tenant-vocabulary": NO_TENANT_VOCABULARY_RULE,
    "one-declaration-per-file": ONE_DECLARATION_PER_FILE_RULE,
  },
};

export default STACKRA_PLUGIN;
