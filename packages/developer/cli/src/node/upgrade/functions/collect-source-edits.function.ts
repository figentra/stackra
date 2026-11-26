/**
 * Stackra file contract:
 * Purpose: `collectSourceEdits(root, codemods)`, the source codemods of an upgrade over every source file of the
 *          workspace (`listUpgradeSources`): the edits they make and the places they leave to a person. Loads ast-grep
 *          and ts-morph only when a codemod has renames or a report.
 * Boundary: reads the source files; writes nothing (the command writes the edits).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2: ast-grep and ts-morph); STA-145.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createCodemodProject } from "#node/upgrade/functions/create-codemod-project.function";
import { listUpgradeSources } from "#node/upgrade/functions/list-upgrade-sources.function";
import { loadCodemodEngines } from "#node/upgrade/functions/load-codemod-engines.function";
import { runSourceCodemods } from "#node/upgrade/functions/run-source-codemods.function";
import type { SourceEdits } from "#node/upgrade/types/source-edits.type";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";
import type { UpgradeFileEdit } from "#node/upgrade/types/upgrade-file-edit.type";
import type { UpgradeFinding } from "#node/upgrade/types/upgrade-finding.type";

/**
 * The source edits and findings of the codemods.
 *
 * @example
 * const { edits, findings } = await collectSourceEdits("/repo", plan.codemods);
 */
export async function collectSourceEdits(
  root: string,
  codemods: readonly UpgradeCodemod[],
): Promise<SourceEdits> {
  const sourceCodemods = codemods.filter(
    (codemod) => codemod.renames !== undefined || codemod.report !== undefined,
  );
  if (sourceCodemods.length === 0) return { edits: [], findings: [] };
  const engines = await loadCodemodEngines();
  const project = createCodemodProject(engines);
  const edits: UpgradeFileEdit[] = [];
  const findings: UpgradeFinding[] = [];
  for (const file of listUpgradeSources(root)) {
    const before = readFileSync(join(root, file), "utf8");
    const result = runSourceCodemods(engines, project, file, before, sourceCodemods);
    findings.push(...result.findings);
    if (result.text !== before)
      edits.push({ file, before, after: result.text, by: result.changedBy });
  }
  return { edits, findings };
}
