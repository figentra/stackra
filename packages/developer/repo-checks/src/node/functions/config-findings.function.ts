/**
 * Stackra file contract:
 * Purpose: `configFindings(context)`, the `config` phase of `stackra check`: JSON versus JSONC versus YAML, YAML flow
 *          mappings (each file must also parse), `.stackra/` in `.gitignore`, and the ADR number register (STA-1732).
 * Boundary: reads the listed files; returns findings and never prints.
 * Runtime: node
 * Governing contract: the YAML standard (STA-299); ADR 0295 (decision 5); STA-1732.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { checkAdrNumbers } from "#node/functions/check-adr-numbers.function";
import { checkGitignore } from "#node/functions/check-gitignore.function";
import { checkJsonConfigs } from "#node/functions/check-json-configs.function";
import { checkYamlFlowMaps } from "#node/functions/check-yaml-flow-maps.function";
import { fillTemplateTokens } from "#node/functions/fill-template-tokens.function";
import { isRepoOwnedYaml } from "#node/functions/is-repo-owned-yaml.function";
import type { RawFinding } from "#node/types/raw-finding.type";
import type { RepoContext } from "#node/types/repo-context.type";

/** Repository-level raw findings of one rule. */
const of = (rule: string, texts: readonly string[]): RawFinding[] =>
  texts.map((text) => ({ rule, dir: "", text }));

/**
 * The config findings of the repository.
 *
 * @param context - the root and its file list.
 * @example
 * configFindings(readRepoContext(root));
 */
export function configFindings(context: RepoContext): RawFinding[] {
  const { root, files } = context;
  const gitignore = join(root, ".gitignore");
  const numbers = join(root, "apps/docs/adr/numbers.yaml");
  return [
    ...of("json-configs", checkJsonConfigs(files)),
    ...files
      .filter(isRepoOwnedYaml)
      .flatMap((p) =>
        of(
          "yaml-flow-maps",
          checkYamlFlowMaps(p, fillTemplateTokens(p, readFileSync(join(root, p), "utf8"))),
        ),
      ),
    ...of(
      "gitignore-stackra",
      checkGitignore(existsSync(gitignore) ? readFileSync(gitignore, "utf8") : undefined),
    ),
    ...of(
      "adr-numbers",
      checkAdrNumbers(files, existsSync(numbers) ? readFileSync(numbers, "utf8") : undefined),
    ),
  ];
}
