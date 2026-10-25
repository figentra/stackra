/**
 * Stackra file contract:
 * Purpose: `parseRuleset(document, source?)`, the check of one committed `.github/rulesets/<name>.json` before the
 *          Pulumi slice applies it: a branch or tag ruleset with its ref conditions, bypass actors and rules.
 * Boundary: a parsed JSON value in, a typed document out; reading the file is `readGithubRules`'s (`./node`).
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 8: rulesets through the Pulumi GitHub provider), ADR 0325 (rule 1: a deploy
 *                     checks its inputs before it starts).
 */
import { RULESET_DOCUMENT_SCHEMA } from "#core/constants/ruleset-document-schema.constant";
import { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";
import { issuesOf } from "#core/functions/issues-of.function";
import type { RulesetDocument } from "#core/types/ruleset-document.type";

/**
 * The checked ruleset.
 *
 * @param document - the parsed JSON of the file.
 * @param source - the file path or a description, for the error; defaults to `ruleset`.
 * @throws GithubInfraInvalidError naming every invalid path: a push target, a missing ref condition, a rule type this
 *         package does not apply, a rule type given twice, or a setting the provider cannot apply while it is on.
 * @example
 * const main = parseRuleset(JSON.parse(text), ".github/rulesets/main.json");
 * main.rules.map((rule) => rule.type); // ["deletion", "non_fast_forward", "pull_request", …]
 */
export function parseRuleset(document: unknown, source = "ruleset"): RulesetDocument {
  const result = RULESET_DOCUMENT_SCHEMA.safeParse(document);
  if (!result.success) throw new GithubInfraInvalidError(source, issuesOf(result.error));
  return result.data;
}
