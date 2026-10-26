/**
 * Stackra file contract:
 * Purpose: `FORMAT_PHASE`, phase 2 of `stackra check`: oxfmt lists the files it would change (`--fix` writes them first),
 *          one fixable finding per file.
 * Boundary: starts oxfmt at the root over the affected files or the whole tree; skipped when oxfmt is not installed.
 *           Exit 2 (every given file is on oxfmt's ignore list) is not a finding.
 * Runtime: node
 * Governing contract: ADR 0300 (published tooling presets).
 */
import { exitFinding } from "#node/functions/exit-finding.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";

/** The `format` phase. */
export const FORMAT_PHASE: CheckPhase = {
  name: "format",
  tool: "oxfmt",
  adr: "0300",
  async run({ root, fix, files }) {
    if (files !== undefined && files.length === 0) return { findings: [] };
    const paths = [...(files ?? []), "--no-error-on-unmatched-pattern"];
    if (fix && (await runCaptured("oxfmt", ["--write", ...paths], root)) === undefined)
      return { findings: [], skipped: "not installed" };
    const output = await runCaptured("oxfmt", ["--list-different", ...paths], root);
    if (output === undefined) return { findings: [], skipped: "not installed" };
    if (output.code === 0 || output.code === 2) return { findings: [] };
    const listed = output.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (listed.length === 0) return { findings: [exitFinding(FORMAT_PHASE, output)] };
    return {
      findings: listed.map((path) =>
        toolFinding(FORMAT_PHASE, {
          rule: "format",
          path,
          message: "not formatted; `stackra check --fix` or `oxfmt --write` formats it",
          fixable: true,
        }),
      ),
    };
  },
};
