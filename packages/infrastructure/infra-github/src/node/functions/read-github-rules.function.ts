/**
 * Stackra file contract:
 * Purpose: `readGithubRules(directory)`, the repository's committed branch and tag rules read from its `.github`
 *          folder: every `rulesets/*.json` in file name order, and `branch-protection.json` when present, each parsed
 *          as JSON and checked.
 * Boundary: reads files only; never writes and never calls GitHub. A folder without rules gives no rulesets and no
 *           branch protection.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 8: rulesets through the Pulumi GitHub provider), ADR 0119 and ADR 0166 (the
 *                     committed `main` ruleset), `tools/schemas/branch-protection.schema.json`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";
import { parseBranchProtection } from "#core/functions/parse-branch-protection.function";
import { parseRuleset } from "#core/functions/parse-ruleset.function";
import type { GithubRules } from "#core/types/github-rules.type";

/**
 * The checked rules under `directory`.
 *
 * @param directory - the repository's `.github` folder.
 * @throws GithubInfraInvalidError when a rules file is not JSON or fails its check.
 * @example
 * const rules = readGithubRules(".github");
 * rules.rulesets.map((ruleset) => ruleset.name); // ["main"]
 */
export function readGithubRules(directory: string): GithubRules {
  const json = (file: string): unknown => {
    try {
      return JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      throw new GithubInfraInvalidError(file, [
        { path: "", message: `Not readable as JSON: ${(error as Error).message}` },
      ]);
    }
  };

  const folder = join(directory, "rulesets");
  const rulesets = existsSync(folder)
    ? readdirSync(folder)
        .filter((name) => name.endsWith(".json"))
        .sort()
        .map((name) => parseRuleset(json(join(folder, name)), join(folder, name)))
    : [];
  const file = join(directory, "branch-protection.json");
  return existsSync(file)
    ? { rulesets, branchProtection: parseBranchProtection(json(file), file) }
    : { rulesets };
}
