/**
 * Stackra file contract:
 * Purpose: `reportCodemodFindings(root, codemod, file)`, the ast-grep half of a source codemod: every match of the
 *          codemod's report rule in one parsed file, as findings a person acts on.
 * Boundary: pure over the ast-grep tree it is given; the caller checks that the file imports from the report's
 *           modules first (`sourceModules`).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2: ast-grep); STA-145.
 */
import type { SgNode } from "@ast-grep/napi";

import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";
import type { UpgradeFinding } from "#node/upgrade/types/upgrade-finding.type";

/**
 * The report findings of one codemod in one file.
 *
 * @param file - the file, relative to the workspace root.
 * @example
 * reportCodemodFindings(root, ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_CODEMOD, "src/my-store.ts");
 * // [{ codemod: "actions-idempotency-complete-refused", file: "src/my-store.ts", line: 3, column: 1, … }]
 */
export function reportCodemodFindings(
  root: SgNode,
  codemod: UpgradeCodemod,
  file: string,
): readonly UpgradeFinding[] {
  if (codemod.report === undefined) return [];
  const { rule, message } = codemod.report;
  return root.findAll({ rule }).map((node) => {
    const { start } = node.range();
    return {
      codemod: codemod.id,
      file,
      line: start.line + 1,
      column: start.column + 1,
      code: (node.text().split("\n")[0] ?? "").trim(),
      message,
    };
  });
}
