/**
 * Stackra file contract:
 * Purpose: `catalogueFindings(context)`, the `catalogues` phase of `stackra check`: `checkCatalogues` over every lang file.
 * Boundary: reads the listed lang files; returns findings and never prints.
 * Runtime: node
 * Governing contract: ADR 0403.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { LANG_FILE_PATTERN } from "#node/constants/lang-file-pattern.constant";
import { checkCatalogues } from "#node/functions/check-catalogues.function";
import type { RawFinding } from "#node/types/raw-finding.type";
import type { RepoContext } from "#node/types/repo-context.type";

/**
 * The catalogue findings of the repository.
 *
 * @param context - the root and its file list.
 * @example
 * catalogueFindings(readRepoContext(root));
 */
export function catalogueFindings(context: RepoContext): RawFinding[] {
  const { root, files } = context;
  return checkCatalogues(
    files.filter((path) => LANG_FILE_PATTERN.test(path)),
    (path) => readFileSync(join(root, path), "utf8"),
  ).map((text) => ({ rule: "catalogues", dir: "", text }));
}
