/**
 * Stackra file contract:
 * Purpose: `RowSecurityDeclarationsCommand`, `stackra row-security-declarations`: lists every `t.platformTable` and
 *          `t.reviewedPolicy` declaration in the repository's migrations with its reason (the `--json` data), so each
 *          is reviewed, then fails on a declaration without a reason or not in the review list
 *          (`tools/scripts/row-security-declarations.yaml`), and on a listed one no migration makes. `validate
 *          --repository` runs the same check.
 * Boundary: reads the workspace's migrations and the review list; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table); ADR 0347 (decision 5); ADR 0506.
 */
import { Command, type CommandIo } from "@stackra/console";

import { reportFindings } from "#node/functions/report-findings.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { rowSecurityDeclarationFindings } from "#node/row-security-declarations/functions/row-security-declaration-findings.function";
import { rowSecurityDeclarations } from "#node/row-security-declarations/functions/row-security-declarations.function";

/** Lists the row-security declarations and fails on one that is not reviewed. */
export class RowSecurityDeclarationsCommand extends Command({
  name: "row-security-declarations",
  description:
    "List every t.platformTable and t.reviewedPolicy declaration with its reason; fail on one not reviewed",
  bin: true,
}) {
  /** Prints the declarations, then the findings. */
  async handle(io: CommandIo): Promise<number> {
    const root = workspaceRoot(io.cwd);
    const declarations = rowSecurityDeclarations(root);
    const findings = rowSecurityDeclarationFindings(root, declarations);
    if (io.json) {
      io.output.json({ declarations, findings });
      return findings.length > 0 ? 1 : 0;
    }
    if (declarations.length > 0)
      io.output.checklist({
        rows: declarations.map((declaration) => ({
          name: `${declaration.kind} ${declaration.file}#${declaration.table}`,
          status: "pass" as const,
          detail: [declaration.policies.join(", "), declaration.reason ?? ""]
            .filter(Boolean)
            .join(": "),
        })),
      });
    return reportFindings(io, findings, `${declarations.length} declaration(s), each reviewed`);
  }
}
