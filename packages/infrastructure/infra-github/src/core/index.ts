/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/infra-github until `stackra gen` writes the entry barrels
 *          (STA-339): the GitHub plan read from the root runway, the checks of the committed ruleset and branch
 *          protection files, their enum, error and types.
 * Boundary: names each re-export and declares nothing. Isomorphic: no Pulumi and no Node import, so `stackra infra
 *           gen` and `stackra validate` can use it anywhere; reading files and applying the plan are `./node`'s. The
 *           zod schemas, `issuesOf` and `mappable` stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 (the infrastructure
 *                     category and its entries).
 */
export { GithubVisibility } from "#core/enums/github-visibility.enum";
export { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";
export { githubPlan } from "#core/functions/github-plan.function";
export { parseBranchProtection } from "#core/functions/parse-branch-protection.function";
export { parseRuleset } from "#core/functions/parse-ruleset.function";
export type { BranchProtectionDocument } from "#core/types/branch-protection-document.type";
export type { GithubEnvironment } from "#core/types/github-environment.type";
export type { GithubPlan } from "#core/types/github-plan.type";
export type { GithubRules } from "#core/types/github-rules.type";
export type { RulesetDocument } from "#core/types/ruleset-document.type";
