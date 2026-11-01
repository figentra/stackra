/**
 * Stackra file contract:
 * Purpose: `hookDiagnosticFinding(phase, diagnostic, path)`, the `rules-of-hooks` finding of one oxlint diagnostic on a
 *          compiled file, placed on the source file it came from.
 * Boundary: pure. The compile keeps every line (`retainLines`), so the line is the source line; the column is dropped
 *           because the compiled column can differ from the source's.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 41).
 */
import type { Finding } from "@stackra/repo-checks/node";

import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";
import type { HookDiagnostic } from "#node/types/hook-diagnostic.type";

/**
 * The finding for `diagnostic`, at `path` (the source file).
 *
 * @param phase - the `hooks` phase.
 * @param diagnostic - one entry of oxlint's `-f json` output.
 * @param path - the repository-relative source path.
 * @example
 * hookDiagnosticFinding(HOOKS_PHASE, { message: "Hook is called conditionally", labels: [{ span: { line: 7 } }] }, "a.tsx");
 */
export function hookDiagnosticFinding(
  phase: Pick<CheckPhase, "name" | "tool" | "adr">,
  diagnostic: HookDiagnostic,
  path: string,
): Finding {
  return toolFinding(phase, {
    rule: "rules-of-hooks",
    path,
    line: diagnostic.labels?.[0]?.span?.line ?? null,
    message: diagnostic.message,
  });
}
