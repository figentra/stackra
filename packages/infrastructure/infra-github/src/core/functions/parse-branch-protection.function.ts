/**
 * Stackra file contract:
 * Purpose: `parseBranchProtection(document, source?)`, the check of the committed `.github/branch-protection.json`
 *          before the Pulumi slice applies it: one branch and its classic protection rules, in the shape of
 *          `tools/schemas/branch-protection.schema.json`.
 * Boundary: a parsed JSON value in, a typed document out; reading the file is `readGithubRules`'s (`./node`).
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 8), ADR 0325 (rule 1: a deploy checks its inputs before it starts).
 */
import { BRANCH_PROTECTION_DOCUMENT_SCHEMA } from "#core/constants/branch-protection-document-schema.constant";
import { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";
import { issuesOf } from "#core/functions/issues-of.function";
import type { BranchProtectionDocument } from "#core/types/branch-protection-document.type";

/**
 * The checked branch protection.
 *
 * @param document - the parsed JSON of the file.
 * @param source - the file path or a description, for the error; defaults to `branch protection`.
 * @throws GithubInfraInvalidError naming every invalid path: a missing nullable key GitHub requires, an approval count
 *         outside 0 to 6, a push restriction, or another setting the provider cannot apply while it is on.
 * @example
 * const protection = parseBranchProtection(JSON.parse(text), ".github/branch-protection.json");
 * protection.branch; // "main"
 */
export function parseBranchProtection(
  document: unknown,
  source = "branch protection",
): BranchProtectionDocument {
  const result = BRANCH_PROTECTION_DOCUMENT_SCHEMA.safeParse(document);
  if (!result.success) throw new GithubInfraInvalidError(source, issuesOf(result.error));
  return result.data;
}
