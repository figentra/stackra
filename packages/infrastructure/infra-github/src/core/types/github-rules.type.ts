/**
 * Stackra file contract:
 * Purpose: `GithubRules`, the repository's committed branch and tag rules: every `.github/rulesets/*.json` and the
 *          optional `.github/branch-protection.json`, each checked.
 * Boundary: type only; `readGithubRules` (`./node`) builds it and `githubStack` applies it.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 8: rulesets through the Pulumi GitHub provider).
 */
import type { BranchProtectionDocument } from "#core/types/branch-protection-document.type";
import type { RulesetDocument } from "#core/types/ruleset-document.type";

/** The committed rules of one repository. */
export type GithubRules = {
  /** The rulesets, in file name order. */
  readonly rulesets: readonly RulesetDocument[];
  /** The classic branch protection, when the repository commits one. */
  readonly branchProtection?: BranchProtectionDocument;
};
