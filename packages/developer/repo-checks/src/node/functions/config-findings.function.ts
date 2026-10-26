/**
 * Stackra file contract:
 * Purpose: `configFindings(context)`, the `config` phase of `stackra check`: JSON versus JSONC versus YAML, YAML flow
 *          mappings (each file must also parse), and `.stackra/` in `.gitignore`.
 * Boundary: reads the listed files; returns findings and never prints.
 * Runtime: node
 * Governing contract: the YAML standard (STA-299); ADR 0295 (decision 5).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { checkGitignore } from "#node/functions/check-gitignore.function";
import { checkJsonConfigs } from "#node/functions/check-json-configs.function";
import { checkYamlFlowMaps } from "#node/functions/check-yaml-flow-maps.function";
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
  return [
    ...of("json-configs", checkJsonConfigs(files)),
    ...files
      .filter(isRepoOwnedYaml)
      .flatMap((p) =>
        of("yaml-flow-maps", checkYamlFlowMaps(p, readFileSync(join(root, p), "utf8"))),
      ),
    ...of(
      "gitignore-stackra",
      checkGitignore(existsSync(gitignore) ? readFileSync(gitignore, "utf8") : undefined),
    ),
  ];
}
