/**
 * Stackra file contract:
 * Purpose: `docsFindings(context)`, the `docs` phase of `stackra check`: `checkDocFile` over every doc-scoped source file.
 * Boundary: reads the listed source files; returns findings and never prints.
 * Runtime: node
 * Governing contract: ADR 0007 (amendment 2026-10-21).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { checkDocFile } from "#node/functions/check-doc-file.function";
import { isDocScoped } from "#node/functions/is-doc-scoped.function";
import type { RawFinding } from "#node/types/raw-finding.type";
import type { RepoContext } from "#node/types/repo-context.type";

/**
 * The doc-standard findings of the repository.
 *
 * @param context - the root and its file list.
 * @example
 * docsFindings(readRepoContext(root));
 */
export function docsFindings(context: RepoContext): RawFinding[] {
  const { root, files } = context;
  return files
    .filter(isDocScoped)
    .flatMap((path) => checkDocFile(path, readFileSync(join(root, path), "utf8")))
    .map((text) => ({ rule: "doc-standard", dir: "", text }));
}
