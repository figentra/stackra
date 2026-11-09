/**
 * Stackra file contract:
 * Purpose: `constitutionFindings(context)`: one `constitution` finding when `.flow/constitution.md` is missing or
 *          differs from what the docs laws render to; none for a repository without laws.
 * Boundary: reads the laws and the rendered file; writes nothing (`stackra constitution` writes it).
 * Runtime: node
 * Governing contract: ADR 0510; STA-2098 (H6).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { CONSTITUTION_PATHS } from "#node/constants/constitution-paths.constant";
import { expectedConstitution } from "#node/functions/expected-constitution.function";
import type { RawFinding } from "#node/types/raw-finding.type";
import type { RepoContext } from "#node/types/repo-context.type";

/**
 * The constitution's drift findings.
 *
 * @param context - the root.
 * @example
 * constitutionFindings(readRepoContext(root)); // [] when .flow/constitution.md is current
 */
export function constitutionFindings(context: RepoContext): RawFinding[] {
  const expected = expectedConstitution(context.root);
  if (expected === undefined) return [];
  const path = join(context.root, CONSTITUTION_PATHS.output);
  const current = existsSync(path) ? readFileSync(path, "utf8") : undefined;
  if (current === expected) return [];
  return [
    {
      rule: "constitution",
      dir: "",
      text: `${CONSTITUTION_PATHS.output} is ${current === undefined ? "missing" : "out of date"}: run \`stackra constitution\` and commit it`,
    },
  ];
}
